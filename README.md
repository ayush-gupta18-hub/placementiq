# 🚀 PlacementIQ

**An AI-Powered Placement Preparation & Prediction Platform**

PlacementIQ is a comprehensive platform designed to help students prepare for their dream jobs. It intelligently predicts placement chances using Machine Learning and offers AI-driven tools like resume analysis, personalized learning roadmaps, mock interviews, and project recommendations to boost your career prospects.

---

## Features

- **Placement Predictor**: An ML-based engine that evaluates your profile (skills, CGPA, tier, etc.) to predict your placement probability.
- **AI Resume Analyzer**: Upload your resume to get instant feedback and ATS-friendly optimization suggestions.
- **Personalized Roadmaps**: Generate custom, step-by-step learning paths for various roles (SDE, Data Science, etc.).
- **Mock Interviews**: Practice with AI-driven interview scenarios tailored to your target job role.
- **Smart Project Recommender**: Receive curated, unique project ideas based on your current skill level and interests.
- **Mentorship**: Connect with and discover mentors to guide you through your placement journey.
- **User Profiles**: A customized dashboard to track your coding progress and preparation streaks.

---

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & generic CSS, with a premium glassmorphic UI
- **Authentication**: [Clerk](https://clerk.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database**: SQLite (managed with SQLAlchemy)
- **Machine Learning**: Scikit-Learn, Pandas

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)



### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables. Create a `.env` file in the `backend/` directory and add your API keys (e.g., Gemini API key).
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   # The server will start at http://localhost:8000
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or yarn / pnpm install
   ```
3. Set up environment variables. Create a `.env.local` file in the `frontend/` directory and add your Clerk API keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   ```
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

##  Machine Learning Model
The ML component is trained on a custom dataset (`placement_dataset.csv`). You can find the model training logic in `train_pipeline.py`. If you want to retrain the model, simply run:
```bash
python train_pipeline.py
```
This will generate updated `.pkl` model files in the `models/` directory for the backend to use.

---

