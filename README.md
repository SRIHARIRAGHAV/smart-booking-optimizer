# Smart Booking Optimizer (Roamly)

Autonomous Multi-Agent Travel Planning, Budget Optimization & Direct Booking Engine.

---

## 🌟 Project Overview

**Smart Booking Optimizer** is a fully functional multi-agent travel planning platform that takes natural language requests or structured requirements, optimizes flight and accommodation combinations within budget constraints, and provides both:
1. **Agent-Free Direct Site Booking (0% Markup)**: Direct, pre-filled deep links to official airline reservation portals (IndiGo, Air India, Akasa Air, SpiceJet) and hotel engines (Booking.com, Agoda, Google Hotels).
2. **Autonomous In-Platform Payment & Ticket Issuance**: An integrated checkout supporting Credit/Debit Cards, UPI (with QR code), Net Banking, and Instant Sandbox checkout that executes ticket bookings, issues authentic Airline PNRs, E-Ticket numbers, seat allocations, and hotel vouchers.

---

## 🤖 Architecture & The 6 Autonomous Agents

```
User Request (Natural Language or Form)
  │
  ▼
[Agent 1: Request Planner] ──── (Missing info?) ────► [Clarification Loop]
  │
  ▼
[Agent 2: Flight Searcher] ◄───┐
  │                           │
  ▼                           │ (Targeted Recovery Loop)
[Agent 3: Hotel Searcher]     │
  │                           │
  ▼                           │
[Agent 4: Budget Optimizer] ──┘ (Constraint or Budget Violation)
  │ (Feasible Found)
  ▼
[Agent 5: Booking Verifier] ─── (Arithmetic or Stale Data) ──► [Reject & Recover]
  │ (Verified 100%)
  ▼
[Recommended Itinerary & Official Site Direct Links]
  │
  ▼ (User Checkout & Payment)
[Agent 6: Booking & Payment Execution Agent]
  │
  ├─► Generates Airline PNR & E-Ticket Number
  ├─► Allocates Passenger Seats & Terminal Gate
  ├─► Issues Hotel Reservation Confirmation Code & Check-in Voucher
  └─► Emits Official Payment Tax Invoice & Stores in SQLite
```

### The Agent Roster

1. **Agent 1: Request Planner**: Deterministically extracts origin, destination, travel dates, passenger counts, hotel rooms, and budget ceilings from natural language, or requests clarification if key fields are missing.
2. **Agent 2: Flight Searcher**: Queries flight inventory with deterministic pricing, stop counts, and seat availability.
3. **Agent 3: Hotel Searcher**: Discovers city centre accommodations, room counts, nightly rates, and calculates mandatory 12% GST/taxes.
4. **Agent 4: Budget Optimizer**: Exhaustively evaluates candidate combinations, strictly respects non-negotiable budget caps, scores user preferences, and formulates targeted recovery search strategies if candidates are infeasible.
5. **Agent 5: Booking Verifier**: Independently recalculates arithmetic (zero tolerance for discrepancy), inspects data freshness and provenance, and prevents unverified proposals from progressing.
6. **Agent 6: Booking & Payment Execution Agent**: Authorizes secure payment transactions, confirms bookings with carriers and accommodations, issues PNRs, E-Tickets, and vouchers, and records trace events into SQLite.

---

## 💳 Payment & Booking Options

### 1. Agent-Free Direct Booking (0% Extra Fee)
For travelers who prefer booking directly on the carrier/hotel websites to avoid intermediary commissions:
- **Airline Portals**: Direct deep links to IndiGo (`goindigo.in`), Air India (`airindia.com`), Akasa Air (`akasaair.com`), and Google Flights.
- **Hotel Portals**: Direct deep links to Booking.com, Agoda, MakeMyTrip, and Google Hotels with prefilled check-in, check-out, and guest counts.

### 2. In-Platform Instant Ticket Booking
- **Payment Methods Supported**:
  - `INSTANT_SANDBOX`: 1-Click developer sandbox for immediate testing.
  - `CARD`: Credit & Debit Cards (Visa, MasterCard, RuPay, Amex) with live cardholder and expiry validation.
  - `UPI`: Google Pay, PhonePe, Paytm, BHIM with interactive VPA handle and QR code generator.
  - `NET_BANKING`: Major Indian banking institutions (HDFC, SBI, ICICI, Axis, Kotak).
- **Issuance**:
  - Official Airline PNR (e.g. `6E-W8X9K2`) and E-Ticket number (`ETKT-098-XXXX`).
  - Allocated seats (e.g. `14A, 14B`).
  - Hotel Confirmation Code (e.g. `HTL-CONF-88219`) and Room Voucher.
  - Printable / Save-as-PDF digital ticket and tax receipt.

---

## 🚀 Running the Project

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm

### 1. Run the Backend API
```powershell
# Navigate to backend directory
cd backend

# (Optional) Activate virtual environment or install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Run the Frontend UI
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies (if not already installed)
npm install

# Start Vite dev server on port 3000
npm run dev
```
Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Automated Tests

All test suites verify planning, recovery loops, arithmetic verification, site booking links, payment processing, and ticket issuance:

```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests
```

**Test Coverage**:
- `test_api.py`: FastAPI endpoints, health check, trip planning, clarification, and approval.
- `test_booking_payment.py`: Site link generation, payment gateway processing (Card, UPI, Sandbox), ticket & PNR issuance, and DB persistence.
- `test_e2e_scenarios.py`: Feasible first attempt, budget recovery loops, infeasible bounds, verifier rejection, retry exhaustion, and demo mode.
- `test_tools.py`: Deterministic flight tools, hotel tools, constraint evaluation, and preference scoring.
- `test_workflow.py`: LangGraph state machine execution and routing.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and registered agents roster |
| `POST` | `/api/trips/plan` | Plan trip from natural language or structured input |
| `GET` | `/api/trips/{trip_id}` | Retrieve trip status, itinerary, and booking details |
| `GET` | `/api/trips/{trip_id}/trace` | Retrieve execution trace of all participating agents |
| `POST` | `/api/trips/{trip_id}/clarification` | Submit answers to missing requirements |
| `POST` | `/api/trips/{trip_id}/approval` | Record user approval status |
| `POST` | `/api/trips/{trip_id}/pay-and-book` | Process payment and issue flight PNR & hotel vouchers |
| `GET` | `/api/trips/{trip_id}/booking` | Retrieve confirmed digital ticket, PNR, and tax receipt |
| `GET` | `/api/trips/{trip_id}/options` | Query available flights and accommodations with direct site links and logos |
| `POST` | `/api/trips/{trip_id}/customize` | Choose another accommodation or flight; recalculates costs and verifies budget |

