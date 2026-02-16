import { Link } from "react-router-dom"
import style from "./styles.module.scss"
import BackSVG from "../../svg/BackSVG"
import { useEffect, useState } from "react";

declare global {
    interface Window {
        config: {
            get: () => Promise<{ ip: string; port: string } | null>;
            set: (cfg: { ip: string; port: string }) => Promise<void>;
        };
    }
}


export const ConfigPage = () => {

    const [ip, setIp] = useState("");
    const [port, setPort] = useState("");
    const [showMessage, setShowMessage] = useState(false);

    const handleTostMessage = () => {
        setShowMessage(true);
        setTimeout(() => {
            setShowMessage(false);
        }, 2000);
    }

    useEffect(() => {
        window.config.get().then(cfg => {
            if (cfg) {
                setIp(cfg.ip || "");
                setPort(cfg.port || "");
            }
        });
    }, []);

    async function save() {
        await window.config.set({ ip, port });
    }

    const handleSubmit = (e: React.FormEvent) => {
        handleTostMessage()
        e.preventDefault();
        save();
    }

    return (
        <main className={style.container}>
            <Link to="/" className={style.backBtn}><BackSVG /></Link>
            <h1>Configurações</h1>
            <form onSubmit={handleSubmit}>
                <div className={style.imputGroup}>
                    <label htmlFor="ipServer">IP Server</label>
                    <input
                        type="text"
                        id="ipServer"
                        name="ipServer"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                    />
                </div>
                <div className={style.imputGroup}>
                    <label htmlFor="port">Porta</label>
                    <input
                        type="text"
                        id="port"
                        name="port"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                    />
                </div>
                <button >Salvar</button>

            </form>
            <span className={`${style.saveMessage} ${showMessage ? style.show : style.off}`}>
                As configurações foram salvas com sucesso!
            </span>

        </main>
    )
}