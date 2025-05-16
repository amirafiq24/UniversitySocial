from extensions import db
from datetime import datetime

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)  # For replies
    replies = db.relationship(
        'Comment',
        backref=db.backref('parent', remote_side=[id]),
        cascade="all, delete-orphan",   # ✅ this deletes replies when parent is deleted
        lazy=True
    )

