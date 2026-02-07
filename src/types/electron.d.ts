export interface ElectronAPI {
  versao: string;
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    unmaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    onMaximize: (callback: () => void) => () => void;
    onUnmaximize: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
