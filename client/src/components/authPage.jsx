import { useState, useEffect } from "react";
import axios from "axios";
import './AuthPage.css';


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
        onLogin(form.email, res.data.username); // pass to parent
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || "Something went wrong";
        setMessage(errorMsg);
      });
  };

  return (
    <div className="body">
      <div className="auth-box">
        <h1>Welcome to UniSocial </h1>
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

      <div className="auth-illustration">
        <img src="/src/assets/campus.jpg" alt="Campus" />
      </div>
    </div>
  );
}

export default AuthPage;
