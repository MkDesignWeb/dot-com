import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import style from "./styles.module.scss"

const formatarData = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    })


export const TimePage = () => {
    const [agora, setAgora] = useState(() => new Date())

    useEffect(() => {
        const id = setInterval(() => setAgora(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    return (
        <main className={style.container}>
            <div className={style.timeCisplay}>
                <span className={`${style.timeDisplay} ${style.hora}`}>
                    {agora.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </span>
                <span className={`${style.timeDisplay} ${style.data}`}>{formatarData(agora)}</span>
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
        </main>
    )
}