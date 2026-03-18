from fastapi import APIRouter
from pydantic import BaseModel
import joblib
import pickle
import os
import pandas as pd

router = APIRouter()

_routes_dir  = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_routes_dir)


MODEL_PATH = os.path.join(_backend_dir, "models", "placement_model.pkl")
SCALER_PATH = os.path.join(_backend_dir, "models", "placement_scaler.pkl")

print(f"[Predictor] Looking for model at: {MODEL_PATH}")

model = None
scaler = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print(f"[Predictor] ✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"[Predictor] ❌ Failed to load model: {e}")

if os.path.exists(SCALER_PATH):
    try:
        with open(SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)
        print(f"[Predictor] ✅ Scaler loaded successfully from {SCALER_PATH}")
    except Exception as e:
        print(f"[Predictor] ❌ Failed to load scaler: {e}")

class StudentInput(BaseModel):
    cgpa: float = 8.5
    dsa_problems_solved: int = 0
    leetcode_rating: int = 0
    codeforces_rating: int = 0
    projects: int = 0
    internships: int = 0
    hackathons: int = 0
    gender: str = "Male"
    branch: str = "CSE"

FEATURES = [
    "gender","dsa_problems_solved","leetcode_rating","codeforces_rating",
    "internships","hackathons","projects",
    "coding_score","experience_score","is_competitive","has_internship","dsa_level"
]

def preprocess_input(data: StudentInput):
    dsa_max, lc_max, cf_max = 500, 2800, 2500
    int_max, hack_max, proj_max = 3, 5, 7
    
    dsa_val = min(data.dsa_problems_solved, dsa_max)
    lc_val = min(data.leetcode_rating, lc_max)
    cf_val = min(data.codeforces_rating, cf_max)
    
    coding_score = round(
        (dsa_val / dsa_max) * 0.35 +
        (lc_val / lc_max) * 0.35 +
        (cf_val / cf_max) * 0.30, 4
    )
    
    experience_score = round(
        (min(data.internships, int_max) / max(int_max, 1)) * 0.50 +
        (min(data.hackathons, hack_max) / max(hack_max, 1)) * 0.25 +
        (min(data.projects, proj_max) / max(proj_max, 1)) * 0.25, 4
    )
    
    is_competitive = 1 if (data.leetcode_rating > 1500 or data.codeforces_rating > 1200) else 0
    has_internship = 1 if data.internships > 0 else 0
    
    if data.dsa_problems_solved <= 50:
        dsa_level = 0
    elif data.dsa_problems_solved <= 150:
        dsa_level = 1
    elif data.dsa_problems_solved <= 300:
        dsa_level = 2
    else:
        dsa_level = 3
        
    gender_val = 1 if data.gender.strip().capitalize() == "Male" else 0
        
    student_df = pd.DataFrame([{
        "gender": gender_val,
        "dsa_problems_solved": data.dsa_problems_solved,
        "leetcode_rating": data.leetcode_rating,
        "codeforces_rating": data.codeforces_rating,
        "internships": data.internships,
        "hackathons": data.hackathons,
        "projects": data.projects,
        "coding_score": coding_score,
        "experience_score": experience_score,
        "is_competitive": is_competitive,
        "has_internship": has_internship,
        "dsa_level": dsa_level
    }])
    
    return student_df[FEATURES]

@router.post("/predict")
def predict_placement(data: StudentInput):
    if not model:
        return {
            "prediction": "Placed", 
            "probability": 85,
            "tier": "Tier 1",
            "tier_probabilities": {"Tier 1": 85, "Tier 2": 95, "Tier 3": 99},
            "companies": ["Amazon", "Microsoft"],
            "company_fit": {"High Probability": ["Amazon"], "Medium Probability": ["Paypal"], "Low Probability": ["Google"]},
            "skill_gap": {"dsa": {"you": 350, "avg": 450}, "projects": {"you": 3, "avg": 4}},
            "score_breakdown": {
                "overall": 80, "dsa": 85, "projects": 75, "resume": 80, "interview": 80
            },
            "feedback": "Model failed to load, returning mock prediction.",
            "error": True
        }
    
    # --- ML Prediction ---
    try:
        features_df = preprocess_input(data)
        if scaler:
            features = scaler.transform(features_df)
        else:
            features = features_df
        proba = model.predict_proba(features)[0]
        placed_prob = float(round(proba[1] * 100, 2))
    except Exception as e:
        print(f"ML Prediction Error: {e}")
        # Fallback to a basic heuristic if ML fails
        placed_prob = 75.0 if data.cgpa > 7.5 else 40.0

    # --- Sanity Guards (Heuristics) ---
    if data.cgpa < 6.0:
        placed_prob = min(placed_prob, 35.0)  # Heavy penalty for low CGPA

    result = "Placed" if placed_prob > 50 else "Not Placed"
    
    tier = "Tier 1 (Product Based)" if placed_prob > 80 else "Tier 2" if placed_prob > 55 else "Tier 3"
    companies = ["Amazon", "Atlassian", "Google"] if placed_prob > 80 else ["TCS", "Infosys", "Wipro"] if placed_prob < 50 else ["Cognizant", "Accenture", "TCS"]
    
    if placed_prob > 80:
        feedback = "Excellent profile! Your metrics meet Tier 1 standards."
    elif placed_prob > 50:
        feedback = "Good profile, but try to improve your project depth and DSA solved count for Tier 1."
    else:
        feedback = "Risk detected. Low CGPA or backlogs are hindering your placement chances."

    # Generate heuristic AI scores based on inputs
    dsa_score = min(100, (data.dsa_problems_solved / 500) * 40 + (data.leetcode_rating / 2800) * 30 + (data.codeforces_rating / 2500) * 30)
    project_score = min(100, (data.projects / 5) * 100)
    resume_score = min(100, (data.internships * 20) + (data.hackathons * 10) + 50)
    interview_score = 80 # default
    
    # Calculate overall AI placement readiness
    overall_score = round((dsa_score + project_score + resume_score + interview_score) / 4)

    # Calculate Tier Probabilities
    tier_probs = {
        "Tier 1": round(placed_prob * 0.7),
        "Tier 2": min(100, round(placed_prob * 1.05)),
        "Tier 3": min(100, round(placed_prob * 1.2)) if placed_prob > 20 else 40
    }

    # Company Fit Predictor
    company_fit = {
        "High Probability": companies,
        "Medium Probability": ["Cognizant", "Capgemini", "Accenture"] if placed_prob > 50 else ["Tech Mahindra", "BPO"],
        "Low Probability": ["Netflix", "OpenAI", "Google"] if placed_prob < 85 else ["Hedge Funds"]
    }

    # Skill Gap Detector
    skill_gap = {
        "dsa": {
            "you": data.dsa_problems_solved,
            "avg": 450 if tier == "Tier 1 (Product Based)" else 280
        },
        "projects": {
            "you": data.projects,
            "avg": 4 if tier == "Tier 1 (Product Based)" else 2
        }
    }

    return {
        "prediction": result,
        "probability": placed_prob,
        "tier": tier,
        "tier_probabilities": tier_probs,
        "companies": companies,
        "company_fit": company_fit,
        "skill_gap": skill_gap,
        "score_breakdown": {
            "overall": overall_score,
            "dsa": round(dsa_score),
            "projects": round(project_score),
            "resume": round(resume_score),
            "interview": round(interview_score)
        },
        "feedback": feedback,
        "error": False
    }
