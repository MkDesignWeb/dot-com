"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("config", {
    get: () => electron_1.ipcRenderer.invoke("config:get"),
    set: (data) => electron_1.ipcRenderer.invoke("config:set", data),
});
electron_1.contextBridge.exposeInMainWorld("api", {
    versao: "1.0.0",
    window: {
        minimize: () => electron_1.ipcRenderer.invoke("window-minimize"),
        maximize: () => electron_1.ipcRenderer.invoke("window-maximize"),
        unmaximize: () => electron_1.ipcRenderer.invoke("window-unmaximize"),
        close: () => electron_1.ipcRenderer.invoke("window-close"),
        isMaximized: () => electron_1.ipcRenderer.invoke("window-is-maximized"),
        onMaximize: (callback) => {
            electron_1.ipcRenderer.on("window-maximized", callback);
            return () => electron_1.ipcRenderer.removeListener("window-maximized", callback);
        },
        onUnmaximize: (callback) => {
            electron_1.ipcRenderer.on("window-unmaximized", callback);
            return () => electron_1.ipcRenderer.removeListener("window-unmaximized", callback);
        },
    },
});
