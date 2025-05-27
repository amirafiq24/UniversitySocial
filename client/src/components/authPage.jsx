import { useState, useEffect } from "react";
import axios from "axios";
import './authPage.css';


function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email || !form.password || (!isLogin && !form.username)) {
      setMessage("Please fill in all fields");
      return;
    }

    if (!form.email.includes("@")) {
      setMessage("Invalid email format");
      return;
    }

    const url = isLogin ? "http://localhost:5000/login" : "http://localhost:5000/register";

    axios.post(url, form)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username);
        onLogin(res.data.token, res.data.username, form.email);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || "Something went wrong";
        setMessage(errorMsg);
      });
  };

  return (
    <div className="body">
      <div className="auth-left">
        <div className="auth-header">
          <img src="/src/assets/logo2.png" alt="UniSocial Logo" className="auth-logo" />
          <h1>Welcome to UniSocial </h1>
        </div>
        <div className="auth-box">
          <h2>{isLogin ? "Login" : "Register"}</h2>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  onChange={handleChange}
                /><br /><br />
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
            /><br /><br />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
            /><br /><br />
            <button type="submit">{isLogin ? "Login" : "Register"}</button>
          </form>

          <br />
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Have an account? Login"}
          </button>

          <p>{message}</p>
        </div>
      </div>

      <div className="auth-illustration">
        <img src="/src/assets/campus.jpg" alt="Campus" />
      </div>
    </div>
  );
}

export default AuthPage;
