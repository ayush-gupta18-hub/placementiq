from fastapi import FastAPI
import joblib
import os
from pydantic import BaseModel
import numpy as np

app = FastAPI()

# load model at startup
MODEL_PATH = os.path.join("models", "placement_model.pkl")
model = joblib.load(MODEL_PATH)

@app.get("/")
def read_root():
    return {"message": "Placement Predictor API is running"}



# request body schema
def preprocess_input(data: StudentInput):
    # normalize text
    gender = data.gender.capitalize()
    internships = data.internships.capitalize()
    training = data.training.capitalize()
    backlog = data.backlog.capitalize()
    innovative_project = data.innovative_project.capitalize()
    technical_course = data.technical_course.capitalize()
    stream = data.stream.strip()

    yes_no_map = {"Yes": 1, "No": 0}

    features = [
        data.tenth_marks,
        data.twelfth_marks,
        data.cgpa,
        yes_no_map[internships],
        yes_no_map[training],
        yes_no_map[backlog],
        yes_no_map[innovative_project],
        data.communication_level,
        yes_no_map[technical_course],
    ]

    # gender one-hot (2)
    features.extend([
        1 if gender == "Male" else 0,
        1 if gender == "Female" else 0
    ])

    # stream one-hot (4)
    streams = [
        "Computer Science and Engineering",
        "Information Technology",
        "Mechanical Engineering",
        "Production Engineering"
    ]

    for s in streams:
        features.append(1 if stream == s else 0)

    return features


@app.post("/predict")
def predict_placement(data: StudentInput):
    features = preprocess_input(data)
    prediction = model.predict([features])
    result = "Placed" if prediction[0] == 1 else "Not Placed"
    return {"prediction": result}

