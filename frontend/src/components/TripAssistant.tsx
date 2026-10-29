import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Compass,
  LoaderCircle,
  MessageCircle,
  Minus,
  Plane,
  Sparkles,
  X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import type { TripPlanResponse } from '../types';

interface TripAssistantProps {
  onPlanTrip: (request: string) => Promise<TripPlanResponse | null>;
  isPlanning: boolean;
  isDemo: boolean;
}

interface ConversationMessage {
  id: number;
  from: 'assistant' | 'traveler';
  text: string;
}

const starterSuggestions = [
  'Plan a three-day trip from Chennai to Bengaluru for two people. Travel from 10 November to 12 November 2026. Keep the total budget below ₹20,000, including return flights and two hotel nights.',
  'Help me plan a comfortable getaway',
];

const getPlanSummary = (plan: TripPlanResponse) => {
  if (plan.clarification_required) {
    const questions = plan.clarification_questions.slice(0, 3).map((question) => `• ${question}`).join('\n');
    return `Happy to help! I need a little more detail before I can compare options:\n${questions || 'Please add your departure city, dates, and budget.'}\n\nYou can also answer the questions in the trip planner on the page.`;
  }

  if (plan.recommended_itinerary) {
    const itinerary = plan.recommended_itinerary;
    return `I found a trip option for you! ✨\n\n✈️ ${itinerary.flight.airline}: ${itinerary.flight.origin} → ${itinerary.flight.destination}\n🏨 ${itinerary.hotel.name} in ${itinerary.hotel.neighbourhood}\n💰 Estimated total: ₹${itinerary.total_cost.toLocaleString('en-IN')}${itinerary.is_feasible ? ' — within your budget.' : ' — this option needs a budget adjustment.'}\n\nI’ve opened the complete plan below so you can review the details. Nothing is booked unless you approve it.`;
  }

  if (plan.failure_explanation) {
    return `I checked your request, but couldn’t find a suitable match this time. ${plan.failure_explanation}\n\nTry adjusting your dates, route, or budget and I can check again.`;
  }

  return 'I’ve sent your trip through the planner. Take a look at the results below, and I can help you adjust the details.';
};

export function TripAssistant({ onPlanTrip, isPlanning, isDemo }: TripAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 0,
      from: 'assistant',
      text: 'Hi, I’m your trip companion 👋 Tell me what you have in mind—or even just the kind of break you need. I can check flight and hotel options and help get the details sorted.',
    },
  ]);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowWelcome(true), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isPlanning, isOpen]);

  const sendMessage = async (text: string) => {
    const request = text.trim();
    if (!request || isPlanning) return;

    setShowWelcome(false);
    setMessages((current) => [...current, { id: Date.now(), from: 'traveler', text: request }]);
    setDraft('');

    const plan = await onPlanTrip(request);
    const responseText = plan
      ? getPlanSummary(plan)
      : 'I couldn’t reach the trip planner just now. Please try again in a moment, or use the trip form on the page.';
    setMessages((current) => [...current, { id: Date.now() + 1, from: 'assistant', text: responseText }]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <aside className="trip-assistant" aria-label="Trip planning assistant">
      {showWelcome && !isOpen && (
        <div className="assistant-welcome">
          <span className="assistant-welcome-icon"><Sparkles size={16} aria-hidden="true" /></span>
          <button type="button" className="assistant-welcome-copy" onClick={() => { setIsOpen(true); setShowWelcome(false); }}>
            <strong>Need a hand planning?</strong>
            <span>Your trip companion is here to help.</span>
          </button>
          <button type="button" className="assistant-welcome-close" aria-label="Dismiss welcome message" onClick={() => setShowWelcome(false)}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {isOpen && (
        <section className="assistant-panel" aria-label="Trip companion chat">
          <header className="assistant-header">
            <span className="assistant-avatar"><Compass size={21} aria-hidden="true" /></span>
            <div className="assistant-header-copy">
              <strong>Your trip companion</strong>
              <span><span className="assistant-online-dot" /> {isDemo ? 'Travel planner ready' : 'AI travel planner ready'}</span>
            </div>
            <button type="button" className="assistant-header-button" aria-label="Minimize trip assistant" onClick={() => setIsOpen(false)}>
              <Minus size={19} aria-hidden="true" />
            </button>
            <button type="button" className="assistant-header-button" aria-label="Close trip assistant" onClick={() => setIsOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="assistant-context">
            <Sparkles size={14} aria-hidden="true" />
            <span>{isDemo ? 'Using sample travel inventory. Include your start, destination, dates, and budget for the best match.' : 'Include your start, destination, dates, and budget and I’ll check your options.'}</span>
          </div>

          <div className="assistant-messages" ref={conversationRef} aria-live="polite">
            {messages.map((message) => (
              <div className={`assistant-message-row assistant-message-${message.from}`} key={message.id}>
                {message.from === 'assistant' && <span className="assistant-message-avatar"><Bot size={15} aria-hidden="true" /></span>}
                <p className="assistant-message">{message.text}</p>
              </div>
            ))}

            {messages.length === 1 && !isPlanning && (
              <div className="assistant-suggestions" aria-label="Suggested trip requests">
                {starterSuggestions.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>
                    <Plane size={14} aria-hidden="true" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {isPlanning && (
              <div className="assistant-typing" role="status">
                <LoaderCircle size={16} aria-hidden="true" />
                <span>Checking routes, stays, and your budget…</span>
              </div>
            )}
          </div>

          <form className="assistant-composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="assistant-message">Tell your trip companion what you’re planning</label>
            <textarea
              id="assistant-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Where would you like to go?"
              rows={2}
              disabled={isPlanning}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" aria-label="Send trip request" disabled={isPlanning || !draft.trim()}>
              {isPlanning ? <LoaderCircle size={18} className="assistant-send-spinner" /> : <ArrowUp size={19} />}
            </button>
          </form>
          <div className="assistant-footer"><CheckCircle2 size={13} aria-hidden="true" /> No booking without your approval</div>
        </section>
      )}

      <button
        type="button"
        className={`assistant-launcher${isOpen ? ' assistant-launcher-open' : ''}`}
        aria-label={isOpen ? 'Close trip assistant' : 'Open trip assistant'}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
          setShowWelcome(false);
        }}
      >
        {isOpen ? <X size={24} aria-hidden="true" /> : <MessageCircle size={23} aria-hidden="true" />}
        {!isOpen && <span className="assistant-launcher-sparkle"><Sparkles size={12} aria-hidden="true" /></span>}
      </button>
    </aside>
  );
}
