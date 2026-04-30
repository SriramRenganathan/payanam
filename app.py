"""
Payanam - Mini Ride Booking App
Backend: Flask API Server

This file handles all the server-side logic for the Payanam app.
It has two main API endpoints:
  1. /calculate-fare  → Calculates ride cost based on distance
  2. /book-ride       → Confirms a ride and returns a dummy driver
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import math

# Create the Flask app
app = Flask(__name__)

# Allow frontend (running on a different port) to talk to this backend
CORS(app)

# ─── Fare Configuration ───────────────────────────────────────────────────────
BASE_FARE = 30          # Minimum charge for any ride (in ₹)
COST_PER_KM = 12        # How much each km costs (in ₹)
SURGE_MULTIPLIER = 1.0  # Can be increased during busy hours (1.0 = no surge)

# ─── Dummy Driver Database ────────────────────────────────────────────────────
# These are fake driver details shown after booking
DRIVERS = [
    {
        "id": "D001",
        "name": "Rajan Kumar",
        "rating": 4.8,
        "vehicle": "Honda Activa",
        "plate": "TN 09 AB 1234",
        "phone": "+91 98765 43210",
        "eta_minutes": 4,
        "photo_initial": "R"
    },
    {
        "id": "D002",
        "name": "Murugan S",
        "rating": 4.6,
        "vehicle": "TVS Jupiter",
        "plate": "TN 07 CD 5678",
        "phone": "+91 87654 32109",
        "eta_minutes": 7,
        "photo_initial": "M"
    },
    {
        "id": "D003",
        "name": "Selvam P",
        "rating": 4.9,
        "vehicle": "Bajaj Pulsar",
        "plate": "TN 11 EF 9012",
        "phone": "+91 76543 21098",
        "eta_minutes": 3,
        "photo_initial": "S"
    },
    {
        "id": "D004",
        "name": "Karthik R",
        "rating": 4.7,
        "vehicle": "Hero Splendor",
        "plate": "TN 22 GH 3456",
        "phone": "+91 65432 10987",
        "eta_minutes": 6,
        "photo_initial": "K"
    },
]

# ─── Helper Functions ─────────────────────────────────────────────────────────

def estimate_distance(pickup: str, drop: str) -> float:
    """
    Simulates a distance between two locations.
    
    In a real app, you'd use Google Maps API or similar.
    Here we use a simple hash-based trick to always return
    the same distance for the same pickup+drop pair.
    
    Returns distance in kilometers (between 2 and 25 km).
    """
    # Combine the two locations into one string, make it lowercase
    combined = (pickup + drop).lower().replace(" ", "")
    
    # Use Python's built-in hash to get a consistent number
    hash_value = abs(hash(combined))
    
    # Convert hash to a distance between 2 and 25 km
    distance = 2 + (hash_value % 230) / 10  # gives 2.0 to 25.0
    
    return round(distance, 1)

def calculate_fare_amount(distance_km: float) -> dict:
    """
    Calculates the fare breakdown for a given distance.
    
    Formula: Total = (Base Fare + Distance × Cost per km) × Surge
    
    Returns a dictionary with fare details.
    """
    distance_charge = distance_km * COST_PER_KM
    subtotal = BASE_FARE + distance_charge
    total = math.ceil(subtotal * SURGE_MULTIPLIER)  # Round up to nearest rupee
    
    return {
        "base_fare": BASE_FARE,
        "distance_charge": round(distance_charge, 2),
        "surge_multiplier": SURGE_MULTIPLIER,
        "total_fare": total
    }

# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    """Simple health check endpoint to confirm server is running."""
    return jsonify({
        "message": "🛺 Payanam API is running!",
        "version": "1.0",
        "endpoints": ["/calculate-fare", "/book-ride"]
    })


@app.route("/calculate-fare", methods=["POST"])
def calculate_fare():
    """
    POST /calculate-fare
    
    Accepts JSON body: { "pickup": "...", "drop": "..." }
    Returns fare estimate and distance.
    
    Example response:
    {
        "success": true,
        "pickup": "Chennai Central",
        "drop": "T. Nagar",
        "distance_km": 6.5,
        "fare": {
            "base_fare": 30,
            "distance_charge": 78.0,
            "surge_multiplier": 1.0,
            "total_fare": 108
        },
        "estimated_time_minutes": 18
    }
    """
    # Get the JSON data sent from the frontend
    data = request.get_json()
    
    # Validate that both pickup and drop are provided
    if not data or not data.get("pickup") or not data.get("drop"):
        return jsonify({
            "success": False,
            "error": "Please provide both pickup and drop locations."
        }), 400  # 400 = Bad Request
    
    pickup = data["pickup"].strip()
    drop = data["drop"].strip()
    
    # Make sure pickup and drop are not the same place
    if pickup.lower() == drop.lower():
        return jsonify({
            "success": False,
            "error": "Pickup and drop locations cannot be the same."
        }), 400
    
    # Calculate distance and fare
    distance = estimate_distance(pickup, drop)
    fare_details = calculate_fare_amount(distance)
    
    # Estimate travel time: roughly 3 minutes per km in city traffic
    estimated_time = math.ceil(distance * 3)
    
    return jsonify({
        "success": True,
        "pickup": pickup,
        "drop": drop,
        "distance_km": distance,
        "fare": fare_details,
        "estimated_time_minutes": estimated_time
    })


@app.route("/book-ride", methods=["POST"])
def book_ride():
    """
    POST /book-ride
    
    Accepts JSON body: { "pickup": "...", "drop": "...", "fare": 108 }
    Returns booking confirmation with a random driver assigned.
    
    Example response:
    {
        "success": true,
        "booking_id": "PAY-7382",
        "status": "confirmed",
        "driver": { ... },
        "pickup": "...",
        "drop": "...",
        "fare": 108
    }
    """
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get("pickup") or not data.get("drop"):
        return jsonify({
            "success": False,
            "error": "Booking details are incomplete."
        }), 400
    
    # Pick a random driver from our list
    assigned_driver = random.choice(DRIVERS)
    
    # Generate a random booking ID like "PAY-4829"
    booking_id = f"PAY-{random.randint(1000, 9999)}"
    
    return jsonify({
        "success": True,
        "booking_id": booking_id,
        "status": "confirmed",
        "driver": assigned_driver,
        "pickup": data["pickup"],
        "drop": data["drop"],
        "fare": data.get("fare", 0),
        "distance_km": data.get("distance_km", 0),
        "estimated_time_minutes": data.get("estimated_time_minutes", 10),
        "message": "Your ride has been booked! Driver is on the way."
    })


# ─── Run the Server ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🛺 Starting Payanam Backend Server...")
    print("📍 Running at: http://localhost:5000")
    print("🔗 Endpoints: /calculate-fare  |  /book-ride")
    # debug=True means the server restarts automatically when you save changes
    app.run(debug=True, port=5001)
