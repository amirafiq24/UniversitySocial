import { useState, useEffect } from "react";
import axios from "axios";
import PostPage from "./postPage";
import ProfilePage from "./profilePage";
import './uniSocialPage.css';

function UniHubPage({ userEmail, username, university, onLogout }) {
  // put your full logged-in state/logic here
  // use userEmail and username from props
  const [universityName, setUniversityName] = useState("");
  const [profileOption, setProfileOption] = useState(false);
  const [viewProfie, setViewProfile] = useState(false);
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [searchedCommunity, setSearchedCommunity] = useState([]);
  const [searchedResults, setSearchedResults] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [tagQuery, setTagQuery] = useState(""); // new state for the input
  const [selectedPost, setSelectedPost] = useState(null); // the post being viewed 
  const [createPost, setCreatePost] = useState(false);
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
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/me/university", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setUniversityName(res.data.university_name);
    })
    .catch((err) => {
      console.error("Failed to fetch university", err);
    });
  }, []); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/communities" , {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
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

  const profileToggle = () => {
    setProfileOption(prev => !prev);
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    onLogout();
  };

  const suggestedCommunities = communities
    .filter(c => !joinedCommunities.includes(c.id)) // remove joined ones
    .slice(0, 5); // take first 5 only

  if (viewProfie) {
    return (
      <ProfilePage  
        userEmail={userEmail}
        username={username}
        university={universityName}
        onBack={() => setViewProfile(false)}
      />
    );
  }

  if (selectedPost) {
    return (
      <PostPage
        post={selectedPost}
        setCommunityPosts={setCommunityPosts}
        username={username}
        selectedCommunity={selectedCommunity}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  return (
    <div>
      <div className="profile-container">
        <img src="/src/assets/logo2.png" alt="UniSocial Logo" className="logo-header" />
        {!profileOption && (
          <p className="tagline">Connecting Students</p>
        )}
        <button className="profile-btn" onClick={profileToggle}>
          <img src="/src/assets/profile2.png" alt="Profile" className="profile-img" />
        </button>
        {profileOption && (
          <div className="profile-options-bar">
            <p className="username">{username}</p>
            <button onClick={() => setViewProfile(true)} className="profile-option">View Profile</button>
            <button className="profile-option">Settings</button>
            <button onClick={handleLogout} className="profile-option">Logout</button>
          </div>
        )}
      </div>
      <div className="body">
        <div>
          <div className="page-box">
            <h1>Welcome to UniSocial!</h1>
            <p>You are logged in as: <strong>{username}</strong></p>

            <h2 className="page-box-yourcomm">Your Communities</h2>

            {joinedCommunities.length === 0 ? (
              <p>You haven't joined any communities yet.</p>
            ) : (
              <ul>
                {communities
                  .filter((c) => joinedCommunities.includes(c.id))
                  .map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setSelectedCommunity(
                        selectedCommunity?.id === c.id ? null : c
                        )}>{c.name}
                      </button>
                    </li>
                  ))}
              </ul>          
            )}

            <h2>Explore Communities</h2>
            <form onSubmit={(e) => {
              e.preventDefault(); // prevent full-page reload
              if (!searchedCommunity.trim()) {
                setMessage("Community name cannot be empty");
                return;
              }

              const results = communities.filter(c =>
                c.name.toLowerCase().includes(searchedCommunity.toLowerCase())
              );
              setSearchedResults(results);
              
            }}> 

            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={searchedCommunity}
              onChange={(e) => setSearchedCommunity(e.target.value)}
              ></input>

            <button type="submit" style={{ marginLeft: "0.5rem" }}>
              Search
            </button>
            </form>

            {searchedResults.length > 0 && (
              <ul>
                {searchedResults.map((c) => (
                  <li key={c.id}>
                      <button onClick={() => setSelectedCommunity(c)}>{c.name}</button>
                  </li>
                ))}
              </ul>
            )}

            <h2>Suggested Communities</h2>
            <ul>
              {suggestedCommunities.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelectedCommunity(c)}>{c.name}</button>
                </li>
              ))}
            </ul>

            <h2>Create a New Community</h2>
            <form onSubmit={(e) => {
              e.preventDefault(); // prevent full-page reload
              if (!newCommunityName.trim()) {
                setMessage("Community name cannot be empty");
                return;
              }

              const token = localStorage.getItem("token");

              axios.post("http://localhost:5000/communities", 
                  { name: newCommunityName },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                )
                .then(res => {
                  setMessage(res.data.message);
                  setNewCommunityName(""); // reset input
                  return axios.get("http://localhost:5000/communities", {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }); // refresh list
                })
                .then(res => setCommunities(res.data))
                .catch(err => {
                  const msg = err.response?.data?.message || "Failed to create community";
                  setMessage(msg);
                });
            }}>
              <input
                className="page-box-createnew"
                type="text"
                placeholder="e.g. Electrical Engineering"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
              />
              <button type="submit" style={{ marginLeft: "0.5rem" }}>
                Create
              </button>
            </form>
            <p>{message}</p>
          </div>
        </div>

        <div className="page-community">
          <div className="community-header">
            {selectedCommunity ? (
              <h1>{selectedCommunity.name} Community</h1>
            ) : (
              <h2>Select a Community</h2>
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

          {(selectedCommunity && joinedCommunities.includes(selectedCommunity.id)) ? (
            <div>
              <button 
                className="post-create-cancel-btn"
                onClick={() => setCreatePost(prev => !prev)}>
                {createPost ? "Cancel" : "Create Post"}
              </button>
              {createPost && (
                <>
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
              </>
              )}
            </div>  
          ) : (
            <h4>You must be a part of community to post</h4>
          )}


            
          {selectedCommunity && (
            <div>
              <select onChange={(e) => {
                const order = e.target.value;
                const sorted = [...communityPosts];

                if (order === "time") {
                  sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                } else if (order === "votes") {
                  sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                }

                setCommunityPosts(sorted);
              }}>
                <option value="time">Newest First</option>
                <option value="votes">Oldest First</option>
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
              <div>
              {communityPosts.map((post) => (
                  <div key={post.id} style={{ marginBottom: "1rem" }}>
                    <div className="post-card">
                      <strong>{post.title}</strong> <br />
                      <em>by {post.author}</em>
                      <p>{post.content}</p>

                      <div style={{ fontSize: "0.9rem", color: "#555" }}>
                        <span>{post.created_at}</span>
                      </div>

                      <button 
                        className="view-btn"
                        onClick={() => {
                          setSelectedPost(post);
                        }}>
                        View Post
                      </button>

                      <div style={{ marginTop: "0.5rem" }}>
                        {post.tags?.map((tag, i) => (
                          <span key={i} style={{
                            padding: "0.2rem 0.5rem",
                            backgroundColor: tag.type === "class" ? "#d5f7d4" : "#b6eac5",
                            borderRadius: "6px",
                            marginRight: "0.5rem",
                            fontSize: "0.8rem"
                          }}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }

export default UniHubPage;
