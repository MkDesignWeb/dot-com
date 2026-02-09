import { Link } from "react-router-dom";
import { UserCard } from "./componentes/UserCard";
import style from  "./styles.module.scss";

export const PointRegister = () => {

    return (
        <main className={style.container}>
            <div className={style.pointRegisterContent}>
                <div className={style.cardContent}>
                    <UserCard />
                    <UserCard />
                </div>

                <Link to="/" className={style.pointRegisterBack}>
                    Voltar
                </Link>
            </div>
        </main>
    );
};
