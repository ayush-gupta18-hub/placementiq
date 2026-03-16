from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

class ChatMessage(BaseModel):
    role: str
    text: str
    
class MentorConversation(BaseModel):
    messages: list[ChatMessage]

@router.post("/chat")
async def mentor_chat(convo: MentorConversation):
    if not model:
        return {"response": "Mock Mode: To crack Atlassian, focus heavily on LLD/HLD and ensure you have strong fundamentals in Distributed Systems."}
    
    history = "\n".join([f"{msg.role}: {msg.text}" for msg in convo.messages])
    
    prompt = f"""
    You are an elite Career Mentor helping software engineering students crack Top Tier companies (Google, Amazon, Atlassian, etc).
    Be extremely concise, structured, and actionable. Use bullet points when requested.
    
    Here is the conversation so far:
    {history}
    
    Mentor: 
    """
    
    try:
        response = model.generate_content(prompt)
        return {"response": response.text.strip()}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "Quota exceeded" in error_msg:
            return {"response": "Sorry, I've hit my Google API free-tier rate limit for the minute! Please take a short breather and try again in about 60 seconds."}
        return {"response": "Error reaching AI: " + error_msg}
