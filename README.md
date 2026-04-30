# 🛺 Payanam — Mini Ride Booking App

> **ப யணம்** (*Payanam*) means **"Travel"** in Tamil.

A simple, beginner-friendly ride booking web app — like a mini Rapido — built with **HTML/CSS/JS** (frontend) and **Python Flask** (backend).

This is a portfolio project to demonstrate a basic full-stack web app with API integration.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📍 Ride Booking | Enter pickup & drop location to book a ride |
| 💰 Fare Estimate | Calculates fare based on distance + base charge |
| 🧑 Driver Details | Shows a simulated driver after booking |
| 📡 Ride Status | Animated timeline: Booked → On the way → Completed |
| 📱 Responsive | Works on mobile and desktop |

---

## 🗂️ Project Structure

```
payanam/
│
├── backend/
│   ├── app.py              # Flask API server
│   └── requirements.txt    # Python dependencies
│
└── frontend/
    ├── index.html          # Main HTML page
    ├── style.css           # All styles & animations
    └── script.js           # All JavaScript logic
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- A modern web browser

---

### Step 1 — Set up the Backend

Open your terminal and run:

```bash
# 1. Navigate to the backend folder
cd payanam/backend

# 2. (Recommended) Create a virtual environment
python -m venv venv

# 3. Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install required packages
pip install -r requirements.txt

# 5. Start the Flask server
python app.py
```

You should see:
```
🛺 Starting Payanam Backend Server...
📍 Running at: http://localhost:5000
```

---

### Step 2 — Open the Frontend

Open a **new terminal tab** and:

```bash
# Navigate to the frontend folder
cd payanam/frontend

# Simply open index.html in your browser
# Option A: Double-click index.html in File Explorer
# Option B: Use VS Code Live Server extension
# Option C: Use Python's built-in server:
python -m http.server 8080
# Then open http://localhost:8080 in your browser
```

---

## 🧠 How It Works

### Fare Calculation Logic

```
Total Fare = Base Fare (₹30) + Distance (km) × ₹12 per km
```

For example:
- 5 km ride → ₹30 + (5 × 12) = **₹90**
- 10 km ride → ₹30 + (10 × 12) = **₹150**

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/calculate-fare` | Returns fare estimate |
| `POST` | `/book-ride` | Confirms booking, returns driver |

**Example Request:**
```json
POST /calculate-fare
{
  "pickup": "Chennai Central",
  "drop": "T. Nagar"
}
```

**Example Response:**
```json
{
  "success": true,
  "distance_km": 6.5,
  "fare": {
    "base_fare": 30,
    "distance_charge": 78.0,
    "total_fare": 108
  },
  "estimated_time_minutes": 20
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3, Flask |
| Fonts | Google Fonts (Syne + Outfit) |
| API | REST JSON API |

---

## 📌 What's NOT Included (Intentionally Kept Simple)

- ❌ Real GPS or Maps API
- ❌ Real-time driver tracking
- ❌ User authentication/login
- ❌ Payment integration
- ❌ Database (uses in-memory dummy data)

This is a **portfolio/learning project**, not a production app.

---

## 🌱 Future Improvements

If you want to extend this project, here are ideas:

- [ ] Add a map using Leaflet.js (free, no API key needed)
- [ ] Save bookings to a SQLite database
- [ ] Add user login with Flask sessions
- [ ] Multiple ride types (bike, auto, car)
- [ ] Ride history page

---

## 👨‍💻 Author

Built as a beginner portfolio project.

**Payanam v1.0** · Made with ❤️ in Chennai
