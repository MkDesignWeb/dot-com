import { Link } from "react-router-dom";
import "./styles.scss";
import { UserCard } from "./componentes/UserCard";

export const PointRegister = () => {

    return (
        <main className="point-register-container">
            <div className="point-register-content">
                <div className="card-content">
                    <UserCard />
                    <UserCard />

                </div>

                <Link to="/" className="point-register__back">
                    Voltar
                </Link>
            </div>
        </main>
    );
};
