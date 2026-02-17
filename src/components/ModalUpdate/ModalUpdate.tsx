import { useEffect, useState } from "react";
import style from "./styles.module.scss";

declare global {
  interface Window {
    updater: {
      onChecking: (callback: () => void) => void;
      onAvailable: (callback: () => void) => void;
      onProgress: (callback: (progress: number) => void) => void;
      onDownloaded: (callback: () => void) => void;
      onError?: (callback: (message: string) => void) => void;
      install: () => void;
    };
  }
}

export const UpdateModal = () => {
  const [status, setStatus] = useState<"idle" | "checking" | "downloading" | "ready" | "error">("checking");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    setModalOpen(true);
    window.updater.onChecking(() => console.log("Checking for updates..."));
    window.updater.onAvailable(() => setStatus("downloading"));

    window.updater.onProgress(p => {
      setStatus("downloading");
      setProgress(p);
    });

    window.updater.onDownloaded(() => setStatus("ready"));

    window.updater.onError?.(msg => {
      setStatus("error");
      setError(msg);
    });
  }, []);


  if (status === "idle") return null;

  return (
    <div className={`${style.modalContainer} ${modalOpen ? style.open : ""}`}>

      <div className={style.container}>
            <div className={style.updateModal}>
              {status === "checking" && (
                <>
                  <h3>Verificando atualização</h3>
                  <p>Aguarde...</p>
                </>
              )}

              {status === "downloading" && (
                <>
                  <h3>Baixando atualização</h3>
                  <p className={style.percent}>{progress.toFixed(0)}%</p>

                  <div className={style.progressBar}>
                    <div
                      className={style.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              )}

              {status === "ready" && (
                <>
                  <h3>Atualização pronta</h3>
                  <p>Reinicie o app para instalar</p>

                  <button
                    className={style.updateBtn}
                    onClick={() => window.updater.install()}
                  >
                    Reiniciar e atualizar
                  </button>
                </>
              )}

              {status === "error" && (
                <>
                  <h3>Erro ao atualizar</h3>
                  <p className={style.error}>{error}</p>
                </>
              )}
      
        </div>
      </div>
      <div className={style.bgBlack} />
    </div>
  );
}