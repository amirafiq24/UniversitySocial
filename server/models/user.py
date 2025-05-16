from flask_sqlalchemy import SQLAlchemy
from extensions import db
from models.assoc import user_community 

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='commenter', lazy=True)

    # All communities the user has joined
    joined_communities = db.relationship('Community', secondary=user_community, back_populates="members")
