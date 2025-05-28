from extensions import db
from models.assoc import user_community

class Community(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    university_id = db.Column(db.Integer, db.ForeignKey('university.id'), nullable=False)

    posts = db.relationship('Post', backref='community', lazy=True)

    members = db.relationship(
        'User',
        secondary=user_community,
        back_populates='joined_communities'
    )
