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

export interface ServerConfig {
  ip: string;
  port: string;
}

declare global {
  interface Window {
    api: ElectronAPI;
    config: {
      get: () => Promise<ServerConfig | null>;
      set: (cfg: ServerConfig) => Promise<void>;
    };
  }
}
