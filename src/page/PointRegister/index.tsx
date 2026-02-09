import { Link } from "react-router-dom";
import { UserCard } from "./componentes/UserCard";
import style from  "./styles.module.scss";
import { ModalPoint } from "../../components/ModalPoint";
import { useState } from "react";

export const PointRegister = () => {
    const [modalOpen, setModalOpen] = useState(true)

    return (
        <main className={style.container}>
            {modalOpen ? <ModalPoint /> : ""}
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
