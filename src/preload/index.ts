import { ipcRenderer, contextBridge, webUtils } from 'electron';

// --------- Expose some API to the Renderer process ---------

/**
 * 渲染层传入的监听器 -> 真正注册到 ipcRenderer 的包装函数。
 * ipcRenderer.on 需要包一层才能把 event 一并传给渲染层回调，
 * 因此 off 时必须用同一份包装函数，否则监听器永远无法被移除（造成内存泄漏）。
 */
type IpcListener = Parameters<typeof ipcRenderer.on>[1];
const listenerWrappers = new Map<string, Map<IpcListener, IpcListener>>();

contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args;
        let channelWrappers = listenerWrappers.get(channel);
        if (!channelWrappers) {
            channelWrappers = new Map();
            listenerWrappers.set(channel, channelWrappers);
        }
        // 同一个监听器重复注册时复用同一个包装函数，保证引用可被移除
        let wrapper = channelWrappers.get(listener);
        if (!wrapper) {
            wrapper = (event: any, ...args: any[]) => listener(event, ...args);
            channelWrappers.set(listener, wrapper);
        }
        return ipcRenderer.on(channel, wrapper);
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, listener] = args;
        const channelWrappers = listenerWrappers.get(channel);
        const wrapper = channelWrappers?.get(listener);
        if (channelWrappers && wrapper) {
            channelWrappers.delete(listener);
            return ipcRenderer.off(channel, wrapper);
        }
        return ipcRenderer.off(channel, listener);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args;
        return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args;
        return ipcRenderer.invoke(channel, ...omit);
    },

    // You can expose other APTs you need here.
    // ...
});

contextBridge.exposeInMainWorld('webUtils', {
    // 将获取路径的方法暴露给渲染进程
    getPathForFile: (file:any) => {
        return webUtils.getPathForFile(file);
    }
});

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
    return new Promise((resolve) => {
        if (condition.includes(document.readyState)) {
            resolve(true);
        } else {
            document.addEventListener('readystatechange', () => {
                if (condition.includes(document.readyState)) {
                    resolve(true);
                }
            });
        }
    });
}

const safeDOM = {
    append(parent: HTMLElement, child: HTMLElement) {
        if (!Array.from(parent.children).find((e) => e === child)) {
            return parent.appendChild(child);
        }
    },
    remove(parent: HTMLElement, child: HTMLElement) {
        if (Array.from(parent.children).find((e) => e === child)) {
            return parent.removeChild(child);
        }
    },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
    const className = `loaders-css__square-spin`;
    const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
    const oStyle = document.createElement('style');
    const oDiv = document.createElement('div');

    oStyle.id = 'app-loading-style';
    oStyle.innerHTML = styleContent;
    oDiv.className = 'app-loading-wrap';
    oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

    return {
        appendLoading() {
            while (!document.head || !document.body) {
                safeDOM.append(document.head, oStyle);
                safeDOM.append(document.body, oDiv);
            }
        },
        removeLoading() {
            safeDOM.remove(document.head, oStyle);
            safeDOM.remove(document.body, oDiv);
        },
    };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
    if (ev.data.payload === 'removeLoading'){
        removeLoading();
    } 
};
setTimeout(removeLoading, 4999);
