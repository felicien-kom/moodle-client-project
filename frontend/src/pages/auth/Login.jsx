import { Eye, EyeOff, Info, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '@/router/paths';
import { useAuth } from '@/context/AuthContext';

function Login(){
    const { t } = useTranslation();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorAuth, setErrorAuth] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorAuth(null);
        
        if (email === "" || password === "") {
            setErrorAuth("Veuillez remplir le formulaire.");
            return;
        }
        
        try {
            await login({ email, password });
            navigate(PATHS.app.dashboard);
        } catch (err) {
            console.log(err?.data?.error);
            setErrorAuth(err?.data?.error);
        }
    }
    return (
        <>
            <form method='get' action='#' className='flex flex-col gap-1 pt-4' onSubmit={handleSubmit}>
                <h2 className="font-bold text-3xl text-my-text-primary">
                    {t("login.title")}
                </h2>
                <p className="text-my-text mt-1">
                    {t("login.text")}
                </p>
                {errorAuth && (
                    <p className="bg-danger-foreground text-danger border border-danger flex items-center gap-2 p-2 rounded-xs mt-2">
                        <Info />
                        <span className="flex-center-center">
                            {errorAuth}
                        </span>
                    </p>
                )}
                <div className='mt-3'>
                    <label htmlFor="email">{t("login.fields.email")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 pl-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Mail />
                        </span>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            placeholder={t("login.fields.holderEmail")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setEmail(e.target.value)}
                            required={true}
                        />
                    </div>
                </div>
                <div className='mt-3'>
                    <label htmlFor="password">{t("login.fields.password")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 px-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Lock />
                        </span>
                        <input 
                            type={(showPassword) ? "text" : "password"} 
                            name="password" 
                            id="password" 
                            placeholder={t("login.fields.holderPassword")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setPassword(e.target.value)}
                            required={true}
                        />
                        <button 
                        type="button" 
                        className="flex-center-center"
                        onClick={() => {setShowPassword(prev => !prev)}}
                        >
                            {showPassword ? (<Eye />) : (<EyeOff />)}
                        </button>
                    </div>
                </div>
                <div className="text-right mt-3">
                    <a href="/forgot-password" className='text-brand'>
                        {t("login.forgotPassword")}&nbsp;?
                    </a>
                </div>
                <button 
                    type="submit" 
                    className="mt-3 flex-center-center rounded-4xl h-11 text-white bg-brand font-bold text-lg"
                >
                    {t("login.signIn")}
                </button>
                <div className="mt-3 flex-center-center">
                    <a href="/register" className='hover:text-brand'>
                        {t("login.register")}
                    </a>
                </div>
            </form>
        </>
    );
}

export default Login;