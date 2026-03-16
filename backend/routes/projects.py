from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()
router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

class UserProfile(BaseModel):
    target_tier: str
    current_skills: list[str]
    interests: list[str]

@router.post("/recommend")
async def recommend_projects(profile: UserProfile):
    if not model:
        # Return mock data if API key not set
        return {
            "projects": [
                {
                    "title": "Mock Distributed URL Shortener",
                    "description": "A scalable URL shortener built with Redis, Node.js, and Cassandra.",
                    "difficulty": "Advanced",
                    "skills_gained": ["System Design", "Caching", "Distributed Systems"],
                    "why_it_helps": "Essential for Tier 1 interviews where system design rounds are critical."
                },
                {
                    "title": "Real-time Chat App",
                    "description": "WebSocket based real-time chat with message queues.",
                    "difficulty": "Intermediate",
                    "skills_gained": ["WebSockets", "Pub/Sub", "Concurrency"],
                    "why_it_helps": "Shows ability to handle real-time data streaming and active connections."
                }
            ]
        }
    
    prompt = f"""
    Suggest 3 highly impressive software engineering projects to help a student land a job at a {profile.target_tier} company.
    Their current skills: {', '.join(profile.current_skills)}.
    Their interests: {', '.join(profile.interests)}.
    
    Return exactly a JSON object with a 'projects' key containing an array of objects. 
    Each object must have these exact keys: 'title' (string), 'description' (string, max 2 sentences), 'difficulty' (string: Beginner/Intermediate/Advanced), 'skills_gained' (array of strings, max 4), 'why_it_helps' (string, max 1 sentence).
    Do not use markdown formatting like ```json.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
             return {"error": "API rate limit exceeded. Please wait a minute before generating projects.", "projects": []}
        return {"error": error_msg, "projects": []}
