import type { User } from "../../types/userType";
import style from "./styles.module.scss"
import UserIconSVG from "../../svg/UserIconSVG";

type ModalPointProps = {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    user?: User
}

export const ModalPoint = ({ modalOpen, setModalOpen, user }: ModalPointProps) => {
    return (
        <div className={`${style.modalContainer} ${modalOpen ? style.open : ""}`}>

            <div className={style.container}>
                <div className={style.userContent}>
                    <UserIconSVG />
                    <h3>{user?.name}</h3>
                    <span>Empresa: {user?.company}</span>
                </div>

                <div className={style.passwordContent}>
                    <input type="password" placeholder="Digite a senha do ponto digital" />
                    <button>Registrar ponto</button>
                </div>

            </div>
            <div className={style.bgBlack} onClick={() => setModalOpen(false)} />
        </div>
    )
}