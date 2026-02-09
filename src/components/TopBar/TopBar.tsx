import { useEffect, useState } from "react";
import style from "./styles.module.scss";

export const TopBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        // Verificar se a API está disponível
        if (!window.api) {
            console.error("API do Electron não está disponível. Verifique se o preload foi carregado corretamente.");
            return;
        }

        if (!window.api.window) {
            console.error("API window não está disponível.");
            return;
        }

        // Verificar estado inicial
        const checkMaximized = async () => {
            try {
                const maximized = await window.api.window.isMaximized();
                setIsMaximized(maximized);
            } catch (error) {
                console.error("Erro ao verificar estado de maximização:", error);
            }
        };

        checkMaximized();

        // Escutar eventos de maximização/restauração
        if (window.api?.window) {
            const removeMaximizeListener = window.api.window.onMaximize(() => {
                setIsMaximized(true);
            });

            const removeUnmaximizeListener = window.api.window.onUnmaximize(() => {
                setIsMaximized(false);
            });

            return () => {
                removeMaximizeListener();
                removeUnmaximizeListener();
            };
        }
    }, []);

    const handleMinimize = () => {
        if (window.api?.window) {
            window.api.window.minimize().catch((err) => {
                console.error("Erro ao minimizar:", err);
            });
        } else {
            console.warn("API do Electron não disponível");
        }
    };

    const handleMaximize = () => {
        if (window.api?.window) {
            window.api.window.maximize().catch((err) => {
                console.error("Erro ao maximizar:", err);
            });
        } else {
            console.warn("API do Electron não disponível");
        }
    };

    const handleClose = () => {
        if (window.api?.window) {
          
            window.api.window.close().catch((err) => {
                console.error("Erro ao fechar:", err);
            });
        } else {
            console.warn("API do Electron não disponível");
        }
    };



    return (
        <nav className={style.customTopbar}>
            <div className={style.topbarLogo}>
                DOT COM
            </div>
            <div className={style.topbarActions}>
                <button
                    type="button"
                    className={`${style.topbarButton} ${style.topbarButtonMinimize}`}
                    onClick={handleMinimize}
                    title="Minimizar"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="0" y="5" width="12" height="1" fill="currentColor" />
                    </svg>
                </button>
                <button
                    type="button"
                    className={`${style.topbarButton} ${style.topbarButtonMaximize} ${isMaximized ? "restore" : ""}`}
                    onClick={handleMaximize}
                    title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                    {isMaximized ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
                            <rect x="0" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="0" y="0" width="12" height="12" stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                    )}
                </button>
                <button
                    type="button"
                    className={`${style.topbarButton} ${style.topbarButtonClose}`}
                    onClick={handleClose}
                    title="Fechar"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M1 1L11 11M11 1L1 11"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        </nav>
    );
};