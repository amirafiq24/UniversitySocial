import axios from "axios";
import { useState, useEffect } from "react";

function PostPage({ post, username, onBack }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const fetchComments = () => {
    axios.get(`http://localhost:5000/posts/${post.id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => console.error("Failed to fetch comments"));
  };

  useEffect(() => {
    fetchComments();
  }, [post]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <p><em>by {post.author}</em></p>

      <hr />
      <h4>Leave a comment</h4>
      <form onSubmit={(e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        axios.post(`http://localhost:5000/posts/${post.id}/comments`, {
          text: newComment
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
          setNewComment("");
          fetchComments();
        }).catch(() => console.error("Failed to comment"));
      }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ width: "100%", height: "80px" }}
        />
        <br />
        <button type="submit" style={{ marginTop: "0.5rem" }}>Post Comment</button>
      </form>

      <hr />
      <h4>Comments</h4>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id} style={{ marginBottom: "1rem" }}>
            <strong>{comment.author}</strong> at {comment.created_at}
            <p>{comment.text}</p>

            {comment.author === username && (
                <button
                onClick={() => {
                    const token = localStorage.getItem("token");
                    axios.delete(`http://localhost:5000/comments/${comment.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                    })
                    .then(() => fetchComments(post.id))
                    .catch(() => setMessage("Failed to delete comment"));
                }}
                style={{ color: "red", fontSize: "0.8rem" }}
                >
                Delete
                </button>
            )}
            <form onSubmit={(e) => {
                e.preventDefault();
                const token = localStorage.getItem("token");
                const replyText = e.target.elements.reply.value;

                axios.post(`http://localhost:5000/posts/${post.id}/comments`, {
                text: replyText,
                parent_id: comment.id  // reply to this comment
                }, {
                headers: { Authorization: `Bearer ${token}` }
                }).then(() => {
                fetchComments(post.id); // reload comments
                e.target.reset();               // clear reply input
                }).catch(() => setMessage("Failed to reply"));
            }}>
                <input
                type="text"
                name="reply"
                placeholder="Reply..."
                style={{ width: "80%" }}
                />
                <button type="submit" style={{ marginTop: "0.8rem", marginLeft: "0.5rem" }}>Reply</button>
            </form>
            {comment.replies && comment.replies.length > 0 && (
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid #ccc" }}>
                {comment.replies.map(reply => (
                    <li key={reply.id} style={{ marginBottom: "0.5rem" }}>
                    <strong>{reply.author}</strong> at {reply.created_at}
                    <p>{reply.text}</p>

                    {reply.author === username && (
                        <button
                        onClick={() => {
                            const token = localStorage.getItem("token");
                            axios.delete(`http://localhost:5000/comments/${reply.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                            })
                            .then(() => fetchComments(post.id))
                            .catch(() => setMessage("Failed to delete reply"));
                        }}
                        style={{ color: "red", fontSize: "0.8rem" }}
                        >
                        Delete
                        </button>
                    )}
                    </li>
                ))}
                </ul>
            )}
          </li>
        ))}
      </ul>

      <button onClick={onBack} style={{ marginTop: "1rem" }}>Back to Community</button>
    </div>
  );
}

export default PostPage;
