import { useEffect, useState } from "react"
import "./styles.scss"
import { Link } from "react-router-dom"

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
        <main className="time-page-container">
            <div className="time-display">
                <span className="time-display__hora">
                    {agora.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </span>
                <span className="time-display__data">{formatarData(agora)}</span>
            </div>
            <Link to="pointRegister" type="button" className="time-action-btn">
                <svg
                    className="time-action-btn__icon"
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
                <span className="time-action-btn__label">PONTO</span>
            </Link>
        </main>
    )
}