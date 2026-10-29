import type {
  TripPlanResponse,
  TraceStep,
  PayAndBookRequest,
  BookingConfirmation,
  TripOptionsResponse,
  CustomizeTripRequest,
} from '../types';

const API_BASE = '/api';

export async function planTrip(
  user_request?: string,
  structured_requirements?: any
): Promise<TripPlanResponse> {
  const res = await fetch(`${API_BASE}/trips/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_request, structured_requirements }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(err.detail || 'Failed to submit travel planning request');
  }
  return res.json();
}

export async function getTrip(tripId: string): Promise<TripPlanResponse> {
  const res = await fetch(`${API_BASE}/trips/${tripId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trip ${tripId}`);
  }
  return res.json();
}

export async function getTrace(tripId: string): Promise<TraceStep[]> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/trace`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function submitClarification(
  tripId: string,
  clarificationAnswers: Record<string, any>
): Promise<TripPlanResponse> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/clarification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clarification_answers: clarificationAnswers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit clarification' }));
    throw new Error(err.detail || 'Clarification submission failed');
  }
  return res.json();
}

export async function submitApproval(
  tripId: string,
  approved: boolean,
  userNotes?: string
): Promise<{ success: boolean; message: string; user_approval_status: string }> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/approval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, user_notes: userNotes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Approval submission failed' }));
    throw new Error(err.detail || 'Approval submission failed');
  }
  return res.json();
}

export async function payAndBookTrip(
  tripId: string,
  payload: PayAndBookRequest
): Promise<{ success: boolean; booking: BookingConfirmation; message: string }> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/pay-and-book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Payment & booking execution failed' }));
    throw new Error(err.detail || 'Payment & booking failed');
  }
  return res.json();
}

export async function getBooking(tripId: string): Promise<BookingConfirmation> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/booking`);
  if (!res.ok) {
    throw new Error(`Failed to fetch booking for trip ${tripId}`);
  }
  return res.json();
}

export async function getTripOptions(tripId: string): Promise<TripOptionsResponse> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/options`);
  if (!res.ok) {
    throw new Error(`Failed to fetch alternative options for trip ${tripId}`);
  }
  return res.json();
}

export async function customizeTrip(
  tripId: string,
  payload: CustomizeTripRequest
): Promise<{ success: boolean; trip: any; message: string; updated_itinerary: any }> {
  const res = await fetch(`${API_BASE}/trips/${tripId}/customize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Customization failed' }));
    throw new Error(err.detail || 'Failed to update itinerary');
  }
  return res.json();
}

export async function getHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}
