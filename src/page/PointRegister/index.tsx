import { Link } from "react-router-dom";
import { UserCard } from "./componentes/UserCard";
import style from  "./styles.module.scss";
import { ModalPoint } from "../../components/ModalPoint";
import { useEffect, useState } from "react";
import type { User } from "../../types/userType";

export const PointRegister = () => {    
    const [user, setUser] = useState<null | User>(null) 
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        if(user) {
            setModalOpen(true)
        } else {
            setModalOpen(false)
        }
    }, [user])

    return (
        <main className={style.container}>
            <ModalPoint modalOpen={modalOpen} setModalOpen={setModalOpen} user={user ? user : undefined}/>
            <div className={style.pointRegisterContent}>

                <div className={style.textContent}>
                    <h2>Selecione o usuário</h2>
                    <span>Toque no seu nome para inserir a senha do ponto digital</span>
                </div>

                <div className={style.cardContent}>
                    <UserCard company={1} name="Matheus Kauan" setUser={setUser}/>
                    <UserCard company={2} name="fulano" setUser={setUser}/>
                </div>

                <Link to="/" className={style.pointRegisterBack}>
                    Voltar
                </Link>
            </div>  
        </main>
    );
};
