from fastapi import APIRouter
from pydantic import BaseModel
import google.genai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()
router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)
else:
    client = None

class ProfileData(BaseModel):
    tier_target: str
    current_role: str
    dsa_skill: str
    weaknesses: list[str]
    total_solved: int = 0
    leetcode_stats: dict = {}
    codeforces_rating: int = 0
    resume_score: int = 0
    resume_weaknesses: list[str] = []
    duration_days: int = 90

@router.post("/generate")
async def generate_roadmap(profile: ProfileData):
    if not client:
        # Return mock
        return {
            "roadmap": [
                {
                    "week": "Weeks 1-3",
                    "title": "Data Structures & Algorithms Mastery",
                    "focus": "Graph Theory, Dynamic Programming",
                    "status": "current",
                    "tasks": [
                        {"id": 1, "title": "Solve 50 Graph problems", "done": False},
                        {"id": 2, "title": "Mock mode active. Add Gemini API key for real roadmap", "done": False}
                    ],
                    "resources": ["Neetcode 150"]
                }
            ]
        }
    
    # Calculate phases based on duration
    weeks_per_phase = max(2, profile.duration_days // (7 * 4))  # 4 phases
    phase_labels = []
    for i in range(4):
        start_week = i * weeks_per_phase + 1
        end_week = (i + 1) * weeks_per_phase
        phase_labels.append(f"Weeks {start_week}-{end_week}")
    
    # Advanced personalized prompt
    prompt = f"""
    Create a highly personalized {profile.duration_days}-day placement roadmap for a student.
    
    Target: {profile.tier_target}
    Role: {profile.current_role}
    Duration: {profile.duration_days} days
    
    Coding Profile:
    - Current DSA Skill Level: {profile.dsa_skill}
    - Total LeetCode Solved: {profile.total_solved}
    - LeetCode Distribution: {profile.leetcode_stats}
    - Codeforces Rating: {profile.codeforces_rating}
    - Self-identified Weaknesses: {', '.join(profile.weaknesses)}
    
    Resume Analysis:
    - ATS Score: {profile.resume_score}/100
    - Resume Weaknesses: {', '.join(profile.resume_weaknesses)}
    
    Requirements:
    1. Break the roadmap into exactly 4 phases with these labels: {phase_labels}.
    2. Scale the intensity and depth to fit the {profile.duration_days}-day duration.
       - For 30 days: focus only on core weaknesses and high-impact quick wins.
       - For 60 days: balanced DSA + projects.
       - For 90 days: comprehensive DSA, system design, and resume polish.
       - For 120 days: deep mastery, multiple projects, and mock interview preparation.
    3. Focus heavily on bridging the gaps identified in their weaknesses and resume.
    4. If they are aiming for Tier 1, include advanced topics like System Design and Hard DSA.
    5. If they have a low resume score, include a phase for project building and resume optimization.
    
    Return ONLY a JSON array of objects with keys: 
    - week (string, e.g., "{phase_labels[0]}")
    - title (string)
    - focus (string)
    - status (set to "upcoming", first one "current")
    - tasks (array of objects with id: number, title: string, done: false)
    - resources (array of strings)
    
    Do not use markdown wrapping or any other text. Return pure JSON.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        
        # Sometimes Gemini adds extra words, try to find the actual JSON bracket
        start_idx = text.find('[')
        end_idx = text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            text = text[start_idx:end_idx+1]
            
        data = json.loads(text)
        return {"roadmap": data}
    except Exception as e:
        print(f"Roadmap Gemini Error: {e}")
        return {"error": str(e)}
