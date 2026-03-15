import { join, basename } from 'node:path';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { sql } from '../../infra/sql';
import { IPage } from '../../types/vo';
import { ossEvents } from '../oss/oss.repository';
import slash from 'slash';

import { Database } from '../../types/api';

// 定义历史记录项结构
type HistoryItem = Database['history'][number];

// 内存缓存状态
let cachedHistory: HistoryItem[] | null = null;
let currentAppId: number | null = null;
let isDirty = false;
let flushTimer: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 2000;

/**
 * 确保当前 app ID 的历史数据已加载到内存中
 */
async function ensureLoaded() {
    // 获取当前 app ID
    const appId = await sql((db) => db.defaultAppId);

    // 如果 app ID 发生变化或缓存为空，重新加载
    if (appId !== currentAppId || cachedHistory === null) {
        // 如果前一个 app ID 有脏数据，我们可能需要先刷新它。
        // 但为了简单和单用户上下文的安全，我们假设 app ID 切换意味着上下文切换，此时之前的数据已经持久化或现在可以持久化。
        if (isDirty && currentAppId) {
            await flush();
        }

        const history = await sql(appId, (db) => db.history);
        cachedHistory = history || [];
        currentAppId = appId;
        isDirty = false;
    }

    return cachedHistory!;
}

/**
 * 安排将内存缓存刷新到数据库
 */
function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flush();
        flushTimer = null;
    }, FLUSH_INTERVAL);
}

/**
 * 将内存缓存刷新到数据库
 */
async function flush() {
    if (!isDirty || !currentAppId || !cachedHistory) return;

    // 捕获要写入的状态
    const appIdToWrite = currentAppId;
    const historyToWrite = [...cachedHistory];

    await sql(appIdToWrite, (db) => {
        db.history = historyToWrite;
    });

    // 仅当写入期间 app ID 未更改时重置脏标志（单线程中不太可能发生，但为了安全起见）
    if (currentAppId === appIdToWrite) {
        isDirty = false;
    }
}

/**
 * 初始化历史服务监听器
 */
export function init() {
    // 预加载数据
    ensureLoaded().catch(console.error);

    ossEvents.on('add', (params) => {
        add(params);
    });
    ossEvents.on('remove', (path: string) => {
        // ossEvents 发射路径字符串，包装在数组中
        remove([path]);
    });
}

/**
 * 从内存缓存获取分页的历史记录列表
 * @param param 分页参数
 */
export async function get(param: IPage) {
    const history = await ensureLoaded();
    const { pageIndex, pageSize } = param;

    if (!history || !history.length) {
        return {
            list: [],
            totalCount: 0,
        };
    }

    const reverseHistory = [...history].reverse();
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    const list = reverseHistory.slice(start, end);

    return {
        list,
        totalCount: reverseHistory.length,
    };
}

/**
 * 添加项目到历史记录（立即更新内存，稍后刷新）
 * @param data 包含前缀和逗号分隔名称的数据
 */
export async function add(data: { prefix: string; names: string }) {
    const list = data.names
        .split(',')
        .filter((item) => !item.endsWith('/'))
        .map((item) => slash(join(data.prefix, basename(item))));

    if (list.length > 0) {
        await ensureLoaded();
        if (!cachedHistory) return;

        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const newItems = list.map((path) => ({
            path,
            createTime: now,
            id: uuidv4(),
        }));

        cachedHistory = cachedHistory.concat(newItems);
        isDirty = true;
        scheduleFlush();
    }
}

/**
 * 从历史记录中移除项目（立即更新内存，稍后刷新）
 * @param ids 要移除的 ID 或路径数组
 */
export async function remove(ids: string | string[]) {
    // 确保 ids 是数组
    const idsArray = Array.isArray(ids) ? ids : [ids];

    if (idsArray.length > 0) {
        await ensureLoaded();
        if (!cachedHistory) return;

        const idsToRemove = new Set(idsArray);
        // 同时根据 ID 和路径过滤，以处理 IPC 调用 (IDs) 和 OSS 事件 (Paths)
        const initialLength = cachedHistory.length;
        cachedHistory = cachedHistory.filter((item) => !idsToRemove.has(item.id) && !idsToRemove.has(item.path));

        if (cachedHistory.length !== initialLength) {
            isDirty = true;
            scheduleFlush();
        }
    }
}
