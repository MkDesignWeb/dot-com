import style from "./styles.module.scss"

type UserCardProps = {
    id: string;
    name: string;
    companny: number;
    setUser: (user: any) => void
}

export const UserCard = ({id, name, companny, setUser }: UserCardProps) => {
    return (
        <button className={style.cardUserContent} onClick={() => setUser({id, name, companny})}>
            <div className={style.textContent}>
                <strong>{name}</strong>
                <span>Empresa: {companny}</span>
            </div>
        </button>
    )
}