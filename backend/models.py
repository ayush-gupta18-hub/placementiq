from sqlalchemy import Column, Integer, String, Float
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    cgpa = Column(Float, nullable=True)
    branch = Column(String, nullable=True)
    leetcode_username = Column(String, nullable=True)
    codeforces_username = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
