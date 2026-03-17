from fastapi import APIRouter, UploadFile, File, HTTPException
import google.genai as genai
import PyPDF2
import os
from dotenv import load_dotenv
import json

load_dotenv()

router = APIRouter()

# Setup Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_gemini_api_key_here":
    client = genai.Client(api_key=api_key)
else:
    client = None

@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    text = ""
    try:
        reader = PyPDF2.PdfReader(file.file)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

    if not client:
        # Return mock data if API key not set
        return {
            "atsScore": 65,
            "weakSections": ["Projects", "Impact Metrics"],
            "missingKeywords": ["AWS", "System Design", "Docker"],
            "improvements": ["Mock mode: Add Gemini API key to .env for real analysis.", "Use action verbs"]
        }

    try:
        prompt = f"""
        Analyze the following resume text and provide exactly a JSON response with these keys: 
        atsScore (integer 0-100), weakSections (list of strings), missingKeywords (list of strings typical for SDE/Tech roles), improvements (list of actionable strings). 
        Only output the valid JSON without markdown wrapping.
        
        Resume Text: {text}
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        # Try to parse json
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        
        return json.loads(result_text)
    except Exception as e:
        return {
            "atsScore": 60,
            "weakSections": ["Parsing Error"],
            "missingKeywords": ["Error in Gemini"],
            "improvements": [str(e)]
        }
