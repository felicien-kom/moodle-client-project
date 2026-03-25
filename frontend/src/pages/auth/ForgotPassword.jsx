import { Eye, EyeOff, Info, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ForgotPassword(){
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [errorAuth, setErrorAuth] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if(email && email !== "") {
            alert(`Email : ${email}\nPassword : ${password}`);
        } else{
            alert('Hum...');
        }
    }

    return (
        <>
            <form method='get' action='#' className='flex flex-col gap-1 pt-4' onSubmit={handleSubmit}>
                <h2 className="font-bold text-3xl text-my-text-primary">
                    {t("forgotPassword.title")}
                </h2>
                <p className="text-my-text mt-1">
                    {t("forgotPassword.text")}
                </p>
                {errorAuth && (
                    <p className="bg-danger-foreground text-danger border border-danger flex items-center gap-2 p-2 rounded-xs mt-2">
                        <Info />
                        <span className="flex-center-center">
                            {t("forgotPassword.error")}
                        </span>
                    </p>
                )}
                <div className='mt-5'>
                    <label htmlFor="email">{t("forgotPassword.fields.email")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 pl-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Mail />
                        </span>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            placeholder={t("forgotPassword.fields.holderEmail")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setEmail(e.target.value)}
                            required={true}
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    className="mt-6 flex-center-center rounded-4xl h-11 text-white bg-brand font-bold text-lg"
                >
                    {t("forgotPassword.validate")}
                </button>
                <div className="mt-3 flex-center-center">
                    <a href="/login" className='hover:text-brand'>
                        {t("forgotPassword.login")}
                    </a>
                </div>
            </form>
        </>
    );
}

export default ForgotPassword;