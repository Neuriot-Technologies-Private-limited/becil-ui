import React, { useState } from "react";
import Bubbles from '@components/Bubbles'
import "@styles/login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@components/LanguageSwitcher';

export default function Login() {
  const apiUrl = import.meta.env["VITE_API_URL"];
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
      const response = await axios.post(
        `${apiUrl}/users/login`,
        // {
        //   userId:userID.toLowerCase(),
        //   password,
        // }
        {
          userId: "simardeep.singh@neuriot.com",
          password: "Password@123",
        }
      );
      console.log("response", response);
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("userDetails", JSON.stringify(response.data.data.user));
      navigate("/admasters");
    } catch (error) {
      console.error(error);
      setErrorMessage(t('login.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login relative">
      {/* Language Switcher in top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px]">
        <div>
          <img src="/logo.png" alt="Findout Logo" className="object-fit"/>
        </div>
        <h1 className="login-header">{t('login.title')}</h1>
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
          <label htmlFor="" className="text-sm text-neutral-400">{t('login.username')}</label>
          <input type="text" className="login-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder={t('login.usernamePlaceholder')} />
          </div>
          <div className="flex flex-col gap-2">
          <label htmlFor="" className="text-sm text-neutral-400">{t('login.password')}</label>
          <input type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} />
          </div>
          <button type="button" className="p-4 rounded-md text-black bg-orange-300 font-bold !mt-4 cursor-pointer hover:bg-orange-400" onClick={handleLogin} disabled={loading}>
            {loading ? t('common.loading') : t('login.loginButton')}
          </button>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </form>
      </div>
      {/*
      <Bubbles />
      */}
    </main>
  );
}
