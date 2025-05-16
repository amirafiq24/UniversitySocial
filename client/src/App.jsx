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
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [username, setUsername] = useState("");


  const [editingPostId, setEditingPostId] = useState(null); 
  const [editForm, setEditForm] = useState({ title: "", content: "" });


  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    class_tag: "",
    professor_tag: ""
  });



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
    const storedUsername = localStorage.getItem("username");
    if (email && storedUsername) {
      setUserEmail(email);
      setUsername(storedUsername);
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

  useEffect(() => {
    if (loggedIn) {
      axios.get("http://localhost:5000/communities")
        .then(res => setCommunities(res.data))
        .catch(err => console.error("Failed to load communities", err));
    }
  }, [loggedIn]);

  useEffect(() => {
    if (selectedCommunity) {
      axios.get("http://localhost:5000/posts")
        .then(res => {
          const filtered = res.data.filter(
            post => post.community === selectedCommunity.name
          );
          setCommunityPosts(filtered);
        });
    }
  }, [selectedCommunity]);

  useEffect(() => {
    if (loggedIn) {
      const token = localStorage.getItem("token");
      axios.get("http://localhost:5000/me/communities", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setJoinedCommunities(res.data))
      .catch(err => console.error("Failed to fetch joined communities", err));
    }
  }, [loggedIn]);

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
          localStorage.setItem("username", res.data.username);
          setUserEmail(getUserFromToken()); // Extract email
          setLoggedIn(true); // Update login state
          setUsername(res.data.username); // backend must send this
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
    localStorage.removeItem("username");
    setUserEmail("");
    setUsername("");
    setLoggedIn(false);
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

        <h2>Communities</h2>
        <h4>Create a New Community</h4>
        <form onSubmit={(e) => {
          e.preventDefault(); // prevent full-page reload
          if (!newCommunityName.trim()) {
            setMessage("Community name cannot be empty");
            return;
          }

          axios.post("http://localhost:5000/communities", {
            name: newCommunityName
          })
            .then(res => {
              setMessage(res.data.message);
              setNewCommunityName(""); // reset input
              return axios.get("http://localhost:5000/communities"); // refresh list
            })
            .then(res => setCommunities(res.data))
            .catch(err => {
              const msg = err.response?.data?.message || "Failed to create community";
              setMessage(msg);
            });
        }}>
          <input
            type="text"
            placeholder="e.g. Electrical Engineering"
            value={newCommunityName}
            onChange={(e) => setNewCommunityName(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: "0.5rem" }}>
            Create
          </button>
        </form>

        <ul>
          {communities.map((c) => (
            <li key={c.id}>
              <button onClick={() => setSelectedCommunity(c)}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>

        {selectedCommunity && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Create Post in {selectedCommunity.name}</h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const token = localStorage.getItem("token");

              axios.post("http://localhost:5000/posts", {
                ...newPost,
                community_id: selectedCommunity.id
              }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              })
                .then(res => {
                  setMessage(res.data.message);
                  setNewPost({ title: "", content: "", class_tag: "", professor_tag: "" });
                  // Optional: refresh posts
                  axios.get("http://localhost:5000/posts")
                    .then(r => {
                      const filtered = r.data.filter(
                        post => post.community === selectedCommunity.name
                      );
                      setCommunityPosts(filtered);
                    });
                })
                .catch(err => {
                  const msg = err.response?.data?.message || "Failed to create post";
                  setMessage(msg);
                });
            }}
          >
            <input
              type="text"
              placeholder="Post title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            /><br /><br />

            <textarea
              placeholder="Post content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            /><br /><br />

            <input
              type="text"
              placeholder="Class tag (e.g. CMPEN 331)"
              value={newPost.class_tag}
              onChange={(e) => setNewPost({ ...newPost, class_tag: e.target.value })}
            /><br /><br />

            <input
              type="text"
              placeholder="Professor tag (e.g. Dr. Smith)"
              value={newPost.professor_tag}
              onChange={(e) => setNewPost({ ...newPost, professor_tag: e.target.value })}
            /><br /><br />

            <button type="submit">Post</button>
          </form>
        </div>
      )}

          
        {selectedCommunity && (
          <div>
            <h3>Posts in {selectedCommunity.name}</h3>
            {communityPosts.length === 0 ? (
              <p>No posts in this community.</p>
            ) : (
              <ul>
                {communityPosts.map((post) => (
                  <li key={post.id} style={{ marginBottom: "1rem" }}>
                    <strong>{post.title}</strong> <br />
                    <em>by {post.author}</em>
                    <p>{post.content}</p>
                    
                    {/* Show edit/delete buttons if this user created the post */}
                    
                    {post.author === username && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditForm({ title: post.title, content: post.content });
                          }}
                          style={{ marginRight: "0.5rem" }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            const token = localStorage.getItem("token");
                            axios.delete(`http://localhost:5000/posts/${post.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            })
                              .then(res => {
                                setMessage(res.data.message);
                                // Remove the deleted post from UI
                                setCommunityPosts(prev => prev.filter(p => p.id !== post.id));
                              })
                              .catch(err => setMessage("Failed to delete post"));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Edit form appears below the post being edited */}
                    {editingPostId === post.id && (
                      <form
                        style={{ marginTop: "1rem" }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const token = localStorage.getItem("token");
                          axios.put(`http://localhost:5000/posts/${post.id}`, editForm, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                            .then(res => {
                              setMessage(res.data.message);
                              setEditingPostId(null);
                              // Reload posts
                              axios.get("http://localhost:5000/posts")
                                .then(r => {
                                  const filtered = r.data.filter(
                                    p => p.community === selectedCommunity.name
                                  );
                                  setCommunityPosts(filtered);
                                });
                            })
                            .catch(err => setMessage("Failed to update post"));
                        }}
                      >
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        /><br /><br />
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        /><br /><br />
                        <button type="submit">Save</button>
                        <button
                          type="button"
                          style={{ marginLeft: "0.5rem" }}
                          onClick={() => setEditingPostId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {selectedCommunity && (
        joinedCommunities.includes(selectedCommunity.id) ? (
          <button
            onClick={() => {
              const token = localStorage.getItem("token");
              axios.post(
                `http://localhost:5000/communities/${selectedCommunity.id}/leave`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
                .then(res => {
                  setMessage(res.data.message);
                  setJoinedCommunities(prev =>
                    prev.filter(id => id !== selectedCommunity.id)
                  );
                })
                .catch(err => setMessage("Failed to leave community"));
            }}
          >
            Leave Community
          </button>
        ) : (
          <button
            onClick={() => {
              const token = localStorage.getItem("token");
              console.log("Token:", token);
              axios.post(
                `http://localhost:5000/communities/${selectedCommunity.id}/join`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
                .then(res => {
                  setMessage(res.data.message);
                  setJoinedCommunities(prev => [...prev, selectedCommunity.id]);
                })
                .catch(err => setMessage("Failed to join"));
            }}
          >
            Join Community
          </button>
        )
      )}



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
