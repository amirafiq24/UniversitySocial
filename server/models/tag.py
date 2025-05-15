from extensions import db

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(100), nullable=False)

    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
