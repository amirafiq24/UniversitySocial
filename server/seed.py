
from extensions import db
from models.university import University
from models.community import Community

more_majors = [
    "Game Design", "Actuarial Science", "Marine Biology", "Cognitive Science",
    "Astronautical Engineering", "Quantitative Economics", "Fashion Design",
    "Speech Pathology", "Digital Media", "Health Informatics", "Medicine", "Aerospace Engineering"
]

with app.app_context():
universities = University.query.all()
new_communities = []

for uni in universities:
    for major in more_majors:
        new_communities.append(Community(name=major, university_id=uni.id))

db.session.add_all(new_communities)
db.session.commit()
