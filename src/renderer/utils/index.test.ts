import { beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (event: any, payload: any) => void;

/**
 * 构造一个假的 ipcRenderer，记录注册到 'main-post' 上的监听器
 */
const createIpcRenderer = () => {
    const listeners: Listener[] = [];
    const ipcRenderer = {
        listeners,
        on: vi.fn((_channel: string, listener: Listener) => {
            listeners.push(listener);
        }),
        off: vi.fn((_channel: string, listener: Listener) => {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        }),
        send: vi.fn(),
        invoke: vi.fn(),
    };
    return ipcRenderer;
};

let ipcRenderer: ReturnType<typeof createIpcRenderer>;
let handleMainPost: typeof import('./index')['handleMainPost'];

beforeEach(async () => {
    vi.resetModules();
    ipcRenderer = createIpcRenderer();
    vi.stubGlobal('window', { ipcRenderer });
    ({ handleMainPost } = await import('./index'));
});

describe('handleMainPost', () => {
    it('注册多个 method 时只向 ipcRenderer 注册一个 main-post 监听器', () => {
        for (let i = 0; i < 20; i += 1) {
            handleMainPost(`method-${i}`, vi.fn());
        }
        expect(ipcRenderer.on).toHaveBeenCalledTimes(1);
        expect(ipcRenderer.listeners).toHaveLength(1);
    });

    it('按 method 分发给对应处理器', async () => {
        const back = vi.fn();
        const reload = vi.fn();
        handleMainPost('back', back);
        handleMainPost('reload', reload);

        await ipcRenderer.listeners[0]({}, { method: 'reload', data: { isDown: true } });

        expect(reload).toHaveBeenCalledWith({ isDown: true });
        expect(back).not.toHaveBeenCalled();
    });

    it('取消监听后不再触发，未注册的 method 不会报错', async () => {
        const handler = vi.fn();
        const remove = handleMainPost('back', handler);
        remove();

        await expect(
            ipcRenderer.listeners[0]({}, { method: 'back', data: null }),
        ).resolves.toBeUndefined();
        await expect(
            ipcRenderer.listeners[0]({}, { method: 'unknown', data: null }),
        ).resolves.toBeUndefined();
        expect(handler).not.toHaveBeenCalled();
    });

    it('主进程需要回传结果时，只回传一次统一结果', async () => {
        handleMainPost('paste-rename', async () => 'new-name');
        handleMainPost('paste-confirm', async () => true);

        await ipcRenderer.listeners[0]({}, {
            requestId: 1,
            method: 'paste-rename',
            data: { name: 'old-name' },
            listener: true,
        });

        expect(ipcRenderer.send).toHaveBeenCalledTimes(1);
        const [channel, raw] = ipcRenderer.send.mock.calls[0];
        expect(channel).toBe('main-post-receive');
        expect(JSON.parse(raw as string)).toEqual({
            requestId: 1,
            method: 'paste-rename',
            data: 'new-name',
        });
    });
});
