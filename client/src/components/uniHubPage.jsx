import { useState, useEffect } from "react";
import axios from "axios";
import PostPage from "./postPage";
import ProfilePage from "./profilePage";
import './uniSocialPage.css';
import CommunityPage from "./communityPage";

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
  const [createCommunity, setCreateCommunity] = useState(false);
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
  
  const [loading, setLoading] = useState(true);


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
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/me/communities" , {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
        .then(res => setJoinedCommunities(res.data))
        .catch(err => console.error("Failed to load communities", err));
  }, []);

  useEffect(() => {
    console.log(joinedCommunities);
    if (joinedCommunities.length === 0) return;

    axios.get("http://localhost:5000/posts")
      .then(res => {
        const joinedNames = joinedCommunities.map(c => c.name); 

        const filtered = res.data
          .filter(post => joinedNames.includes(post.community))
          .reverse();
        
        setCommunityPosts(filtered);
        setLoading(false);
      });
  }, [joinedCommunities]); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/me/communities", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => setJoinedCommunities(res.data))
    .catch(err => console.error("Failed to fetch joined communities", err));
  }, [selectedCommunity]);

  const profileToggle = () => {
    setProfileOption(prev => !prev);
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    onLogout();
  };

  const suggestedCommunities = communities
    .filter(c => !joinedCommunities.some(j => j.id === c.id)) // remove joined ones
    .slice(0, 5); // take first 5 only

  if (loading) {
    return (
      <div className="loader-main">
        <div className="loader"></div>  
      </div>    
    )
  }

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
        username={username}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  if (selectedCommunity) {
    return (
      <CommunityPage
        username={username}
        community={selectedCommunity}
        joinedCommunities={joinedCommunities}
        setJoinedCommunities={setJoinedCommunities}
        onBack={() => setSelectedCommunity(null)}
      />
    )
  };

  return (
    <div className="page-main">
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
      <div className="page-body">
        <div className="page-your-comm">
          <h2>Your Communities</h2>
            {joinedCommunities.length === 0 ? (
          <p>You haven't joined any communities yet.</p>
          ) : (
            <div className="page-your-comm-btn">
            {joinedCommunities.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  setSelectedCommunity(
                    selectedCommunity?.id === c.id ? null : c
                  )
                }
              >
                {c.name}
              </button>
              ))} 
              </div>
          )}
        </div>
        <div className="page-box">
          <div className="page-greet">  
            <h1>Welcome to UniSocial!</h1>
            <p>You are logged in as: <strong>{username}</strong></p>
          </div>
    
          <div className="page-comm-card">
            {!createCommunity ? (
              <>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "10px" }}>
                <h2 style={{ margin: 0 }}>Explore Communities</h2>
                {/* <button 
                  style={{ height: "40px", padding: "0 1rem" }}
                  onClick={() => setCreateCommunity(true)}>
                    Create a New Community
                  </button>*/}
                
              </div>
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
                className="page-input"
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

              {searchedResults.length === 0 && (
                <>
                  <p style={{marginTop: "10px", marginBottom: "5px"}}><strong>Suggested Communities</strong></p>
                  {suggestedCommunities.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCommunity(c)}>
                      {c.name}
                    </button>
                  ))}
                </>
              )}
              </>
            ) : (
              <>
                <div style={{display: "flex", alignItems: "center", gap: "5px", marginTop: "10px"}}>
                  <h2 style={{ margin: 0 }}>Create a New Community</h2>
                  <button 
                    onClick={() => setCreateCommunity(false)}
                    style={{height: "40px", padding: "0 1rem" }}
                  >Cancel</button>
                </div>
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
                    setCreateCommunity(false);
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
              </>
            )}
            
          </div>
          <p>{message}</p>
          <div className="page-post">
            {communityPosts.map((post) => (
            <div key={post.id} style={{ marginBottom: "1rem" }}>
            <div className="comm-post-card">
              <h2 style={{margin: "0px"}}>{post.community} Community</h2>
                <strong>{post.title}</strong> <br />
                <em>by {post.author}</em>
                <p style={{ whiteSpace: "pre-line" }}>{post.content}</p>

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
        </div>
      </div>
    </div>
    );
  }

export default UniHubPage;
