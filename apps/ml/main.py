from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI(title="BorderRelief ML Service")

# --- Schemas ---

class PredictionRequest(BaseModel):
    text_description: str
    image_base64: Optional[str] = None

class FeedbackRequest(BaseModel):
    item_id: str
    actual_category: str
    correct: bool

class RouteRequest(BaseModel):
    locations: List[tuple]
    constraints: dict

# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/predict/category")
def predict_category(req: PredictionRequest):
    """
    Explainable AI classification for items.
    """
    desc = req.text_description.lower()
    
    # Rule-based (Explainable)
    if any(w in desc for w in ["water", "bottle", "drink"]):
        return {
            "category": "WATER",
            "confidence": 0.98,
            "explanation": "Detected keyword 'water' in description.",
            "risk_flag": False
        }
    if any(w in desc for w in ["pill", "drug", "medicine", "bandage"]):
         return {
            "category": "MEDS",
            "confidence": 0.92,
            "explanation": "Detected medical terminology.",
            "risk_flag": True,
            "risk_reason": "Medical items require expiry check."
        }

    # Fallback to Mock ML
    return {
        "category": "OTHER",
        "confidence": 0.45,
        "explanation": "No strong keywords found. Manual review recommended.",
        "risk_flag": False
    }

@app.post("/ml/feedback")
def log_feedback(req: FeedbackRequest):
    """
    Collect feedback for re-training.
    """
    # Log to file or DB
    print(f"Feedback Received: {req}")
    return {"status": "logged"}

@app.post("/optimize/route")
def optimize_route(req: RouteRequest):
    """
    VRP Solver Placeholder.
    """
    return {
        "route_id": "route-123",
        "waypoints_order": [0, 2, 1, 3],
        "total_distance_km": 45.2,
        "estimated_time_min": 120,
        "explanation": "Route optimized to avoid Sector 4 (Red Zone)."
    }
