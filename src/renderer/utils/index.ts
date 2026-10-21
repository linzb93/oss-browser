type MainPostHandler = (data: any) => any;

/**
 * 以 method 为键的处理器集合。
 * 整个渲染进程只向 ipcRenderer 注册一个 'main-post' 监听器，收到消息后再按 method 分发，
 * 避免大量业务处理器各自注册监听导致 EventEmitter 超过默认 10 个监听器上限而报警。
 */
const handlers = new Map<string, Set<MainPostHandler>>();
let listenerBound = false;

/**
 * 收到主进程消息后按 method 分发
 * @param _event ipcRenderer 事件对象
 * @param payload 主进程发送的消息体
 */
const dispatch = async (_event: any, payload: any) => {
    if (!payload) {
        return;
    }
    const { requestId, method, data, listener } = payload;
    const methodHandlers = handlers.get(method);
    if (!methodHandlers || methodHandlers.size === 0) {
        return;
    }
    console.groupCollapsed(`收到来自主进程发起的请求：%c${method}`, 'color:orange');
    console.log(data);
    console.groupEnd();
    let ret: any;
    for (const handler of [...methodHandlers]) {
        ret = await handler(data);
    }
    if (listener) {
        window.ipcRenderer.send(
            'main-post-receive',
            JSON.stringify({
                requestId,
                method,
                data: ret,
            }),
        );
    }
};

/**
 * 确保全局只注册一个 'main-post' 监听器
 */
const bindMainPostListener = () => {
    if (listenerBound) {
        return;
    }
    listenerBound = true;
    window.ipcRenderer.on('main-post', dispatch);
};

/**
 * 处理来自主进程的请求
 * @param receiveMethod 请求名称
 * @param callback 回调函数
 * @returns 取消监听的方法
 */
export const handleMainPost = (receiveMethod: string, callback: MainPostHandler) => {
    bindMainPostListener();
    const existing = handlers.get(receiveMethod);
    const methodHandlers = existing ?? new Set<MainPostHandler>();
    if (!existing) {
        handlers.set(receiveMethod, methodHandlers);
    }
    methodHandlers.add(callback);
    return () => {
        methodHandlers.delete(callback);
        if (methodHandlers.size === 0) {
            handlers.delete(receiveMethod);
        }
    };
};
