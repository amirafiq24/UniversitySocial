from flask import Flask, jsonify, request
from flask_cors import CORS
from extensions import db, bcrypt, jwt
from models.user import User
from models.community import Community, user_community
from models.post import Post
from models.tag import Tag
from models.university import University
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://unisocial_user:abu123@localhost/unisocial"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
app.config["JWT_SECRET_KEY"] = "super-secret"  # You should use a real secret key later            # For generating JWT tokens
bcrypt.init_app(app)
jwt.init_app(app)

users = {}  # format: { "email": {"username": ..., "password": <hashed_pw>} }

@app.route("/")
def hello():
    return jsonify({"message": "Hello from backend!"})

@app.route("/test")
def test():
    return jsonify({"message": "This is a test route!"})

@app.route("/universities", methods=["GET"])
def get_universities():
    universities = University.query.all()
    return jsonify([
        { "id": u.id, "name": u.name} for u in universities
    ])

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Extract fields from request
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    university = data.get("university")

    if not username or not email or not password or not university:
        return jsonify({"message": "All fields are required"}), 400

    if "@" not in email:
        return jsonify({"message": "Invalid email format"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    # Check if the email is already in the database
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "Email already registered"}), 400

    # Hash the password using bcrypt for security
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create a new User object
    new_user = User(username=username, email=email, password=hashed_pw, university_id=university)

    # Add the user to the database
    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=email)

    return jsonify({
        "message": f"User {username} registered successfully!",
        "token": access_token,
        "username": username,
        "university": university
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # Get login credentials from request
    email = data.get("email")
    password = data.get("password")

    # Look up user in database by email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Check hashed password against the one stored in DB
    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Incorrect password"}), 401

    # If password is correct, generate a JWT token
    access_token = create_access_token(identity=email)

    return jsonify({
        "message": f"Welcome back, {user.username}!",
        "token": access_token,
        "username": user.username,
    }), 200


@app.route("/seed")
def seed_data():
    from models import User, Community, Post, Comment, Tag

    # Check if user already exists
    if User.query.filter_by(email="test@example.com").first():
        return jsonify({"message": "Seed data already exists"}), 200

    # Create dummy user
    hashed_pw = bcrypt.generate_password_hash("testpass").decode("utf-8")
    user = User(username="TestUser", email="test@example.com", password=hashed_pw)

    # Create dummy community
    community = Community(name="Computer Science")

    # Create dummy post
    post = Post(title="Best resources for CMPEN 331?",
                content="Anyone know a good textbook or video series?",
                author=user,          # 'author' is the backref to User
                community=community)  # 'community' is the backref to Community

    # Create dummy comment
    comment = Comment(text="Try the lecture slides from last semester.",
                      commenter=user,  # 'commenter' backref to User
                      post=post)       # 'post' backref to Post

    # Create dummy tag
    tag = Tag(label="CMPEN 331", post=post)

    # Add all to the session
    db.session.add_all([user, community, post, comment, tag])
    db.session.commit()

    return jsonify({"message": "Dummy data added!"}), 201

@app.route("/users")
def get_users():
    users = User.query.all()
    result = [{"id": u.id, "username": u.username, "email": u.email, "university_id":u.university_id} for u in users]
    return jsonify(result)

@app.route("/posts", methods=["GET"])
def get_posts():
    from models.post import Post
    from models.user import User
    from models.community import Community

    # Query all posts and join related user + community
    posts = Post.query.all()

    # Format the posts to include author and community names
    post_list = []
    for post in posts:
        post_list.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "author": post.author.username,        # thanks to backref
            "community": post.community.name,       # thanks to backref
            "created_at": post.created_at.strftime("%Y-%m-%d %H:%M:%S"),  # if using datetime
            "tags": [{"label": tag.label, "type": tag.type} for tag in post.tags],
            "votes": post.votes,  # optional if you're implementing voting
        })

    return jsonify(post_list)

@app.route("/me/posts", methods=["GET"])
@jwt_required()
def get_user_posts():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    user_posts = [
        {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "created_at": post.created_at.isoformat(),
            "votes": post.votes,
            "community": post.community.name if post.community else None,
            "author": post.author.username,
            "tags": [
                {
                    "id": tag.id,
                    "label": tag.label,
                    "type": tag.type
                }
                for tag in post.tags
            ] if post.tags else []
        }
        for post in user.posts
    ]

    return jsonify(user_posts), 200

@app.route("/me/university", methods=["GET"])
@jwt_required()
def get_university():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    if not user:
        return jsonify({ "message": "User not found" }), 404

    uni = University.query.get(user.university_id)
    if not uni:
        return jsonify({ "message": "University not found" }), 404


    return jsonify({ 
        "university_id": user.university_id,
        "university_name": uni.name
     }), 200

#add new community
@app.route("/communities", methods=["POST"])
@jwt_required()
def create_community():
    from models.community import Community

    data = request.get_json()
    name = data.get("name")

    if not name or name.strip() == "":
        return jsonify({"message": "Community name cannot be empty"}), 400

    if len(name) > 50:
        return jsonify({"message": "Community name too long"}), 400

    # Get current user from JWT
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    # Check if a community with the same name exists in the same university
    if Community.query.filter_by(name=name, university=user.university).first():
        return jsonify({"message": "Community already exists in your university"}), 400

    if not user:
        return jsonify({"message": "User not found"}), 404

    new_community = Community(name=name, university_id=user.university_id)
    db.session.add(new_community)
    db.session.commit()

    return jsonify({"message": f"Community '{name}' created."}), 201

