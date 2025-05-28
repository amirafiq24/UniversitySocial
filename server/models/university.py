from extensions import db

class University(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)

    users = db.relationship('User', backref='university', lazy=True)
    communities = db.relationship('Community', backref='university', lazy=True)
