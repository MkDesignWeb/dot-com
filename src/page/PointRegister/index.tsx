import { Link } from "react-router-dom";
import { UserCard } from "./componentes/UserCard";
import style from  "./styles.module.scss";
import { ModalPoint } from "../../components/ModalPoint";
import { useEffect, useState } from "react";
import type { User } from "../../types/userType";
import axiosInstance from "../../axios/axios.config";

export const PointRegister = () => { 
    const [employee, setEmployee] = useState<null | User[]>(null)    
    const [user, setUser] = useState<null | User>(null) 
    const [modalOpen, setModalOpen] = useState(false)

     useEffect( () => {
        axiosInstance.get('/employee')
            .then((response) => {
                setEmployee(response.data);
            })
            .catch((error) => {
                console.error('Erro ao buscar funcionários:', error);
            });
    }, []);

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
                    {employee && employee.map((emp) => (
                        <UserCard key={emp.id} id={emp.id} company={emp.companny} name={emp.name} setUser={setUser}/>
                    ))}
                </div>

                <Link to="/" className={style.pointRegisterBack}>
                    Voltar
                </Link>
            </div>  
        </main>
    );
};
