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

/** Identidade desta instalacao perante o servidor. Ver `electron/device.ts`. */
export interface DeviceIdentity {
  deviceId: string;
  app: "terminal";
  version: string;
  hostname: string | null;
}

export interface ServerConfig {
  ip: string;
  port: string;
}

/** Ordem de atualizacao vinda do servidor na resposta do heartbeat. */
export interface UpdateOrder {
  campaignId: string;
  app: string;
  version: string;
  fileName: string;
  size: number;
  /** Diagnostico. O hash exigido e buscado no release publico, ver `electron/updater.ts`. */
  sha256: string;
  url: string;
  repo: string | null;
}

export interface UpdateProgress {
  campaignId: string;
  state: "downloading" | "verifying" | "installing" | "failed";
  message: string | null;
}

declare global {
  interface Window {
    api: ElectronAPI;
    config: {
      get: () => Promise<ServerConfig | null>;
      set: (cfg: ServerConfig) => Promise<void>;
    };
    device: {
      identity: () => Promise<DeviceIdentity>;
    };
    updater: {
      apply: (order: unknown, fileUrl: string) => Promise<void>;
      onProgress: (callback: (progress: UpdateProgress) => void) => () => void;
    };

  }
}
