from extensions import db

class Community(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    posts = db.relationship('Post', backref='community', lazy=True)
