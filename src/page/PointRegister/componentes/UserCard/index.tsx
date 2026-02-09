import style from "./styles.module.scss"

type UserCardProps = {
    name: string;
    company: number;
    setUser: (user: any) => void
}

export const UserCard = ({ name, company, setUser }: UserCardProps) => {

    return (
        <button className={style.cardUserContent} onClick={() => setUser({name, company})}>
            <div className={style.textContent}>
                <strong>{name}</strong>
                <span>Empresa: {company}</span>
            </div>
        </button>
    )
}