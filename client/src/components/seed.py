from extensions import db
from models.university import University
from models.community import Community

universities = [
    "Harvard University", "Stanford University", "Massachusetts Institute of Technology",
    "University of California, Berkeley", "University of California, Los Angeles",
    "Yale University", "Princeton University", "Columbia University",
    "University of Chicago", "University of Pennsylvania",
    "California Institute of Technology", "Cornell University",
    "University of Michigan", "Duke University", "Northwestern University",
    "Johns Hopkins University", "Brown University", "University of Southern California",
    "University of California, San Diego", "University of California, Davis",
    "University of North Carolina at Chapel Hill", "New York University",
    "University of Wisconsin–Madison", "University of Washington",
    "University of Texas at Austin", "Georgia Institute of Technology",
    "Carnegie Mellon University", "University of Florida", "Boston University",
    "University of Illinois Urbana-Champaign", "University of Maryland",
    "University of Virginia", "University of California, Irvine",
    "Purdue University", "Ohio State University", "Pennsylvania State University",
    "University of Minnesota", "Michigan State University", "University of Arizona",
    "University of Colorado Boulder", "University of Pittsburgh", "Indiana University Bloomington",
    "University of Georgia", "Texas A&M University", "University of California, Santa Barbara",
    "Rutgers University", "University of Connecticut", "University of Miami",
    "University of Iowa", "University of Delaware", "University of Kansas",
    "University of Missouri", "University of Nebraska–Lincoln", "University of Tennessee",
    "University of Kentucky", "University of Oklahoma", "University of Oregon",
    "University of Alabama", "University of Massachusetts Amherst", "University of South Carolina",
    "University of Mississippi", "University of Arkansas", "University of Nevada, Reno",
    "University of Houston", "University of New Mexico", "University of Central Florida",
    "University of Louisville", "University at Buffalo (SUNY)", "Stony Brook University",
    "Binghamton University", "Arizona State University", "Temple University",
    "George Washington University", "American University", "Northeastern University",
    "Syracuse University", "Rensselaer Polytechnic Institute", "Tufts University",
    "Villanova University", "Wake Forest University", "Lehigh University",
    "Case Western Reserve University", "Brandeis University", "Fordham University",
    "Pepperdine University", "Santa Clara University", "Loyola Marymount University",
    "University of San Diego", "University of Denver", "Creighton University",
    "Gonzaga University", "DePaul University", "Marquette University",
    "Clark University", "Illinois Institute of Technology", "University of Vermont",
    "Clarkson University", "Baylor University", "Texas Tech University"
]

majors = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Chemical Engineering", "Biomedical Engineering",
    "Software Engineering", "Information Technology", "Data Science",
    "Cybersecurity", "Artificial Intelligence", "Robotics", "Physics",
    "Mathematics", "Statistics", "Chemistry", "Biology", "Environmental Science",
    "Geology", "Astronomy", "Economics", "Finance", "Accounting", "Business Administration",
    "Marketing", "Entrepreneurship", "Management", "Supply Chain Management",
    "Political Science", "International Relations", "Psychology", "Sociology",
    "Philosophy", "History", "Anthropology", "English", "Linguistics",
    "Education", "Journalism", "Communications", "Public Health", "Nursing",
    "Pre-Medicine", "Pre-Law", "Law", "Criminal Justice", "Social Work",
    "Architecture", "Urban Planning", "Graphic Design", "Film and Media Studies",
    "Music", "Theatre Arts", "Art History", "Religious Studies", "Agricultural Science"
]

# Step 1: Add universities
db.session.add_all([University(name=name) for name in universities])
db.session.commit()

# Step 2: Fetch all universities from DB
all_universities = University.query.all()

# Step 3: Create communities for each university
all_communities = []

for uni in all_universities:
    for major in majors:
        all_communities.append(Community(name=major, university_id=uni.id))

# Step 4: Add and commit all communities
db.session.add_all(all_communities)
db.session.commit()