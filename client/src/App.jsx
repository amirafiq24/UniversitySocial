import { useState, useEffect } from "react";
import AuthPage from "./components/authPage";
import UniHubPage from "./components/uniHubPage";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
    const storedUsername = localStorage.getItem("username");

    if (token && email && storedUsername) {
      setUserEmail(email);
      setUsername(storedUsername);
      setLoggedIn(true);
    }
  }, []);

  const handleLogin = (email, uname) => {
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

  return loggedIn ? (
    <UniHubPage userEmail={userEmail} username={username} onLogout={handleLogout} />
  ) : (
    <AuthPage onLogin={handleLogin} />
  );
}

export default App;
