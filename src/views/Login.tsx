import React, { useState } from "react";
import Bubbles from '@components/Bubbles'
import "@styles/login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const apiUrl = import.meta.env["VITE_API_URL"];
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

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
      setErrorMessage("Failed to login. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px]">
        <div>
          <img src="/logo.png" alt="Findout Logo" className="object-fit"/>
        </div>
        <h1 className="login-header">User Login</h1>
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
          <label htmlFor="" className="text-sm text-neutral-400">Username or Email</label>
          <input type="text" className="login-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Enter your UserID" />
          </div>
          <div className="flex flex-col gap-2">
          <label htmlFor="" className="text-sm text-neutral-400">Password</label>
          <input type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
          </div>
          <button type="button" className="p-4 rounded-md text-black bg-orange-300 font-bold !mt-4 cursor-pointer hover:bg-orange-400" onClick={handleLogin} disabled={loading}>
            {loading ? "Loading..." : "Login"}
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
