import {useState, useRef} from "react";
import "./PinLogin.css";
import logoImg from "../assets/logo.jpeg";

export default function PinLogin({onUnlock}){
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isShaking, setIsShaking] = useState(false);
    const inputRef = useRef(null);

    const VALID_PIN ="1234";

    const handleChange = (e) => {
        const cleanValue = e.target.value.replace(/[^0-9]/g, "").slice(0,4);
        setPin(cleanValue);
        setError("");

        if (cleanValue.length === 4){
            validarPin(cleanValue);
        }
    };
    const validarPin = (enteredPin) => {
        setTimeout(()=> {
            if (enteredPin === VALID_PIN){
                setError("");
                if(onUnlock) onUnlock();
            }else{
                setIsShaking(true);
                setError("Pin incorrecto. Intente nuevamente.")

                setTimeout(()=>{
                    setIsShaking(false);
                    setPin("");
                    if (inputRef.current) inputRef.current.focus();
                }, 400);
            }
        }, 200);
    };

    const handleCardClick = () => {
        if (inputRef.current) inputRef.current.focus();
    };
    return(
        <div className="login-container">
            <main className="login-card" onClick={handleCardClick}>{/* Encabezado */}
                <header className="brand-header">
                    <div className="brand-logo-container">
                        <img src={logoImg} alt="M&V Turnos" className="brand-logo-img"/>
                    </div>
                    <h1 className="brand-tittle"> M&V Odontología </h1>
                    <p className="brand-subtittle">Gestion de Turnos</p>
                </header>
                <p className="pin-instruction">Ingresa tu Pin de acceso</p>
                {/* INPUT INVISIBLE*/}
                <div className={`pin-wrapper ${isShaking ? "shake" : ""}`}>
                    <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={handleChange}
                    autoFocus
                    className="hidden-pin-input">

                    </input>
                <div className="pin-boxes" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < pin.length;
              const isActive = index === pin.length;
              return (
                <div
                  key={index}
                  className={`pin-box ${isFilled ? "filled" : ""} ${
                    isActive ? "active" : ""
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Mensaje de error */}
        <p className="error-msg">{error}</p>
      </main>
    </div>
  );
}