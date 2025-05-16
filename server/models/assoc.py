# models/association_tables.py
from extensions import db

user_community = db.Table('user_community',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('community_id', db.Integer, db.ForeignKey('community.id'))
)
