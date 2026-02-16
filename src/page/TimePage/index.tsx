import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import style from "./styles.module.scss"
import timeService from "../../service/timeService"

const formatarData = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    })


export const TimePage = () => {
    const [offset, setOffset] = useState<"error" | "loading" | number>("loading");
    const [time, setTime] = useState(new Date());

    async function sync() {
        try {
            const res = await timeService.getTime();
            const data = res.data.serverTime;
            setOffset(data - Date.now());
        } catch (error) {
            setOffset("error");
            console.error("Erro ao sincronizar o tempo:", error);
        }
    }

    useEffect(() => {
        sync();
        const syncInterval = setInterval(sync, 60000);

        const tick = setInterval(() => {
            if (offset === "error" || offset === "loading") {
                return
            } else {
                setTime(new Date(Date.now() + offset));
            }
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(tick);
        }
    }, [offset]);

    const handleShowComponent = () => {
        switch (offset) {
            case "loading":
                return <span className={style.loadingMessage}>Sincronizando o tempo...</span>;
            case "error":
                return <span className={style.errorMessage}>Erro ao sincronizar o tempo. Tente novamente mais tarde.</span>;
            default:
                return (
                    <>
                        <div className={style.timeCisplay}>
                            <span className={`${style.timeDisplay} ${style.hora}`}>
                                {time.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                })}
                            </span>
                            <span className={`${style.timeDisplay} ${style.data}`}>{formatarData(time)}</span>
                        </div>
                        <Link to="pointRegister" type="button" className={style.timeActionBtn}>
                            <svg
                                className={style.icon}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                            <span className={style.label}>PONTO</span>
                        </Link>
                    </>);
        }
    }

    return (
        <main className={style.container}>
            {handleShowComponent()}
        </main>
    )
}