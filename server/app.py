from flask import Flask, jsonify, request
from flask_cors import CORS
from extensions import db, bcrypt, jwt
from models.user import User
from flask_jwt_extended import create_access_token
import os

app = Flask(__name__)
CORS(app)           # For hashing passwords
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///data.db"  # Use PostgreSQL later
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

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Extract fields from request
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # Check if the email is already in the database
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "Email already registered"}), 400

    # Hash the password using bcrypt for security
    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    # Create a new User object
    new_user = User(username=username, email=email, password=hashed_pw)

    # Add the user to the database
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"User {username} registered successfully!"}), 201


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
        "token": access_token
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
    result = [{"id": u.id, "username": u.username, "email": u.email} for u in users]
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
            "community": post.community.name       # thanks to backref
        })

    return jsonify(post_list)


from models import User, Community, Post, Comment, Tag

if __name__ == "__main__":
    # Create all tables before starting the server

    # Start the Flask development server
    app.run(debug=True)
