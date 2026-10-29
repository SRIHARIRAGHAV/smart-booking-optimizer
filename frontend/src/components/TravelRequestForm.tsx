import { useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Hotel,
  MapPin,
  Plane,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import type { FormEvent } from 'react';
import type { StructuredRequirements } from '../types';

interface TravelRequestFormProps {
  onSubmit: (requestText?: string, structured?: StructuredRequirements) => void;
  isLoading: boolean;
}

const standardRequest =
  'Plan a three-day trip from Chennai to Bengaluru for two people. Travel from 10 November to 12 November 2026. Keep the total budget below ₹20,000, including return flights and two hotel nights. Prefer direct flights and hotels near the city centre.';

const tripIdeas = [
  {
    mood: 'THE GARDEN CITY',
    title: 'Slow days in Bengaluru',
    detail: 'Green corners · great coffee · city strolls',
    style: 'inspiration-card-garden',
    request: 'Plan a relaxed three-day city break from Chennai to Bengaluru for two people from 10 November to 12 November 2026. Include return flights and a comfortable hotel near the city centre, with a total budget under ₹20,000.',
  },
  {
    mood: 'A TASTE OF THE CITY',
    title: 'Follow the good food',
    detail: 'Market mornings · cafe evenings',
    style: 'inspiration-card-food',
    request: 'Plan a food-focused three-day Bengaluru getaway from Chennai for two people, travelling 10 November to 12 November 2026. Include return flights and a centrally located hotel, with a total budget under ₹20,000.',
  },
  {
    mood: 'OLD CITY, NEW STORIES',
    title: 'A Delhi city escape',
    detail: 'History · neighbourhoods · city lights',
    style: 'inspiration-card-weekend',
    request: 'Plan a three-day city escape from Mumbai to Delhi for two people from 10 November to 12 November 2026. Include return flights and a hotel in Delhi, with a total budget under ₹30,000.',
  },
];

export const TravelRequestForm = ({ onSubmit, isLoading }: TravelRequestFormProps) => {
  const [requestText, setRequestText] = useState(standardRequest);
  const [useStructured, setUseStructured] = useState(false);
  const requestField = useRef<HTMLTextAreaElement>(null);
  const [structured, setStructured] = useState<StructuredRequirements>({
    origin: 'Chennai',
    destination: 'Bengaluru',
    departure_date: '2026-11-10',
    return_date: '2026-11-12',
    passengers: 2,
    hotel_rooms: 1,
    max_budget: 20000,
    currency: 'INR',
    mandatory_constraints: ['return_trip', 'hotel_accommodation', 'stay_within_budget'],
    preferences: ['direct_flight', 'city_centre_hotel'],
  });

  const loadPreset = (presetKey: string) => {
    const presets: Record<string, string> = {
      A: standardRequest,
      B: 'Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people with a strict budget of ₹11,500. Direct flights and city centre accommodation preferred.',
      C: 'Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people with maximum budget of ₹3,000.',
      F: 'Plan a weekend vacation in Bengaluru for 2 people.',
    };

    const preset = presets[presetKey];
    if (preset) {
      setRequestText(preset);
      setUseStructured(false);
    }
  };

  const loadIdea = (request: string) => {
    setRequestText(request);
    setUseStructured(false);
    window.setTimeout(() => {
      requestField.current?.focus();
      requestField.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (useStructured) {
      onSubmit(undefined, structured);
    } else {
      onSubmit(requestText.trim(), undefined);
    }
  };

  const updateStructured = (field: keyof StructuredRequirements, value: string | number) => {
    setStructured((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="trip-form-card">
      <div className="trip-form-topline">
        <div className="trip-form-heading">
          <span className="form-mark"><Sparkles size={20} aria-hidden="true" /></span>
          <div>
            <h3>Let’s plan your trip</h3>
            <p>A few details are all we need to get started.</p>
          </div>
        </div>
        <div className="form-mode-switch" role="group" aria-label="Trip request format">
          <button
            type="button"
            className={!useStructured ? 'mode-button mode-button-active' : 'mode-button'}
            onClick={() => setUseStructured(false)}
            aria-pressed={!useStructured}
          >
            <Sparkles size={15} aria-hidden="true" /> Describe it
          </button>
          <button
            type="button"
            className={useStructured ? 'mode-button mode-button-active' : 'mode-button'}
            onClick={() => setUseStructured(true)}
            aria-pressed={useStructured}
          >
            <SlidersHorizontal size={15} aria-hidden="true" /> Add details
          </button>
        </div>
      </div>

      <div className="inspiration-heading">
        <div>
          <span className="inspiration-kicker"><Sparkles size={14} aria-hidden="true" /> A little inspiration</span>
          <h3>Pick a mood. We’ll help with the rest.</h3>
        </div>
        <span className="inspiration-note">Sample ideas · tap to customize</span>
      </div>
      <div className="inspiration-grid">
        {tripIdeas.map((idea) => (
          <button
            type="button"
            key={idea.mood}
            className={`inspiration-card ${idea.style}`}
            onClick={() => loadIdea(idea.request)}
            disabled={isLoading}
          >
            <span className="inspiration-photo" aria-hidden="true" />
            <span className="inspiration-card-shade" aria-hidden="true" />
            <span className="inspiration-card-copy">
              <span className="inspiration-tag">{idea.mood}</span>
              <strong>{idea.title}</strong>
              <span>{idea.detail}</span>
            </span>
            <span className="inspiration-card-arrow"><ArrowRight size={17} aria-hidden="true" /></span>
          </button>
        ))}
      </div>

      <form className="trip-form" onSubmit={handleSubmit}>
        {!useStructured ? (
          <>
            <label className="field-label" htmlFor="trip-request">What kind of trip are you dreaming of?</label>
            <textarea
              ref={requestField}
              id="trip-request"
              value={requestText}
              onChange={(event) => setRequestText(event.target.value)}
              rows={4}
              required
              placeholder="For example: Plan a long weekend in Jaipur for two, with return flights and a central hotel, under ₹25,000."
              className="request-textarea"
            />
            <div className="preset-area">
              <span className="preset-label">Try a demo scenario</span>
              <div className="preset-list">
                <button type="button" className="preset-chip" onClick={() => loadPreset('A')}>Easy getaway</button>
                <button type="button" className="preset-chip" onClick={() => loadPreset('B')}>Tight budget</button>
                <button type="button" className="preset-chip" onClick={() => loadPreset('C')}>Budget challenge</button>
                <button type="button" className="preset-chip" onClick={() => loadPreset('F')}>Help me decide</button>
              </div>
            </div>
          </>
        ) : (
          <div className="structured-fields">
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-origin"><MapPin size={14} /> Leaving from</label>
              <input id="trip-origin" type="text" value={structured.origin} onChange={(event) => updateStructured('origin', event.target.value)} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-destination"><MapPin size={14} /> Going to</label>
              <input id="trip-destination" type="text" value={structured.destination} onChange={(event) => updateStructured('destination', event.target.value)} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-budget"><Wallet size={14} /> Total budget (₹)</label>
              <input id="trip-budget" type="number" min="1" step="1" value={structured.max_budget} onChange={(event) => updateStructured('max_budget', Number(event.target.value))} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-departure"><CalendarDays size={14} /> Departure</label>
              <input id="trip-departure" type="date" value={structured.departure_date} onChange={(event) => updateStructured('departure_date', event.target.value)} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-return"><CalendarDays size={14} /> Return</label>
              <input id="trip-return" type="date" min={structured.departure_date} value={structured.return_date} onChange={(event) => updateStructured('return_date', event.target.value)} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-passengers"><Users size={14} /> Travelers</label>
              <input id="trip-passengers" type="number" min="1" step="1" value={structured.passengers} onChange={(event) => updateStructured('passengers', Number(event.target.value))} required />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="trip-rooms"><Hotel size={14} /> Hotel rooms</label>
              <input id="trip-rooms" type="number" min="1" step="1" value={structured.hotel_rooms} onChange={(event) => updateStructured('hotel_rooms', Number(event.target.value))} required />
            </div>
          </div>
        )}

        <div className="trip-form-bottom">
          <div className="planner-assurance">
            <span className="assurance-icon"><ShieldCheck size={16} aria-hidden="true" /></span>
            <span>Your plan is only a recommendation. You approve before booking.</span>
          </div>
          <button type="submit" className="submit-trip-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="submit-spinner" aria-hidden="true" />
                <span>Planning your trip…</span>
              </>
            ) : (
              <>
                <span>Build my trip plan</span>
                {useStructured ? <Plane size={17} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              </>
            )}
          </button>
        </div>
      </form>
      <p className="form-footnote"><ArrowRight size={13} aria-hidden="true" /> You can review flights, stays, and the total cost before deciding.</p>
    </div>
  );
};
