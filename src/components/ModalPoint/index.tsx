import type { User } from "../../types/userType";
import style from "./styles.module.scss"
import UserIconSVG from "../../svg/UserIconSVG";
import { useEffect, useState } from "react";
import panchService from "../../service/panchService";
import { useNavigate  } from "react-router";
import { AxiosError } from "axios";

type ModalPointProps = {
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    user?: User
}

export const ModalPoint = ({ modalOpen, setModalOpen, user }: ModalPointProps) => {
    const [status, setStatus] = useState<"success" | "error" | "idle" | "loading" | "maxPunch">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    
    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const password = event.target.value;
        setPassword(password);
    }

     const handleCloseModal = () => {
        setPassword("");
        setModalOpen(false);
        setStatus("idle");
    }

    const handleRegisterPoint = async () => {
        try {
            const res = await panchService.setPanch(user!.id, password)
            setStatus("success");
            console.log("Resposta do servidor:", res);
        } catch (error: AxiosError | any) {
            setErrorMessage(error.response.data.error)
            setStatus(error.response.data.error === "Limite de pontos atingido para hoje" ? "maxPunch" : "error");
        }
    }

    useEffect(() => {
        if(status === "success") {
            setTimeout(() => {
                handleCloseModal();
                navigate("/");
            }, 2000);
        }
        if(status === "error") {
            setTimeout(() => {
                setStatus("idle");
            }, 2000);
        }
        if(status === "maxPunch") {
            setTimeout(() => {
                handleCloseModal();
                navigate("/");
            }, 2000);
        }
    }, [status]);

    const handleShowComponent = () => {
        switch (status) {
            case "idle":
                return (
                <>
                    <input type="password" autoFocus placeholder="Digite a senha do ponto digital" value={password} onChange={handlePasswordChange}/>
                    <button onClick={handleRegisterPoint}>Registrar ponto</button>
                </>);
            case "loading":
                return <span className={style.loading}>Registrando ponto...</span>;
            case "success":
                return <span className={style.success}>Ponto registrado com sucesso!</span>;
            case "error":
                return <span className={style.error}>{errorMessage}</span>;
            case "maxPunch":            
            return <span className={style.error}>{errorMessage}</span>;
            default:
                return null;
        }   
    }

    return (
        <div className={`${style.modalContainer} ${modalOpen ? style.open : ""}`}>

            <div className={style.container}>
                <div className={style.userContent}>
                    <UserIconSVG />
                    <h3>{user?.name}</h3>
                    <span>Empresa: {user?.companny}</span>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleRegisterPoint(); }} className={style.passwordContent}>
                    {handleShowComponent()}
                </form>

            </div>
            <div className={style.bgBlack} onClick={() => handleCloseModal()} />
        </div>
    )
}