import style from "./styles.module.scss"

type UserCardProps = {
    id: string;
    name: string;
    company: number;
    setUser: (user: any) => void
}

export const UserCard = ({id, name, company, setUser }: UserCardProps) => {
    return (
        <button className={style.cardUserContent} onClick={() => setUser({id, name, company})}>
            <div className={style.textContent}>
                <strong>{name}</strong>
                <span>Empresa: {company}</span>
            </div>
        </button>
    )
}