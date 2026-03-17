from fastapi import APIRouter
from pydantic import BaseModel
import google.genai as genai
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)
else:
    client = None

class ChatMessage(BaseModel):
    role: str
    text: str
    
class Conversation(BaseModel):
    messages: list[ChatMessage]
    company: str = "General Tech Company"
    role: str = "Software Engineer"

@router.post("/chat")
async def interview_chat(convo: Conversation):
    if not client:
        return {"response": "Mock Mode: Nice approach! Can you optimize the space complexity?"}
    
    history = "\n".join([f"{msg.role}: {msg.text}" for msg in convo.messages])
    
    prompt = f"""
    You are a technical interviewer at {convo.company}. 
    You are giving a mock interview for the {convo.role} role.
    Keep your responses short, conversational, and direct, as if spoken in a real phone screen. 
    Never output markdown, just plain text suitable for text-to-speech.
    Here is the conversation so far:
    {history}
    
    Interviewer: 
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"response": response.text.strip()}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            return {"response": "Sorry, I've hit my Google API free-tier rate limit for the minute! Please take a short breather and try again in about 60 seconds."}
        return {"response": "Error reaching AI: " + error_msg}

@router.post("/evaluate")
async def evaluate_interview(convo: Conversation):
    if not client:
        return {
            "problemSolving": 8.0,
            "technicalClarity": 7.5,
            "communication": 8.5,
            "feedback": "Mock Mode: You communicated well. Needed slight hint on Dp."
        }
        
    history = "\n".join([f"{msg.role}: {msg.text}" for msg in convo.messages])
    
    prompt = f"""
    You are evaluating a candidate's performance in a mock technical interview for a {convo.role} role at {convo.company}.

    Here is the transcript of the interview:
    {history}
    
    Evaluate the candidate on a scale of 1.0 to 10.0 in three categories:
    1. Problem Solving (Ability to approach the technical challenge, logic, optimization)
    2. Technical Clarity (How clearly they explained their reasoning and technical concepts)
    3. Communication (Professionalism, listening, and articulation)
    
    Also, provide a short 2-3 sentence paragraph of constructive behavioral and technical feedback.
    
    Return EXACTLY AND ONLY valid JSON in this exact format, with no markdown formatting or backticks:
    {{
        "problemSolving": 8.5,
        "technicalClarity": 7.0,
        "communication": 8.0,
        "feedback": "Your written feedback here."
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        import json
        text_resp = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text_resp)
        return data
    except Exception as e:
        print("Evaluation Error:", e)
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            return {
                "problemSolving": 0.0,
                "technicalClarity": 0.0,
                "communication": 0.0,
                "feedback": "Evaluation failed: API rate limit exceeded. Please wait a minute before generating feedback."
            }
        return {
            "problemSolving": 0.0,
            "technicalClarity": 0.0,
            "communication": 0.0,
            "feedback": "Failed to generate evaluation due to an error: " + error_msg
        }
