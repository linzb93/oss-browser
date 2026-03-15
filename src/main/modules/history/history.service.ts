import { join, basename } from 'node:path';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import sql from '../../helper/sql';
import { IPage } from '../../types/vo';
import { ossEvents } from '../oss/oss.repository';
import slash from 'slash';

// Define operation types for the queue
interface AddOp {
    type: 'add';
    paths: string[];
    time: string;
}

interface RemoveOp {
    type: 'remove';
    ids: string[];
}

type HistoryOp = AddOp | RemoveOp;

// Queue and timer for batch processing
let opQueue: HistoryOp[] = [];
let timer: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 2000;

/**
 * Schedule a flush of the operation queue
 */
function scheduleFlush() {
    if (timer) return;
    timer = setTimeout(() => {
        flush();
        timer = null;
    }, FLUSH_INTERVAL);
}

/**
 * Flush pending operations to the database
 */
async function flush() {
    if (opQueue.length === 0) return;
    const ops = [...opQueue];
    opQueue = [];

    const id = await sql((db) => db.defaultAppId);
    await sql(id, (db) => {
        let history = db.history || [];

        for (const op of ops) {
            if (op.type === 'add') {
                const newItems = op.paths.map((path) => ({
                    path,
                    createTime: op.time,
                    id: uuidv4(),
                }));
                history = history.concat(newItems);
            } else if (op.type === 'remove') {
                const idsToRemove = new Set(op.ids);
                // Filter by both ID and Path to handle both IPC calls (IDs) and OSS events (Paths)
                history = history.filter((item) => !idsToRemove.has(item.id) && !idsToRemove.has(item.path));
            }
        }
        db.history = history;
    });
}

/**
 * Initialize history service listeners
 */
export function init() {
    ossEvents.on('add', (params) => {
        add(params);
    });
    ossEvents.on('remove', (path) => {
        // ossEvents emits path string, wrap in array
        remove([path]);
    });
}

/**
 * Get history list with pagination
 * @param param Pagination parameters
 */
export async function get(param: IPage) {
    const { pageIndex, pageSize } = param;
    const id = await sql((db) => db.defaultAppId);
    const history = await sql(id, (db) => db.history);
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
 * Add items to history (buffered)
 * @param data Data containing prefix and comma-separated names
 */
export async function add(data: { prefix: string; names: string }) {
    const list = data.names
        .split(',')
        .filter((item) => !item.endsWith('/'))
        .map((item) => slash(join(data.prefix, basename(item))));

    if (list.length > 0) {
        opQueue.push({
            type: 'add',
            paths: list,
            time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        });
        scheduleFlush();
    }
}

/**
 * Remove items from history (buffered)
 * @param ids Array of IDs or Paths to remove
 */
export async function remove(ids: string[]) {
    // Ensure ids is an array (handle potential single string passed erroneously, though typed as array)
    const idsArray = Array.isArray(ids) ? ids : [ids];

    if (idsArray.length > 0) {
        opQueue.push({
            type: 'remove',
            ids: idsArray,
        });
        scheduleFlush();
    }
}
