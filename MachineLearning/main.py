from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd
import calendar
from datetime import datetime

# Function to get number of days in next month
def get_days_in_next_month():
    today = datetime.today()
    year = today.year
    next_month = today.month + 1
    if next_month > 12:
        next_month = 1
        year += 1
    return calendar.monthrange(year, next_month)[1]

# Load model and encoder
with open("models/rain_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("models/state_encoder.pkl", "rb") as f:
    le = pickle.load(f)

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class PredictionInput(BaseModel):
    state: str

@app.post("/predict")
def predict(input: PredictionInput):
    # Auto calculate next month
    next_month = datetime.today().month + 1
    if next_month > 12:
        next_month = 1

    # Encode state safely
    try:
        state_code = le.transform([input.state])[0]
    except ValueError:
        return {"error": f"State '{input.state}' not recognized by the model."}

    # Build features
    X_new = pd.DataFrame({
        "state_code": [state_code],
        "month_number": [next_month]
    })

    # Predict rainy days
    prediction = round(model.predict(X_new)[0])

    # Get days in next month
    days_next_month = get_days_in_next_month()

    return {
        "state": input.state,
        "next_month": int(next_month),
        "days_in_next_month": int(days_next_month),
        "predicted_rainy_days": prediction
    }
