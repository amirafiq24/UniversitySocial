import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  // Track whether the user is viewing the login or register form
  const [isLogin, setIsLogin] = useState(true);

  // Store form input values
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  // Store messages from backend (success, error, etc.)
  const [message, setMessage] = useState("");

  // Track whether the user is logged in (based on token in localStorage)
  const [loggedIn, setLoggedIn] = useState(false);

  // Extract and show user email from token
  const [userEmail, setUserEmail] = useState("");

  const [posts, setPosts] = useState([]);

  // Decode token to extract user identity (email)
  const getUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub; // 'sub' is the default field for identity in JWT
    } catch {
      return null;
    }
  };

  // On first load, auto-login if token exists
  useEffect(() => {
    const email = getUserFromToken();
    if (email) {
      setUserEmail(email);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) {
      axios.get("http://localhost:5000/posts")
        .then((res) => {
          setPosts(res.data);  // Save posts to state
        })
        .catch((err) => {
          console.error("Failed to fetch posts", err);
        });
    }
  }, [loggedIn]); // This runs only when `loggedIn` becomes true


  // Update form state when the user types in any input field
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission for both login and register
  const handleSubmit = (e) => {
    e.preventDefault();

    // Frontend validation: ensure all fields are filled
    if (!form.email || !form.password || (!isLogin && !form.username)) {
      setMessage("Please fill in all fields");
      return;
    }

    // Choose the appropriate endpoint
    const url = isLogin
      ? "http://localhost:5000/login"
      : "http://localhost:5000/register";

    // Send form data to Flask backend
    axios
      .post(url, form)
      .then((res) => {
        setMessage(res.data.message);

        // If login was successful and token returned
        if (isLogin && res.data.token) {
          localStorage.setItem("token", res.data.token); // Save token
          setUserEmail(getUserFromToken()); // Extract email
          setLoggedIn(true); // Update login state
        }
      })
      .catch((err) => {
        const errorMsg =
          err.response?.data?.message || "Something went wrong";
        setMessage(errorMsg);
      });
  };

  // Clear token and state on logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setUserEmail("");
    setMessage("Logged out");
  };

  // UI shown when user is logged in
  if (loggedIn) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to UniHub!</h1>
        <p>You are logged in as: <strong>{userEmail}</strong></p>
        <button onClick={handleLogout}>Logout</button>
        <p>{message}</p>

        <h2>Posts</h2>
          <ul>
            {posts.map((post) => (
              <li key={post.id} style={{ marginBottom: "1rem" }}>
                <strong>{post.title}</strong> <br />
                <em>by {post.author} in {post.community}</em> <br />
                <p>{post.content}</p>
              </li>
            ))}
          </ul>

      </div>
    );
  }

  // UI for login and registration forms
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{isLogin ? "Login" : "Register"}</h1>

      <form onSubmit={handleSubmit}>
        {/* Show username input only during registration */}
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

      {/* Toggle between login and register forms */}
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need an account? Register" : "Have an account? Login"}
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;
