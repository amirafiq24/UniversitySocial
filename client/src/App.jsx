import { useState, useEffect } from "react";
import AuthPage from "./components/authPage";
import UniHubPage from "./components/uniHubPage";
import axios from "axios";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get("http://localhost:5000/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUserEmail(res.data.email);
        setUsername(res.data.username);
        setLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setLoggedIn(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (token, uname, email) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", uname);
    setUserEmail(email);
    setUsername(uname);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setLoggedIn(false);
    setUserEmail("");
    setUsername("");
  };

  if (loading) return <p>Loading...</p>;

  return loggedIn ? (
    <UniHubPage userEmail={userEmail} username={username} onLogout={handleLogout} />
  ) : (
    <AuthPage onLogin={handleLogin} />
  );
}

export default App;
