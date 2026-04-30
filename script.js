/**
 * Payanam — Frontend JavaScript
 *
 * This file handles all user interactions:
 *  1. Getting fare estimate from the backend
 *  2. Booking the ride and showing driver details
 *  3. Simulating ride status progression
 *  4. Resetting the app for a new booking
 */

// ─── Configuration ─────────────────────────────────────────────────────────
// This is the address of our Flask backend.
// Change this if your backend runs on a different port.
const API_BASE = "http://localhost:5000";

// ─── App State ──────────────────────────────────────────────────────────────
// We store the current booking info here so we can pass it between screens
let currentBooking = {
  pickup: "",
  drop: "",
  fare: 0,
  distance_km: 0,
  estimated_time_minutes: 0,
};

// ─── Helper: Show a specific screen ─────────────────────────────────────────
/**
 * Hides all screens and shows only the requested one.
 * @param {string} screenId - The ID of the screen to show (e.g. "screen-booking")
 */
function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  // Show the target screen
  document.getElementById(screenId).classList.add("active");
  // Scroll to top so user always sees content from the top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Helper: Show an error message ──────────────────────────────────────────
/**
 * Displays an error message in the booking form.
 * @param {string} message - The error text to show
 */
function showError(message) {
  const errorEl = document.getElementById("error-msg");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
}

/**
 * Hides the error message.
 */
function hideError() {
  document.getElementById("error-msg").classList.add("hidden");
}

// ─── Step 1: Get Fare Estimate ───────────────────────────────────────────────
/**
 * Called when user clicks "Get Fare Estimate".
 * 
 * Flow:
 *  - Validates the form inputs
 *  - Calls /calculate-fare on the backend
 *  - Shows the fare preview section
 *  - Reveals the "Book Ride" button
 */
