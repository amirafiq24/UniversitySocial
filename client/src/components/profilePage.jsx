import { useState, useEffect } from "react";
import axios from "axios";
import './profilePage.css';
import PostPage from "./postPage";

function ProfilePage ({userEmail, username, university, onBack}) {

    const [loadingCount, setLoadingCount] = useState(2);
    const [userPosts, setUserPosts] = useState([]);
    const sortedPosts = [...userPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const [selectedPost, setSelectedPost] = useState(null);
    const [userComments, setUserComments] = useState([]);
    const sortedComments = [...userComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const [userCommunities, setUserCommunities] = useState([]);

    const recentPosts = sortedPosts.slice(0, 5);
    const recentComments = sortedComments.slice(0, 5);



    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found");
        return;
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.get("http://localhost:5000/me/posts", {
        headers: {
        Authorization: `Bearer ${token}`
        }
    })
        .then(res => {
            setUserPosts(res.data);
        })
        .catch(err => {
            console.error("Failed to fetch user posts", err);
        })
        .finally(() => {
            setLoadingCount(c => c - 1);
        });
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.get("http://localhost:5000/me/comments", {
        headers: {
        Authorization: `Bearer ${token}`
        }
    })
        .then(res => setUserComments(res.data))
        .catch(err => console.error("Failed to fetch user comments", err))
        .finally(() => setLoadingCount(c => c - 1));
    }, []);

    useEffect (() => {
        const token = localStorage.getItem("token");
        axios.get("http://localhost:5000/me/communities", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => setUserCommunities(res.data))
            .catch(err => console.error("Failed to fetch joined communities"));
    }, []);

    if (loadingCount > 0) {
        return (
            <div className="loader-main">
              <div className="loader"></div>  
            </div>     
        ) 
    }

    if (selectedPost) {
        return (
            <PostPage
                post={selectedPost}
                username={username}
                onBack = {() => setSelectedPost(null)}               
            />
        )
    }

    return (
        <div className="profile-main">
            <div className="profile-body">
                <div className="profile-header">
                    <img src="/src/assets/logo2.png" alt="UniSocial Logo" className="profile-logo" />
                    <h1 className="profile-greeting">Hi {username}!</h1>
                    <button className="profile-back-btn" onClick={onBack}>Back</button>
                </div>
                <div className="profile-body-info">
                    <p><strong>Username:</strong> {username}</p>
                    <p><strong>Email:</strong> {userEmail}</p>
                    <p><strong>University:</strong> {university}</p>
                    <p>Joined Communities</p>
                    {userCommunities.map((comm) => (
                        <p>{comm.name}</p>
                    ))}
                </div>
                <div className="profile-middle">
                    <div className="profile-left">
                        <h2>Your Posts</h2>
                        {userPosts.length === 0 && (
                            <div className="profile-post-box">
                                <p>No posts</p>
                            </div>
                        )}
                        {recentPosts.map((post) => (
                            <div className="profile-post-box" key={post.id}>
                                <strong>{post.title} in {post.community}</strong> <br />
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
                        ))}
                    </div>
                    <div className="profile-right">
                        <h2>Your Comments</h2>
                        {userComments.length === 0 && (
                            <div className="profile-comments-box">
                                <p>No comments</p>
                            </div>
                        )}
                        {recentComments.map((comment) => (
                            <div className="profile-comments-box">
                                <p>You commented "{comment.text}"</p>
                                <p>on <strong>{comment.post_title}</strong> in <strong>{comment.post_community}</strong></p>
                                <button onClick={() => {
                                    axios.get('http://localhost:5000/posts')
                                    .then(res => {
                                        const post = res.data.find(p => p.id === comment.post_id);
                                        setSelectedPost(post);
                                    })
                                    .catch(err => console.error("Failed to fetch post", err));
                                }}>View Post</button>
                            </div>
                        ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage;