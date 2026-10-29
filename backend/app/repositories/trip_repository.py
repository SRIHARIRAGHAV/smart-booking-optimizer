import os
import json
import sqlite3
from typing import Optional, Dict, Any, List
from app.tools.booking_links import build_site_booking_links

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "travel_planner.db")

class TripRepository:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trips (
                    session_id TEXT PRIMARY KEY,
                    created_at TEXT,
                    updated_at TEXT,
                    user_request TEXT,
                    status TEXT,
                    structured_requirements TEXT,
                    recommended_itinerary TEXT,
                    verification_report TEXT,
                    clarification_questions TEXT,
                    user_approval_status TEXT,
                    retry_count INTEGER DEFAULT 0,
                    execution_step_count INTEGER DEFAULT 0,
                    failure_explanation TEXT,
                    nearest_alternatives TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS execution_traces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    step_number INTEGER,
                    timestamp TEXT,
                    agent_name TEXT,
                    tool_invoked TEXT,
                    input_summary TEXT,
                    decision TEXT,
                    output_summary TEXT,
                    execution_type TEXT,
                    success INTEGER,
                    evidence_sources TEXT,
                    FOREIGN KEY(session_id) REFERENCES trips(session_id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bookings (
                    booking_id TEXT PRIMARY KEY,
                    session_id TEXT UNIQUE,
                    created_at TEXT,
                    passenger_names TEXT,
                    flight_pnr TEXT,
                    hotel_confirmation TEXT,
                    transaction_id TEXT,
                    booking_data TEXT,
                    FOREIGN KEY(session_id) REFERENCES trips(session_id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    transaction_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    amount REAL,
                    currency TEXT,
                    payment_method TEXT,
                    payment_status TEXT,
                    payment_timestamp TEXT,
                    receipt_data TEXT,
                    FOREIGN KEY(session_id) REFERENCES trips(session_id)
                )
            """)
            conn.commit()

    def save_trip_state(self, state: Dict[str, Any]):
        session_id = state.get("session_id")
        if not session_id:
            return

        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = state.get("updated_at") or state.get("created_at") or ""
            
            cursor.execute("""
                INSERT INTO trips (
                    session_id, created_at, updated_at, user_request, status,
                    structured_requirements, recommended_itinerary, verification_report,
                    clarification_questions, user_approval_status, retry_count,
                    execution_step_count, failure_explanation, nearest_alternatives
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    updated_at = excluded.updated_at,
                    status = excluded.status,
                    structured_requirements = excluded.structured_requirements,
                    recommended_itinerary = excluded.recommended_itinerary,
                    verification_report = excluded.verification_report,
                    clarification_questions = excluded.clarification_questions,
                    user_approval_status = excluded.user_approval_status,
                    retry_count = excluded.retry_count,
                    execution_step_count = excluded.execution_step_count,
                    failure_explanation = excluded.failure_explanation,
                    nearest_alternatives = excluded.nearest_alternatives
            """, (
                session_id,
                now,
                now,
                state.get("user_request", ""),
                state.get("final_status", "PLANNING"),
                json.dumps(state.get("structured_requirements")),
                json.dumps(state.get("current_itinerary")),
                json.dumps(state.get("verification_report")),
                json.dumps(state.get("clarification_questions", [])),
                state.get("user_approval_status", "PENDING"),
                state.get("retry_count", 0),
                state.get("execution_step_count", 0),
                state.get("failure_explanation"),
                json.dumps(state.get("nearest_alternatives", []))
            ))

            # Replace traces for clean idempotency
            cursor.execute("DELETE FROM execution_traces WHERE session_id = ?", (session_id,))
            traces = state.get("execution_trace", [])
            for t in traces:
                cursor.execute("""
                    INSERT INTO execution_traces (
                        session_id, step_number, timestamp, agent_name, tool_invoked,
                        input_summary, decision, output_summary, execution_type, success,
                        evidence_sources
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    t.get("step_number", 0),
                    t.get("timestamp", ""),
                    t.get("agent_name", ""),
                    t.get("tool_invoked"),
                    t.get("input_summary", ""),
                    t.get("decision", ""),
                    t.get("output_summary", ""),
                    t.get("execution_type", "DETERMINISTIC_TOOL"),
                    1 if t.get("success", True) else 0,
                    json.dumps(t.get("evidence_sources", []))
                ))

            conn.commit()

    def get_trip(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM trips WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            if not row:
                return None

            struct_reqs = json.loads(row["structured_requirements"]) if row["structured_requirements"] else None
            rec_itin = json.loads(row["recommended_itinerary"]) if row["recommended_itinerary"] else None

            # Ensure site_booking_links are populated
            if rec_itin and not rec_itin.get("site_booking_links"):
                flight = rec_itin.get("flight", {})
                hotel = rec_itin.get("hotel", {})
                rec_itin["site_booking_links"] = build_site_booking_links(flight, hotel, struct_reqs)

            # Check if booking confirmation exists
            cursor.execute("SELECT booking_data FROM bookings WHERE session_id = ?", (session_id,))
            booking_row = cursor.fetchone()
            booking_conf = json.loads(booking_row["booking_data"]) if booking_row else None

            return {
                "session_id": row["session_id"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "user_request": row["user_request"],
                "status": "BOOKED_AND_CONFIRMED" if booking_conf else row["status"],
                "structured_requirements": struct_reqs,
                "recommended_itinerary": rec_itin,
                "verification_report": json.loads(row["verification_report"]) if row["verification_report"] else None,
                "clarification_questions": json.loads(row["clarification_questions"]) if row["clarification_questions"] else [],
                "user_approval_status": "APPROVED" if booking_conf else row["user_approval_status"],
                "retry_count": row["retry_count"],
                "execution_step_count": row["execution_step_count"],
                "failure_explanation": row["failure_explanation"],
                "nearest_alternatives": json.loads(row["nearest_alternatives"]) if row["nearest_alternatives"] else [],
                "booking_confirmation": booking_conf
            }

    def get_traces(self, session_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM execution_traces
                WHERE session_id = ?
                ORDER BY step_number ASC
            """, (session_id,))
            rows = cursor.fetchall()
            return [
                {
                    "step_number": r["step_number"],
                    "timestamp": r["timestamp"],
                    "agent_name": r["agent_name"],
                    "tool_invoked": r["tool_invoked"],
                    "input_summary": r["input_summary"],
                    "decision": r["decision"],
                    "output_summary": r["output_summary"],
                    "execution_type": r["execution_type"],
                    "success": bool(r["success"]),
                    "evidence_sources": json.loads(r["evidence_sources"]) if r["evidence_sources"] else []
                }
                for r in rows
            ]

    def update_approval(self, session_id: str, approved: bool, user_notes: Optional[str] = None) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            status = "APPROVED" if approved else "REJECTED_BY_USER"
            cursor.execute("""
                UPDATE trips
                SET user_approval_status = ?,
                    status = CASE WHEN ? = 1 THEN 'APPROVED' ELSE status END
                WHERE session_id = ?
            """, (status, 1 if approved else 0, session_id))
            conn.commit()
            return cursor.rowcount > 0

    def save_booking(self, confirmation: Dict[str, Any], trace_step: Optional[Dict[str, Any]] = None) -> bool:
        session_id = confirmation.get("session_id")
        booking_id = confirmation.get("booking_id")
        if not session_id or not booking_id:
            return False

        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = confirmation.get("created_at") or ""
            pax_names = json.dumps(confirmation.get("passenger_names", []))
            flight_ticket = confirmation.get("flight_ticket", {})
            hotel_voucher = confirmation.get("hotel_voucher", {})
            receipt = confirmation.get("payment_receipt", {})

            # 1. Insert into bookings
            cursor.execute("""
                INSERT INTO bookings (
                    booking_id, session_id, created_at, passenger_names,
                    flight_pnr, hotel_confirmation, transaction_id, booking_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    booking_id = excluded.booking_id,
                    created_at = excluded.created_at,
                    passenger_names = excluded.passenger_names,
                    flight_pnr = excluded.flight_pnr,
                    hotel_confirmation = excluded.hotel_confirmation,
                    transaction_id = excluded.transaction_id,
                    booking_data = excluded.booking_data
            """, (
                booking_id,
                session_id,
                now,
                pax_names,
                flight_ticket.get("pnr", ""),
                hotel_voucher.get("confirmation_code", ""),
                receipt.get("transaction_id", ""),
                json.dumps(confirmation)
            ))

            # 2. Insert into payments
            if receipt:
                cursor.execute("""
                    INSERT INTO payments (
                        transaction_id, session_id, amount, currency,
                        payment_method, payment_status, payment_timestamp, receipt_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(transaction_id) DO UPDATE SET
                        payment_status = excluded.payment_status,
                        receipt_data = excluded.receipt_data
                """, (
                    receipt.get("transaction_id", ""),
                    session_id,
                    float(receipt.get("amount_paid", 0.0)),
                    receipt.get("currency", "INR"),
                    receipt.get("payment_method", "INSTANT_SANDBOX"),
                    receipt.get("payment_status", "SUCCESS"),
                    receipt.get("payment_timestamp", now),
                    json.dumps(receipt)
                ))

            # 3. Update trip status
            cursor.execute("""
                UPDATE trips
                SET status = 'BOOKED_AND_CONFIRMED',
                    user_approval_status = 'APPROVED',
                    updated_at = ?
                WHERE session_id = ?
            """, (now, session_id))

            # 4. Append trace step if provided
            if trace_step:
                cursor.execute("""
                    INSERT INTO execution_traces (
                        session_id, step_number, timestamp, agent_name, tool_invoked,
                        input_summary, decision, output_summary, execution_type, success,
                        evidence_sources
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    trace_step.get("step_number", 6),
                    trace_step.get("timestamp", now),
                    trace_step.get("agent_name", "Agent 6: Booking & Payment Execution Agent"),
                    trace_step.get("tool_invoked"),
                    trace_step.get("input_summary", ""),
                    trace_step.get("decision", ""),
                    trace_step.get("output_summary", ""),
                    trace_step.get("execution_type", "DETERMINISTIC_TOOL"),
                    1 if trace_step.get("success", True) else 0,
                    json.dumps(trace_step.get("evidence_sources", []))
                ))

            conn.commit()
            return True

    def get_booking(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT booking_data FROM bookings WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            if not row or not row["booking_data"]:
                return None
            return json.loads(row["booking_data"])

_repo: Optional[TripRepository] = None

def get_trip_repository() -> TripRepository:
    global _repo
    if _repo is None:
        _repo = TripRepository()
    return _repo