async function getFare() {
  hideError();

  // Read input values
  const pickup = document.getElementById("pickup").value.trim();
  const drop = document.getElementById("drop").value.trim();

  // Basic validation
  if (!pickup) {
    showError("⚠️ Please enter a pickup location.");
    document.getElementById("pickup").focus();
    return;
  }
  if (!drop) {
    showError("⚠️ Please enter a drop location.");
    document.getElementById("drop").focus();
    return;
  }
  if (pickup.toLowerCase() === drop.toLowerCase()) {
    showError("⚠️ Pickup and drop locations cannot be the same.");
    return;
  }

  // Disable the button and show loading state
  const btn = document.getElementById("btn-get-fare");
  btn.textContent = "Calculating...";
  btn.disabled = true;

  try {
    // Call the backend API
    const response = await fetch(`${API_BASE}/calculate-fare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickup, drop }),
    });

    const data = await response.json();

    if (!data.success) {
      showError(data.error || "Something went wrong. Please try again.");
      return;
    }

    // Store booking details in our app state
    currentBooking = {
      pickup: data.pickup,
      drop: data.drop,
      fare: data.fare.total_fare,
      distance_km: data.distance_km,
      estimated_time_minutes: data.estimated_time_minutes,
    };

    // Update the fare preview UI
    document.getElementById("preview-distance").textContent =
      `${data.distance_km} km`;
    document.getElementById("preview-time").textContent =
      `~${data.estimated_time_minutes} mins`;
    document.getElementById("preview-fare").textContent =
      `₹${data.fare.total_fare}`;

    // Show the fare preview and the Book Ride button
    document.getElementById("fare-preview").classList.remove("hidden");
    document.getElementById("btn-book").classList.remove("hidden");

  } catch (err) {
    // Network error — backend might not be running
    showError(
      "❌ Cannot connect to the server. Make sure the Flask backend is running on port 5000."
    );
    console.error("API Error:", err);
  } finally {
    // Always re-enable the button
    btn.textContent = "Get Fare Estimate";
    btn.disabled = false;
  }
}

// ─── Step 2: Book the Ride ───────────────────────────────────────────────────
/**
 * Called when user clicks "Book Ride".
 * 
 * Flow:
 *  - Calls /book-ride on the backend
 *  - Shows the loading screen for 3 seconds (simulates driver search)
 *  - Then shows the confirmed screen with driver details
 *  - Then simulates ride status progression
 */
async function bookRide() {
  // Show loading screen immediately for good UX
  showScreen("screen-loading");

  try {
    // Call the backend to book the ride
    const response = await fetch(`${API_BASE}/book-ride`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentBooking),
    });

    const data = await response.json();

    if (!data.success) {
      showScreen("screen-booking");
      showError(data.error || "Booking failed. Please try again.");
      return;
    }

    // Wait 3 seconds on loading screen (feels realistic)
    await delay(3000);

    // Populate the confirmed screen with real data from backend
    populateConfirmedScreen(data);

    // Show the confirmed screen
    showScreen("screen-confirmed");

    // Start simulating ride status after booking
    simulateRideStatus();

  } catch (err) {
    showScreen("screen-booking");
    showError("❌ Booking failed. Make sure the backend server is running.");
    console.error("Booking Error:", err);
  }
}

// ─── Helper: Populate confirmed screen ──────────────────────────────────────
/**
 * Fills in all the driver and ride details on the confirmed screen.
 * @param {object} data - The booking response from the backend
 */
function populateConfirmedScreen(data) {
  const { driver, booking_id, pickup, drop } = data;

  // Booking ID
  document.getElementById("booking-id").textContent = booking_id;

  // Driver details
  document.getElementById("driver-avatar").textContent = driver.photo_initial;
  document.getElementById("driver-name").textContent = driver.name;
  document.getElementById("driver-rating").textContent = driver.rating;
  document.getElementById("driver-vehicle").textContent = driver.vehicle;
  document.getElementById("driver-plate").textContent = driver.plate;

  // Ride details
  document.getElementById("confirm-pickup").textContent = pickup;
  document.getElementById("confirm-drop").textContent = drop;
  document.getElementById("confirm-eta").textContent =
    `${driver.eta_minutes} mins`;
  document.getElementById("confirm-fare").textContent =
    `₹${currentBooking.fare}`;

  // Reset timeline to initial "Booked" state
  setTimelineStep("booked");
}

// ─── Ride Status Simulation ──────────────────────────────────────────────────
/**
 * Simulates the ride progressing through 3 stages:
 *  Stage 1: "Booked"        → immediate
 *  Stage 2: "On the way"    → after 5 seconds
 *  Stage 3: "Completed"     → after 10 more seconds
 */
function simulateRideStatus() {
  // Stage 1: Already at "Booked" from the start

  // Stage 2: After 5 seconds, move to "On the way"
  setTimeout(() => {
    setTimelineStep("onway");
    document.getElementById("ride-status-text").textContent = "Driver is on the way";
  }, 5000);

  // Stage 3: After 15 more seconds, move to "Completed"
  setTimeout(() => {
    setTimelineStep("completed");
    document.getElementById("ride-status-text").textContent = "Ride Completed! 🎉";
    
    // Change status banner to a different color when completed
    const banner = document.querySelector(".status-banner");
    banner.style.background = "var(--saffron-pale)";
    banner.style.color = "var(--saffron)";
    document.querySelector(".status-dot").style.background = "var(--saffron)";
  }, 15000);
}

/**
 * Updates the visual timeline to highlight the current ride stage.
 * @param {string} stage - "booked", "onway", or "completed"
 */
function setTimelineStep(stage) {
  const steps = {
    booked: document.getElementById("tl-booked"),
    onway: document.getElementById("tl-onway"),
    completed: document.getElementById("tl-completed"),
  };
  const connectors = document.querySelectorAll(".timeline-connector");

  // Reset all steps
  Object.values(steps).forEach((s) => s.classList.remove("active", "done"));
  connectors.forEach((c) => c.classList.remove("done"));

  // Apply classes based on current stage
  if (stage === "booked") {
    steps.booked.classList.add("active");
  } else if (stage === "onway") {
    steps.booked.classList.add("done");
    steps.onway.classList.add("active");
    connectors[0].classList.add("done");
  } else if (stage === "completed") {
    steps.booked.classList.add("done");
    steps.onway.classList.add("done");
    steps.completed.classList.add("active");
    connectors[0].classList.add("done");
    connectors[1].classList.add("done");
  }
}

// ─── Reset the App ───────────────────────────────────────────────────────────
/**
 * Resets everything so the user can book another ride.
 */
function resetApp() {
  // Clear inputs
  document.getElementById("pickup").value = "";
  document.getElementById("drop").value = "";

  // Hide fare preview and book button
  document.getElementById("fare-preview").classList.add("hidden");
  document.getElementById("btn-book").classList.add("hidden");

  // Hide any errors
  hideError();

  // Reset stored booking data
  currentBooking = {
    pickup: "",
    drop: "",
    fare: 0,
    distance_km: 0,
    estimated_time_minutes: 0,
  };

  // Go back to booking screen
  showScreen("screen-booking");
}

// ─── Utility: Delay (Promise-based sleep) ────────────────────────────────────
/**
 * Pauses execution for a given number of milliseconds.
 * Used to simulate loading time.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Allow Enter key to trigger fare estimate ─────────────────────────────────
// This makes the form feel more natural — press Enter in any input to get fare
document.getElementById("pickup").addEventListener("keydown", (e) => {
  if (e.key === "Enter") getFare();
});

document.getElementById("drop").addEventListener("keydown", (e) => {
  if (e.key === "Enter") getFare();
});

// ─── Auto-clear error when user starts typing ─────────────────────────────────
document.getElementById("pickup").addEventListener("input", hideError);
document.getElementById("drop").addEventListener("input", hideError);
