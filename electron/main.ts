import { app, ipcMain, BrowserWindow, nativeImage } from "electron";
import { existsSync } from "fs";
import store from "./store.js";
import path from "path";

ipcMain.handle("config:get", () => {
  return store.get("server") || {};
});

ipcMain.handle("config:set", (_, data) => {
  store.set("server", data);
});

let mainWindow: BrowserWindow | null = null;

ipcMain.handle("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("window-unmaximize", () => {
  mainWindow?.unmaximize();
});

ipcMain.handle("window-close", () => {
  app.quit();
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

const distElectronPath = path.join(app.getAppPath(), "dist-electron/");

const getPreloadPath = () => {
  const preloadPath = path.join(distElectronPath, "preload.js");
  if (!existsSync(preloadPath)) {
    console.error("Preload nao encontrado em:", preloadPath, "- Execute: npm run build:electron");
  }
  return preloadPath;
};

const getAppIconPath = () => {
  const iconBasePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const iconPath = path.join(iconBasePath, "build", "icons", "app.ico");
  return existsSync(iconPath) ? iconPath : undefined;
};

function createWindow() {
  const preloadPath = getPreloadPath();
  const iconPath = process.platform === "win32" ? getAppIconPath() : undefined;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 800,
    minWidth: 1200,
    frame: true,
    icon: iconPath ? nativeImage.createFromPath(iconPath) : undefined,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  const indexPath = path.join(app.getAppPath(), "dist-react/index.html");

  if (isDev) {
    void mainWindow.loadURL("http://localhost:5174");
  } else {
    void mainWindow.loadFile(indexPath);
  }

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-unmaximized");
  });
}

app.whenReady().then(() => {
  createWindow();
});
