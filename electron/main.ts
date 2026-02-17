import { app, ipcMain } from "electron";
import { BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import store from "./store.js";
import path from "path";



ipcMain.handle("config:get", () => {
  return store.get("server") || {};
});

ipcMain.handle("config:set", (_, data) => {
  store.set("server", data);
});


const distElectronPath = path.join(app.getAppPath(), "dist-electron/")

// Preload deve ser o .js compilado (Electron não executa TypeScript no preload).
const getPreloadPath = () => {
  const preloadPath = path.join(distElectronPath, "preload.js");
  if (!existsSync(preloadPath)) {
    console.error("Preload não encontrado em:", preloadPath, "- Execute: npm run build:electron");
  }
  return preloadPath;
};

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const preloadPath = getPreloadPath();
  console.log("Caminho do preload:", preloadPath);
  console.log("Arquivo existe?", existsSync(preloadPath));


  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minHeight: 800,
    minWidth: 1200,
    frame: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged

  const indexPath = path.join(app.getAppPath(), "dist-react/index.html")

  isDev    ? mainWindow.loadURL("http://localhost:5173")
           : mainWindow.loadFile(indexPath)

  // Handlers IPC para controle de janela
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

  // Eventos de maximização/restauração
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



