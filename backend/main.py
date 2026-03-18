from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import prediction, resume, roadmap, interview, projects, mentor, profile
from database import engine
from models import Base

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PlacementIQ Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://placementiq-khd0.onrender.com",
        "https://placementiq.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction.router, prefix="/api/prediction", tags=["Prediction"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["Roadmap"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["Mentor"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])

@app.get("/")
def health_check():
    return {"status": "ok", "message": "PlacementIQ API is running"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
