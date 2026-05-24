import apiClient from '@/client/apiClient';
import InputOTPBox from '@/components/simple/InputOTPBox';
import { API_CONFIG } from '@/config/api.config';
import { PATHS } from '@/router/paths';
import { Eye, EyeOff, Info, Lock, Mail, User2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const CORRECT_CODE = "142536";

function Register(){
    const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [serverPassword, setServerPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showServerPassword, setShowServerPassword] = useState(false);
    const [errorAuth, setErrorAuth] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [verify, setVerify] = useState(false);
    const [code, setCode] = useState("");
    const [isCodeLoading, setIsCodeLoading] = useState(false);
    const [isCodeCorrect, setIsCodeCorrect] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingAuth(true);
        setErrorAuth(null);

        if(!(email && password && confirmPassword && email !== "" && password !== "")) {
            setLoadingAuth(false);
            setErrorAuth("Veuillez remplir le formulaire.");
            return;
        };

        if(password !== confirmPassword) {
            setLoadingAuth(false);
            setErrorAuth("Confirmez votre mot de passe.");
            return;
        };
        
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.register, {
                body:     { username, email, serverPassword, clientPassword: password },
                withAuth: false,
            });
            navigate(PATHS.auth.login);
        } catch (err) {
            console.log(err);
            console.log(err?.data?.error || err?.data?.errors[0]);
            setErrorAuth(err?.data?.error || err?.data?.errors[0] || err?.message);
            setLoadingAuth(false);
        }
    }

    const simulateAPI = (code) => {
        const success = code === CORRECT_CODE;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (success) { resolve("Code OTP Correct"); }
                else { reject("Code OTP Invalide."); }
            }, 3000);
        });
    };

    const handleOTP = () => {
        setIsCodeCorrect(null);
        setIsCodeLoading(true);
        simulateAPI(code)
        .then(res => { setIsCodeCorrect(true); })
        .catch(err => { setIsCodeCorrect(false); })
        .finally(() => { setIsCodeLoading(false); });
    }

    useEffect(() => {
        if (code.length === 6) {
            handleOTP();
        } else {
            setIsCodeCorrect(null);
        }
    }, [code]);

    return (
        <>
        {!verify && (
            <form method='get' action='#' className='flex flex-col gap-1 pt-4' onSubmit={handleSubmit}>
                <h2 className="font-bold text-3xl text-my-text-primary">
                    {t("register.title")}
                </h2>
                <p className="text-my-text mt-1">
                    {t("register.text")}
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
                    <label htmlFor="email">{t("register.fields.email")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 pl-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Mail />
                        </span>
                        <input 
                            type="email" 
                            name="email" 
                            id="email" 
                            placeholder={t("register.fields.holderEmail")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setEmail(e.target.value)}
                            required={true}
                        />
                    </div>
                </div>
                <div className='mt-3'>
                    <label htmlFor="password">{t("register.fields.password")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 px-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Lock />
                        </span>
                        <input 
                            type={(showPassword) ? "text" : "password"} 
                            name="password" 
                            id="password" 
                            placeholder={t("register.fields.holderPassword")} 
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
                <div className='mt-3'>
                    <label htmlFor="confirm_password">{t("register.fields.confirmPassword")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 px-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Lock />
                        </span>
                        <input 
                            type={(showConfirmPassword) ? "text" : "password"} 
                            name="confirm_password" 
                            id="confirm_password" 
                            placeholder={t("register.fields.holderPassword")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required={true}
                        />
                        <button 
                        type="button" 
                        className="flex-center-center"
                        onClick={() => {setShowConfirmPassword(prev => !prev)}}
                        >
                            {showConfirmPassword ? (<Eye />) : (<EyeOff />)}
                        </button>
                    </div>
                </div>
                <div className='mt-3'>
                    <label htmlFor="username">{t("register.fields.username")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 pl-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <User2 />
                        </span>
                        <input 
                            type="text" 
                            name="username" 
                            id="username" 
                            placeholder={t("register.fields.holderUsername")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setUsername(e.target.value)}
                            required={true}
                        />
                    </div>
                </div>
                <div className='mt-3'>
                    <label htmlFor="serverPassword">{t("register.fields.serverPassword")}</label>
                    <div className="mt-2 group ring-0 ring-brand hover:not-focus-within:ring-1 focus-within:ring-2 flex items-center gap-3 border rounded-xs h-10 px-2">
                        <span className='flex-center-center text-my-text-muted'>
                            <Lock />
                        </span>
                        <input 
                            type={(showServerPassword) ? "text" : "password"} 
                            name="serverPassword" 
                            id="serverPassword" 
                            placeholder={t("register.fields.holderMoodle")} 
                            className='flex-1 h-full flex items-center'
                            onChange={(e) => setServerPassword(e.target.value)}
                            required={true}
                        />
                        <button 
                        type="button" 
                        className="flex-center-center"
                        onClick={() => {setShowServerPassword(prev => !prev)}}
                        >
                            {showServerPassword ? (<Eye />) : (<EyeOff />)}
                        </button>
                    </div>
                </div>
                {/* <div className="text-right mt-3">
                    <a href="/forgot-password" className='text-brand'>
                        {t("login.forgotPassword")}&nbsp;?
                    </a>
                </div> */}
                <button 
                    type="submit" 
                    className="mt-6 flex-center-center rounded-4xl h-11 text-white bg-brand font-bold text-lg disabled:bg-my-bg-dark"
                    disabled={loadingAuth}
                >
                    {t("register.signUp")}
                </button>
                <div className="mt-3 flex-center-center">
                    <span>
                        {t("register.already")}&nbsp;?&nbsp;
                    </span>
                    <a href="/login" className='hover:text-brand'>
                        {t("register.login")}
                    </a>
                </div>
            </form>
        )}
        {verify && (
            <form action="#" method="get" className="flex flex-col gap-1 pt-4">
                <h2 className="font-bold text-3xl text-my-text-primary text-center">
                    {t("register.verifyTitle")}
                </h2>
                <p className="text-my-text mt-1 text-center">
                    <Trans 
                        i18nKey="register.verifyText" 
                        values={{ email: email }}
                        components={{
                            1: <span className="font-bold" />,
                            2: <br />
                        }}
                    />
                </p>
                {isCodeCorrect === false && (
                    <p className="bg-danger-foreground text-danger border border-danger flex items-center gap-2 p-2 rounded-xs mt-4">
                        <Info />
                        <span className="flex-center-center">
                            {t("register.verifyError")}
                        </span>
                    </p>
                )}
                <div className='mt-5'>
                    <InputOTPBox 
                        value={code} 
                        setValue={setCode} 
                        isLoading={isCodeLoading}  
                        isCodeCorrect={isCodeCorrect} 
                        handleComplete={handleOTP}
                    />
                </div>
                <div className="mt-12 md:mt-18 flex-center-center">
                    <a href="/register" className='hover:text-brand'>
                        {t("register.verifyReturn")}
                    </a>
                </div>
            </form>
        )}
        </>
    );
}

export default Register;