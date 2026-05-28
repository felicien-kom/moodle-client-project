import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api.config';
import apiClient from '@/client/apiClient';
import { useAuth } from '@/context/AuthContext';
import { PATHS } from '@/router/paths';
import { MonsterMascots } from '@/components/auth/MonsterMascots';
import InputOTPBox from '@/components/simple/InputOTPBox';
import logoImg from '@/assets/img/logo.png';

const CORRECT_CODE = "142536"; // gardé du fichier original

export default function AuthPage({ defaultMode = "login" }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode principal : "login" ou "register"
  const [mode, setMode] = useState(defaultMode);

  // État de l'ourson : "idle", "password", "peek"
  const [bearState, setBearState] = useState("idle");

  // --------------- ETAT LOGIN ---------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --------------- ETAT REGISTER ---------------
  const [regStep, setRegStep] = useState(1); // 1 = Identité, 2 = Moodle
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverUsername, setServerUsername] = useState("");
  const [serverPassword, setServerPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showServerPassword, setShowServerPassword] = useState(false);

  const [regError, setRegError] = useState(null);
  const [isRegLoading, setIsRegLoading] = useState(false);

  // --------------- ETAT FORGOT ---------------
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // OTP State
  const [verify, setVerify] = useState(false);
  const [code, setCode] = useState("");
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isCodeCorrect, setIsCodeCorrect] = useState(null);

  // --- Handlers Focus (pour animer l'ours) ---
  const handleFocusEmail = () => setBearState("idle");
  const handleFocusPassword = () => setBearState(showPassword || showLoginPassword ? "idle" : "password");
  const handleFocusConfirm = () => setBearState(showConfirmPassword ? "idle" : "peek");
  const handleBlur = () => setBearState("idle");

  // --- ACTIONS LOGIN ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError("Veuillez remplir tous les champs.");
      setIsLoginLoading(false);
      return;
    }
    try {
      await login({ email: loginEmail, password: loginPassword });
      navigate(PATHS.app.dashboard);
    } catch (err) {
      setLoginError(err?.data?.error || err?.message || "Erreur de connexion.");
      setIsLoginLoading(false);
    }
  };

  // --- ACTIONS REGISTER ---
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setRegError("Tous les champs sont requis.");
      return;
    }
    if (password !== confirmPassword) {
      setRegError("Les mots de passe ne correspondent pas.");
      return;
    }
    setRegError(null);
    setRegStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!serverUsername || !serverPassword) {
      setRegError("Les identifiants Moodle sont requis.");
      return;
    }
    setIsRegLoading(true);
    setRegError(null);

    try {
      await apiClient.post(API_CONFIG.endpoints.register, {
        body: { username, email, serverUsername, serverPassword, clientPassword: password },
        withAuth: false,
      });
      // Proceed to the OTP verify phase
      setVerify(true);
      setRegStep(1);
    } catch (err) {
      setRegError(err?.data?.error || err?.data?.errors?.[0] || err?.message || "Erreur lors de l'inscription.");
    } finally {
      setIsRegLoading(false);
    }
  };

  // --- ACTIONS OTP (gardé d'origine) ---
  const simulateAPI = (c) => {
    const success = c === CORRECT_CODE;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (success) resolve("Code OTP Correct");
        else reject("Code OTP Invalide.");
      }, 2000);
    });
  };

  const handleOTP = () => {
    setIsCodeCorrect(null);
    setIsCodeLoading(true);
    simulateAPI(code)
      .then(() => setIsCodeCorrect(true))
      .catch(() => setIsCodeCorrect(false))
      .finally(() => setIsCodeLoading(false));
  };

  useEffect(() => {
    if (code.length === 6) handleOTP();
    else setIsCodeCorrect(null);
  }, [code]);

  // --- ACTIONS FORGOT ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError("Email requis.");
      return;
    }
    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      // Simuler api de mot de passe oublié si non existant
      await new Promise(r => setTimeout(r, 1000));
      setForgotSuccess("Instructions envoyées à votre adresse email !");
      setTimeout(() => {
        setMode("login");
        setForgotSuccess(null);
        setForgotEmail("");
      }, 3000);
    } catch (err) {
      setForgotError("Une erreur est survenue.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#6b6b6b] flex items-center justify-center p-4 md:p-8 font-sans">

      {/* Conteneur principal (Split Screen) */}
      <div className="relative w-full max-w-5xl rounded-[1.5rem] shadow-2xl flex min-h-[600px] overflow-hidden bg-white">

        {/* =========================================================================
            PANNEAU COULISSANT (Image / Décoration) -> Fond Gris avec Monstres
        ========================================================================= */}
        <div
          className="absolute top-0 w-full md:w-1/2 h-full z-20 pointer-events-none hidden md:block transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: (mode === "login" || mode === "forgot") ? "translateX(0%)" : "translateX(100%)" }}
        >
          <div className="w-full h-full bg-[#E5E5E5] flex flex-col items-center justify-center p-8 overflow-hidden rounded-l-[1.5rem] transition-all" style={{ borderRadius: mode === "register" ? '0 1.5rem 1.5rem 0' : '1.5rem 0 0 1.5rem' }}>

            {/* Animation des Monstres ! */}
            <div className="w-full max-w-sm ml-[-40px]">
              <MonsterMascots state={bearState} />
            </div>

            <div className="absolute top-10 pointer-events-auto flex gap-2" style={{ opacity: 0 }}>
              {/* Elements masqués pour le padding et le layout */}
            </div>
          </div>
        </div>

        {/* =========================================================================
            PANNEAU DROIT : FORMULAIRE DE LOGIN (Aligné à droite par défaut)
        ========================================================================= */}
        <div className={`w-full md:w-1/2 bg-white flex flex-col justify-center px-10 sm:px-14 py-12 transition-all duration-700 absolute top-0 h-full ${mode === "login" ? "opacity-100 z-10 translate-x-0 md:translate-x-full" : "opacity-0 -translate-x-full pointer-events-none"}`}>
          <div className="w-full max-w-[360px] mx-auto text-center md:text-left">

            <div className="flex justify-center md:justify-center mb-8">
              <img src={logoImg} alt="Moodle Logo" className="h-10 object-contain" />
            </div>

            <h2 className="text-[32px] font-bold text-slate-900 mt-2 text-center">Welcome back!</h2>
            <p className="text-slate-500 text-sm mt-2 text-center mb-10">
              Please enter your details
            </p>

            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2 text-left">
                <Info className="w-4 h-4 shrink-0" /> {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    onFocus={handleFocusEmail}
                    onBlur={handleBlur}
                    placeholder="Show.meem@gmail.com"
                    className="w-full pb-2 pt-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
                <div className="relative group">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onFocus={handleFocusPassword}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className="w-full pb-2 pt-1 pr-8 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowLoginPassword(!showLoginPassword); setBearState(!showLoginPassword ? "idle" : "password"); }}
                    className="absolute right-0 bottom-3 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {showLoginPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                  Remember me
                </label>
                <button type="button" onClick={() => setMode("forgot")} className="text-sm font-medium text-slate-400 hover:text-slate-600">Forget password?</button>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full py-3.5 bg-brand hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
              >
                {isLoginLoading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="mt-14 text-center">
              <span className="text-slate-500 text-sm font-medium">Don't have an account? </span>
              <button onClick={() => setMode("register")} className="text-slate-900 font-bold text-sm hover:underline">Sign Up</button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PANNEAU GAUCHE : FORMULAIRE DE SIGN UP (Aligné à gauche par défaut)
        ========================================================================= */}
        <div className={`w-full md:w-1/2 bg-white flex flex-col justify-center px-10 sm:px-14 py-12 transition-all duration-700 absolute top-0 h-full ${mode === "register" ? "opacity-100 z-10 translate-x-0" : "opacity-0 translate-x-full pointer-events-none md:-translate-x-full"}`}>
          {!verify ? (
            <div className="w-full max-w-[360px] mx-auto text-left">
              <div className="flex justify-center mb-8">
                <img src={logoImg} alt="Moodle Logo" className="h-10 object-contain" />
              </div>

              <h2 className="text-[32px] font-bold text-slate-900 mt-2 text-center">Join Us!</h2>
              <p className="text-slate-500 text-sm mt-2 text-center mb-8">
                Step {regStep} of 2
              </p>

              {regError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" /> {regError}
                </div>
              )}

              <form onSubmit={regStep === 1 ? handleNextStep : handleRegisterSubmit} className="space-y-5">

                {/* ETAPE 1 : IDENTITÉ */}
                <div className={`space-y-5 transition-opacity duration-500 ${regStep === 1 ? "opacity-100 block" : "opacity-0 hidden"}`}>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={handleFocusEmail}
                      onBlur={handleBlur}
                      placeholder="Achille"
                      required={regStep === 1}
                      className="w-full pb-2 pt-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={handleFocusEmail}
                      onBlur={handleBlur}
                      placeholder="Show.meem@gmail.com"
                      required={regStep === 1}
                      className="w-full pb-2 pt-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Password</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={handleFocusPassword}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        required={regStep === 1}
                        className="w-full pb-2 pt-1 pr-8 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors font-mono tracking-wider"
                      />
                      <button type="button" onClick={() => { setShowPassword(!showPassword); setBearState(!showPassword ? "idle" : "password"); }} className="absolute right-0 bottom-3 text-slate-500 hover:text-slate-800">
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Confirm Password</label>
                    <div className="relative group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        onFocus={handleFocusConfirm}
                        onBlur={handleBlur}
                        placeholder="••••••••"
                        required={regStep === 1}
                        className="w-full pb-2 pt-1 pr-8 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors font-mono tracking-wider"
                      />
                      <button type="button" onClick={() => { setShowConfirmPassword(!showConfirmPassword); setBearState(!showConfirmPassword ? "idle" : "peek"); }} className="absolute right-0 bottom-3 text-slate-500 hover:text-slate-800">
                        {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3.5 bg-brand hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center"
                  >
                    Next
                  </button>
                </div>

                {/* ETAPE 2 : MOODLE */}
                <div className={`space-y-6 transition-opacity duration-500 ${regStep === 2 ? "opacity-100 block" : "opacity-0 hidden"}`}>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex gap-3 text-sm text-slate-600">
                    <Info className="w-5 h-5 shrink-0 text-slate-500" />
                    <p>Please enter your Moodle University password to sync your courses.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Moodle Username</label>
                    <input
                      type="text"
                      value={serverUsername}
                      onChange={e => setServerUsername(e.target.value)}
                      onFocus={handleFocusEmail}
                      onBlur={handleBlur}
                      placeholder="Identifiant académique"
                      required={regStep === 2}
                      className="w-full pb-2 pt-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1">Moodle Password</label>
                    <div className="relative group">
                      <input
                        type={showServerPassword ? "text" : "password"}
                        value={serverPassword}
                        onChange={e => setServerPassword(e.target.value)}
                        onFocus={handleFocusPassword}
                        onBlur={handleBlur}
                        placeholder="Moodle password"
                        required={regStep === 2}
                        className="w-full pb-2 pt-1 pr-8 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors font-mono tracking-wider"
                      />
                      <button type="button" onClick={() => { setShowServerPassword(!showServerPassword); setBearState(!showServerPassword ? "idle" : "password"); }} className="absolute right-0 bottom-3 text-slate-500 hover:text-slate-800">
                        {showServerPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="py-3.5 px-6 bg-[#F2F2F2] hover:bg-[#E5E5E5] text-slate-700 rounded-lg font-bold text-sm transition-all shadow-sm active:scale-[0.98] flex items-center justify-center font-mono"
                    >
                      ←
                    </button>
                    <button
                      type="submit"
                      disabled={isRegLoading}
                      className="flex-1 py-3.5 bg-brand hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isRegLoading ? "Creating..." : "Create account"}
                    </button>
                  </div>
                </div>

              </form>

              <div className="mt-8 text-center text-sm font-medium">
                <span className="text-slate-500">Already have an account? </span>
                <button onClick={() => setMode("login")} className="text-slate-900 font-bold hover:underline">Log in</button>
              </div>
            </div>
          ) : (
            // FLUX OTP 
            <div className="w-full max-w-sm mx-auto flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">Verification</h2>
              <p className="text-slate-500 text-sm text-center mb-8 px-4">
                A code has been sent to <strong>{email}</strong>. Enter it to activate.
              </p>
              {isCodeCorrect === false && (
                <p className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-lg mb-6 text-sm font-bold flex items-center gap-2 w-full justify-center">
                  <Info className="w-4 h-4" /> Invalid Code
                </p>
              )}
              <InputOTPBox
                value={code}
                setValue={setCode}
                isLoading={isCodeLoading}
                isCodeCorrect={isCodeCorrect}
                handleComplete={handleOTP}
              />
              <button onClick={() => setVerify(false)} className="mt-8 text-sm font-bold text-slate-600 hover:text-black hover:underline hover:underline-offset-4">
                Back to Registration
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            PANNEAU DROIT SECONDAIRE : MOT DE PASSE OUBLIÉ
        ========================================================================= */}
        <div className={`w-full md:w-1/2 bg-white flex flex-col justify-center px-10 sm:px-14 py-12 transition-all duration-700 absolute top-0 h-full right-0 ${mode === "forgot" ? "opacity-100 z-10 translate-x-0" : "opacity-0 translate-x-full pointer-events-none md:translate-x-full"}`}>
          <div className="w-full max-w-[360px] mx-auto text-left">

            <div className="flex justify-center md:justify-center mb-8">
              <img src={logoImg} alt="Moodle Logo" className="h-10 object-contain" />
            </div>

            <h2 className="text-[32px] font-bold text-slate-900 mt-2 text-center">Forgot Password?</h2>
            <p className="text-slate-500 text-sm mt-2 text-center mb-10">
              Enter your email to receive recovery instructions.
            </p>

            {forgotError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" /> {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {forgotSuccess}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  onFocus={handleFocusEmail}
                  onBlur={handleBlur}
                  placeholder="Show.meem@gmail.com"
                  required
                  className="w-full pb-2 pt-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none bg-transparent text-sm font-medium transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-3.5 bg-brand hover:opacity-90 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
              >
                {isForgotLoading ? "Sending..." : "Send Instructions"}
              </button>
            </form>

            <div className="mt-14 text-center">
              <button onClick={() => setMode("login")} className="text-slate-500 font-bold text-sm hover:underline hover:text-slate-900">← Back to Log in</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
