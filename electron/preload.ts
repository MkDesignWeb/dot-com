import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("config", {
  get: () => ipcRenderer.invoke("config:get"),
  set: (data: any) => ipcRenderer.invoke("config:set", data),
});

contextBridge.exposeInMainWorld("api", {
  versao: "1.0.0",
  window: {
    minimize: () => ipcRenderer.invoke("window-minimize"),
    maximize: () => ipcRenderer.invoke("window-maximize"),
    unmaximize: () => ipcRenderer.invoke("window-unmaximize"),
    close: () => ipcRenderer.invoke("window-close"),
    isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
    onMaximize: (callback: () => void) => {
      ipcRenderer.on("window-maximized", callback);
      return () => ipcRenderer.removeListener("window-maximized", callback);
    },
    onUnmaximize: (callback: () => void) => {
      ipcRenderer.on("window-unmaximized", callback);
      return () => ipcRenderer.removeListener("window-unmaximized", callback);
    },
  },
});