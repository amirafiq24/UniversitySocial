import { useState, useEffect } from "react";
import axios from "axios";
import PostPage from "./postPage";

function UniHubPage({ userEmail, username, onLogout }) {
  // put your full logged-in state/logic here
  // use userEmail and username from props
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [tagQuery, setTagQuery] = useState(""); // new state for the input
  const [selectedPost, setSelectedPost] = useState(null); // the post being viewed
  const [postComments, setPostComments] = useState([]);   // all comments for selected post
  const [newComment, setNewComment] = useState("");        // input for new comment
  const [editingPostId, setEditingPostId] = useState(null); 
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    class_tag: "",
    professor_tag: ""
  });


  useEffect(() => {
    axios.get("http://localhost:5000/posts")
    .then((res) => {
        setPosts(res.data);  // Save posts to state
    })
    .catch((err) => {
        console.error("Failed to fetch posts", err);
    });
  }, []); 

  useEffect(() => {
    axios.get("http://localhost:5000/communities")
        .then(res => setCommunities(res.data))
        .catch(err => console.error("Failed to load communities", err));
  }, []);

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
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/me/communities", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => setJoinedCommunities(res.data))
    .catch(err => console.error("Failed to fetch joined communities", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    onLogout();
  };

  const fetchComments = (postId) => {
      axios.get(`http://localhost:5000/posts/${postId}/comments`)
        .then(res => setPostComments(res.data))
        .catch(err => console.error("Failed to load comments", err));
    };

  if (selectedPost) {
    return (
      <PostPage
        post={selectedPost}
        username={username}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  return (
      <div style={{ padding: "2rem" }}>
        <h1>Welcome to UniHub!</h1>
        <p>You are logged in as: <strong>{userEmail}</strong></p>
        <button onClick={handleLogout}>Logout</button>     

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

      <p>{message}</p>

        {selectedCommunity && joinedCommunities.includes(selectedCommunity.id) && (
          <div style={{ marginTop: "2rem" }}>
            <h3>Create Post in {selectedCommunity.name}</h3>

            <form onSubmit={(e) => {
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
            }}>
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
            <select onChange={(e) => {
              const order = e.target.value;
              const sorted = [...communityPosts];

              if (order === "time") {
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              } else if (order === "votes") {
                sorted.sort((a, b) => b.votes - a.votes);
              }

              setCommunityPosts(sorted);
            }}>
              <option value="time">Newest First</option>
              <option value="votes">Most Voted</option>
            </select>

            {/* Tag filter input */}
            <input
              type="text"
              placeholder="Filter by tag (e.g. CMPEN 331)"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              style={{ marginTop: "1rem", padding: "0.5rem", marginRight: "0.5rem" }}
            />

            {/* Filter button */}
            <button
              onClick={() => {
                const query = tagQuery.toLowerCase();
                const filtered = posts.filter(post =>
                  post.tags?.some(tag => tag.label.toLowerCase().includes(query))
                );
                setCommunityPosts(filtered);
              }}
            >
              Filter
            </button>

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

                    <button onClick={() => {
                      setSelectedPost(post); // Set the selected post
                      fetchComments(post.id); // Load its comments
                    }}>
                      View Post
                    </button>

                    <div style={{ fontSize: "0.9rem", color: "#555" }}>
                      <span>by <strong>{post.author}</strong></span> ·{" "}
                      <span>{post.created_at}</span>
                    </div>

                    <div style={{ marginTop: "0.5rem" }}>
                      {post.tags?.map((tag, i) => (
                        <span key={i} style={{
                          padding: "0.2rem 0.5rem",
                          backgroundColor: tag.type === "class" ? "#e0f0ff" : "#ffe0e0",
                          borderRadius: "6px",
                          marginRight: "0.5rem",
                          fontSize: "0.8rem"
                        }}>
                          {tag.label}
                        </span>
                      ))}
                    </div>

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

      </div>
    );
  }

export default UniHubPage;
