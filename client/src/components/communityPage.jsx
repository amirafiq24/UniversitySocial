import { useState, useEffect } from "react";
import axios from "axios";
import './communityPage.css';

function CommunityPage({username, community, joinedCommunities, setJoinedCommunities, onBack}) {
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [selectedCommunity, setSelectedCommunity] = useState(null);

    const [communityPosts, setCommunityPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [createPost, setCreatePost] = useState(false);
    const [newPost, setNewPost] = useState({
        title: "",
        content: "",
        class_tag: "",
        professor_tag: ""
    });

    useEffect(() => {
        axios.get("http://localhost:5000/posts")
        .then(res => {
            const filtered = res.data
                .filter(post => post.community === community.name)
                .reverse();
            setCommunityPosts(filtered);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="loader-main">
                <div className="loader"></div>  
            </div>     
        )
    }

    return (
        <div className="comm-main">
            <div className="comm-body">
                <div className="comm-header">
                    <h1>{community.name} Community</h1>
                    {joinedCommunities.some(j => j.id === community.id) ? (
                    <button
                        className="comm-header-btn"
                        onClick={() => {
                        const token = localStorage.getItem("token");
                        axios.post(
                            `http://localhost:5000/communities/${community.id}/leave`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                            .then(res => {
                            setMessage(res.data.message);
                            setJoinedCommunities(prev =>
                                prev.filter(c => c.id !== community.id)
                                );
                            })
                            .catch(err => setMessage("Failed to leave community"));
                        }}
                    >
                        Leave Community
                    </button>
                    ) : (
                    <button
                        className="comm-header-btn"
                        onClick={() => {
                        const token = localStorage.getItem("token");
                        axios.post(
                            `http://localhost:5000/communities/${community.id}/join`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        )
                            .then(res => {
                            setMessage(res.data.message);
                            setJoinedCommunities(prev => [...prev, { id: community.id, name: community.name }]);
                            })
                            .catch(err => setMessage("Failed to join"));
                        }}
                    >
                        Join Community
                    </button>
                    )}

                    <button onClick={onBack}>Back</button>
                </div>
                <div className="comm-middle">
                    <div className="comm-middle-content">
                        {message && (
                            <p>{message}</p>
                        )}
                        {joinedCommunities.some(j => j.id === community.id) && (
                        <div>
                            <button 
                                className="post-create-cancel-btn"
                                onClick={() => setCreatePost(prev => !prev)}>
                                {createPost ? "Cancel" : "Create Post"}
                            </button>
                            {createPost && (
                                <>
                                <h3>Create Post in {community.name}</h3>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const token = localStorage.getItem("token");

                                    axios.post("http://localhost:5000/posts", {
                                    ...newPost,
                                    community_id: community.id
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
                                            const filtered = r.data
                                                .filter(post => post.community === community.name)
                                                .reverse();
                                            setCommunityPosts(filtered);
                                            setCreatePost(prev => !prev)
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
                        )}
                        <h3>Posts in {community.name}</h3>
                        {communityPosts.length === 0 ? (
                            <p>No posts in this community.</p>
                        ) : (              
                        <div>
                            {communityPosts.map((post) => (
                            <div key={post.id} style={{ marginBottom: "1rem" }}>
                            <div className="comm-post-card">
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
                    )}
                </div>
            </div>
        </div>
    </div>
    )
}

export default CommunityPage