#get a list of communities
@app.route("/communities", methods=["GET"])
@jwt_required()
def list_communities():
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    communities = Community.query.filter_by(university_id=user.university_id)
    result = [{"id": c.id, "name": c.name} for c in communities]

    return jsonify(result)

#get user's joined communities
@app.route("/me/communities", methods=["GET"])
@jwt_required()
def get_joined_communities():
    user_email = get_jwt_identity()

    if not user_email:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(email=user_email).first()
    if not user:
        print("No user found with email from token")
        return jsonify({"message": "User not found"}), 404

    joined_ids = [c.id for c in user.joined_communities]
    return jsonify(joined_ids), 200

#join a community
@app.route("/communities/<int:community_id>/join", methods=["POST"])
@jwt_required()
def join_community(community_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    community = Community.query.get(community_id)

    if not community:
        return jsonify({"message": "Community not found"}), 404

    if community in user.joined_communities:
        return jsonify({"message": "Already joined"}), 200

    user.joined_communities.append(community)
    db.session.commit()

    return jsonify({"message": f"Joined {community.name}!"}), 200

#leave a community
@app.route("/communities/<int:community_id>/leave", methods=["POST"])
@jwt_required()
def leave_community(community_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    community = Community.query.get(community_id)

    if not community:
        return jsonify({"message": "Community not found"}), 404

    if community not in user.joined_communities:
        return jsonify({"message": "Not a member"}), 400

    user.joined_communities.remove(community)
    db.session.commit()

    return jsonify({"message": f"Left {community.name}."}), 200

#create a new post
@app.route("/posts", methods=["POST"])
@jwt_required()
def create_post():
    data = request.get_json()

    title = data.get("title")
    content = data.get("content")
    class_tag = data.get("class_tag")
    professor_tag = data.get("professor_tag")
    community_id = data.get("community_id")

    if not all([title, content, community_id]):
        return jsonify({"message": "Missing required fields"}), 400

    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    post = Post(
        title=title,
        content=content,
        user_id=user.id,
        community_id=community_id
    )

    # Add tags
    # Add class tag (reuse if exists)
    if class_tag:
        tag = Tag.query.filter_by(label=class_tag, type="class").first()
        if not tag:
            tag = Tag(label=class_tag, type="class")
        post.tags.append(tag)

    # Add professor tag (reuse if exists)
    if professor_tag:
        tag = Tag.query.filter_by(label=professor_tag, type="professor").first()
        if not tag:
            tag = Tag(label=professor_tag, type="professor")
        post.tags.append(tag)

    db.session.add(post)
    db.session.commit()

    return jsonify({"message": "Post created successfully", "post_id": post.id}), 201

#edit a post
@app.route("/posts/<int:post_id>", methods=["PUT"])
@jwt_required()
def edit_post(post_id):
    data = request.get_json()
    post = Post.query.get(post_id)

    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    if not post or post.user_id != user.id:
        return jsonify({"message": "Not allowed"}), 403

    post.title = data.get("title", post.title)
    post.content = data.get("content", post.content)
    db.session.commit()

    return jsonify({"message": "Post updated"}), 200

#delete a post
@app.route("/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    post = Post.query.get(post_id)
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    if not post or post.user_id != user.id:
        return jsonify({"message": "Not allowed"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200

#create comment
@app.route("/posts/<int:post_id>/comments", methods=["POST"])
@jwt_required()
def create_comment(post_id):
    data = request.get_json()
    text = data.get("text")
    parent_id = data.get("parent_id")

    if not text or text.strip() == "":
        return jsonify({"message": "Comment text required"}), 400

    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()

    comment = Comment(text=text, post_id=post_id, user_id=user.id, parent_id=parent_id)
    db.session.add(comment)
    db.session.commit()

    return jsonify({"message": "Comment added!"}), 201

@app.route("/me/comments", methods=["GET"])
@jwt_required()
def get_user_comments():
    user_email = get_jwt_identity()

    if not user_email:
        return jsonify({"message": "Invalid token"}), 401

    user = User.query.filter_by(email=user_email).first()
    if not user:
        print("No user found with email from token")
        return jsonify({"message": "User not found"}), 404

    user_comments = [
        {
            "id": comment.id,
            "text": comment.text,
            "created_at": comment.created_at,
            "user_id": comment.user_id,
            "post_id": comment.post_id,
            "post_title": comment.post.title if comment.post else None,
            "post_community": comment.post.community.name
        }
        for comment in user.comments
    ]

    return jsonify(user_comments), 200


@app.route("/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).all()

    def serialize(comment):
        return {
            "id": comment.id,
            "text": comment.text,
            "author": comment.commenter.username,
            "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M"),
            "parent_id": comment.parent_id,
            "replies": [
                {
                    "id": reply.id,
                    "text": reply.text,
                    "author": reply.commenter.username,
                    "created_at": reply.created_at.strftime("%Y-%m-%d %H:%M"),
                    "parent_id": reply.parent_id
                }
                for reply in comment.replies
            ] if comment.parent_id is None else []  # only nest replies one level
        }

    top_level = [c for c in comments if c.parent_id is None]
    return jsonify([serialize(c) for c in top_level])


@app.route("/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(comment_id):
    user_email = get_jwt_identity()
    user = User.query.filter_by(email=user_email).first()
    comment = Comment.query.get(comment_id)

    if not comment:
        return jsonify({"message": "Comment not found"}), 404
    if comment.user_id != user.id:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Comment deleted"}), 200

from models import User, Community, Post, Comment, Tag

if __name__ == "__main__":
    with app.app_context():
        #db.drop_all()
        db.create_all()
    # Start the Flask development server
    app.run(debug=True)
