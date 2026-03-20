import { useState } from "react";
import "@/styles/login.css";
import { authService } from "@/api/services";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    navigate("/admasters");
    return;
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await authService.login({
        userId: user || "simardeep.singh@neuriot.com",
        password: password || "Password@123",
      });
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("userDetails", JSON.stringify(data.user));
      navigate("/admasters");
    } catch (error) {
      console.error(error);
      setErrorMessage(t('login.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login relative flex min-h-dvh flex-col">
      <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-sm">
          <img src="/logo.png" alt="Findout Logo" className="mx-auto h-auto w-full max-w-[220px] object-contain sm:max-w-[260px]" />
          <h1 className="login-header text-center">{t("login.title")}</h1>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-user" className="text-sm text-neutral-400">
                {t("login.username")}
              </label>
              <input
                id="login-user"
                type="text"
                className="login-input w-full"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder={t("login.usernamePlaceholder")}
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-pass" className="text-sm text-neutral-400">
                {t("login.password")}
              </label>
              <input
                id="login-pass"
                type="password"
                className="login-input w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
              />
            </div>
            <button
              type="button"
              className="mt-2 w-full cursor-pointer rounded-md bg-orange-300 p-4 font-bold text-black hover:bg-orange-400 disabled:opacity-60"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? t("common.loading") : t("login.loginButton")}
            </button>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </form>
        </div>
      </div>
    </main>
  );
}
