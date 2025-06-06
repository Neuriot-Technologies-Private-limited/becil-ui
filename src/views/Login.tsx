import React,{ useState } from "react"
import '@styles/login.css'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  let [email, setEmail] = useState("");
  let [userID, setUserID] = useState();
  let [password, setPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  let handleLogin = async(e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); 
    const uRL=import.meta.env.MODE=="development" ?'http://152.52.91.163:5005/api/':'https://bot-api.neuriot.com/api/'
    // const uRL=import.meta.env.MODE=="development" ?'http://localhost:5005/api/':'https://bot-api.neuriot.com/api/'
    try {
      console.log('import.meta.env.VITE_API_UR',import.meta.env)
      const response = await axios.post(`${uRL}users/login`, 
      // {
      //   userId:userID.toLowerCase(),
      //   password,
      // }
      {
 
        "userId": "simardeep.singh@neuriot.com",
        "password": "Password@123"
      }
    );
      console.log('response',response)
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userDetails', JSON.stringify(response.data.data.user));
      // navigate('/chats');
      navigate('/admasters');
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to login. Please check your credentials and try again.");
    }finally {
      setLoading(false); // Ensure loader is hidden after API call
    }
  }

  return (
    <main className="login">
      <div className="login-left">
        <img src="/airobot.jpg" alt="AI assistant" className="login-robot"/>
      </div>
      <div className="login-right">
        {/* <img src="/findoutAi.jpg" alt="Findout Logo" className="login-logo"/> */}
        <h1 className="login-header">Log In</h1>
        <form className="login-form">
          <input type="text" className="login-input" value={userID} onChange={e =>setUserID(e.target.value)} placeholder="Enter your UserID"/>
          <input type="password" className="login-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/>
          <button type="button" className="login-button" onClick={handleLogin} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </form>
      </div>
    </main>
  )
}
