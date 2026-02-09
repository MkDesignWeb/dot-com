import style from "./styles.module.scss"

export const ModalPoint = () => {
    return (
        <div className={style.modalContainer}>
            <div className={style.container}>
                <div className={style.userContent}>
                    
                </div>
                <div className={style.passwordContent}>

                </div>
            </div>
            <div className={style.bgBlack} />
        </div>
    )
}