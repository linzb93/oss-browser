/**
 * 处理来自主进程的请求
 * @param receiveMethod 请求名称
 * @param callback 回调函数
 */
export const handleMainPost = (receiveMethod: string, callback: Function) => {
    window.ipcRenderer.on('main-post', async (_, { requestId, method, data, listener }) => {
        if (receiveMethod === method) {
            console.groupCollapsed(`收到来自主进程发起的请求：%c${receiveMethod}`, 'color:orange');
            console.log(data);
            console.groupEnd();
            if (method !== receiveMethod) {
                return;
            }
            const ret = await callback(data);
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
        }
    });
};
