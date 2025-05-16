from extensions import db
from datetime import datetime


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    votes = db.Column(db.Integer, default=0)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    community_id = db.Column(db.Integer, db.ForeignKey('community.id'), nullable=False)

    comments = db.relationship('Comment', backref='post', lazy=True)
    tags = db.relationship(
        'Tag',
        backref='post',
        cascade="all, delete-orphan",  # ✅ this is the key
        passive_deletes=True,
        lazy=True
    )
