import { useState, useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CircleDollarSign,
  Compass,
  Globe,
  Hotel,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import './App.css';
import { Navbar } from './components/Navbar';
import { TravelRequestForm } from './components/TravelRequestForm';
import { ItineraryComparison } from './components/ItineraryComparison';
import { ClarificationModal } from './components/ClarificationModal';
import { FailureReport } from './components/FailureReport';
import { ApprovalModal } from './components/ApprovalModal';
import { PaymentBookingModal } from './components/PaymentBookingModal';
import { ConfirmedBookingView } from './components/ConfirmedBookingView';
import { ChooseAlternativesModal } from './components/ChooseAlternativesModal';
import { TripAssistant } from './components/TripAssistant';
import type {
  TripPlanResponse,
  StructuredRequirements,
  PayAndBookRequest,
  BookingConfirmation,
} from './types';
import {
  planTrip,
  submitClarification,
  submitApproval,
  payAndBookTrip,
  getHealth,
} from './services/api';

const currentYear = new Date().getFullYear();

export function App() {
  const [health, setHealth] = useState<any>(null);
  const [trip, setTrip] = useState<TripPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planningStage, setPlanningStage] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingConfirmation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Customization feature states
  const [isAlternativesOpen, setIsAlternativesOpen] = useState(false);
  const [alternativesTab, setAlternativesTab] = useState<'hotels' | 'flights'>('hotels');

  useEffect(() => {
    getHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check failed:', err));
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setInterval(() => {
      setPlanningStage((stage) => (stage + 1) % 3);
    }, 1900);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  const handlePlanTrip = async (
    userRequest?: string,
    structured?: StructuredRequirements
  ): Promise<TripPlanResponse | null> => {
    setPlanningStage(0);
    setIsLoading(true);
    setErrorMessage(null);
    setConfirmedBooking(null);
    try {
      const resp = await planTrip(userRequest, structured);
      setTrip(resp);
      if (resp.booking_confirmation) {
        setConfirmedBooking(resp.booking_confirmation);
      }
      return resp;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to find travel options.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClarificationSubmit = async (answers: Record<string, any>) => {
    if (!trip) return;
    setPlanningStage(0);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updated = await submitClarification(trip.session_id, answers);
      setTrip(updated);
      if (updated.booking_confirmation) {
        setConfirmedBooking(updated.booking_confirmation);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit clarification answers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalConfirm = async (approved: boolean, notes?: string) => {
    if (!trip) return;
    setIsApproving(true);
    try {
      await submitApproval(trip.session_id, approved, notes);
      setTrip({ ...trip, user_approval_status: approved ? 'APPROVED' : 'REJECTED' });
      setIsApprovalOpen(false);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePayAndBook = async (payPayload: PayAndBookRequest) => {
    if (!trip) return;
    setIsBookingInProgress(true);
    setErrorMessage(null);
    try {
      const result = await payAndBookTrip(trip.session_id, payPayload);
      if (result.success && result.booking) {
        setConfirmedBooking(result.booking);
        setTrip({
          ...trip,
          status: 'BOOKED_AND_CONFIRMED',
          user_approval_status: 'APPROVED',
          booking_confirmation: result.booking,
        });
        setIsPaymentOpen(false);
      }
    } catch (err: any) {
      alert(`Booking & Payment Error: ${err.message}`);
    } finally {
      setIsBookingInProgress(false);
    }
  };

  const handleOpenChangeHotel = () => {
    setAlternativesTab('hotels');
    setIsAlternativesOpen(true);
  };

  const handleOpenChangeFlight = () => {
    setAlternativesTab('flights');
    setIsAlternativesOpen(true);
  };

  const handleTripUpdated = (updatedTripData: any) => {
    setTrip(updatedTripData);
  };

  const activeBooking = confirmedBooking || trip?.booking_confirmation;

  return (
    <div className="app-shell text-slate-100 font-sans">
      <Navbar health={health} />

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              <span>Smart Travel Planner &amp; Direct Booking</span>
            </div>
            <h1 id="hero-title">
              Plan trips.
              <br />
              Find flights &amp; hotels.
              <span>Pay &amp; book instantly.</span>
              <span>100% Agent-Free.</span>
            </h1>
            <p className="hero-description">
              Describe your dream trip in your own words. We bring flights, stays, and verified
              budget options together with direct links to official booking sites with zero intermediary fees.
            </p>
            <div className="hero-actions">
              <a className="hero-action hero-action-primary" href="#trip-planner">
                Find My Trip
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="hero-action hero-action-secondary" href="#how-it-works">
                Explore How It Works
              </a>
            </div>
            <p className="hero-note">
              Direct official airline &amp; hotel sites <span>·</span> Instant payment &amp; PNR tickets <span>·</span> Always in your control
            </p>
            <a className="hero-scroll-cue" href="#inspiration">
              <span>Scroll to discover</span>
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </section>

        <div className="page-content">
          <section className="stats-grid" aria-label="Trip planner highlights">
            <div className="stat-item">
              <span className="stat-icon"><Sparkles size={20} aria-hidden="true" /></span>
              <span><strong className="stat-value">Made for you</strong><span className="stat-label">Plans around your style &amp; budget</span></span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><Plane size={20} aria-hidden="true" /></span>
              <span><strong className="stat-value">Official Sites</strong><span className="stat-label">Direct carrier &amp; hotel portal links</span></span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><CircleDollarSign size={20} aria-hidden="true" /></span>
              <span><strong className="stat-value">0% Extra Fee</strong><span className="stat-label">Agent-Free base inventory rates</span></span>
            </div>
            <div className="stat-item">
              <span className="stat-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
              <span><strong className="stat-value">Instant Tickets</strong><span className="stat-label">Live checkout &amp; PNR issuance</span></span>
            </div>
          </section>

          <section className="planner-section" id="trip-planner" aria-labelledby="planner-title">
            <div className="section-heading">
              <span className="section-eyebrow"><MapPin size={14} aria-hidden="true" /> Follow your curiosity</span>
              <h2 id="planner-title">Let’s find your next destination.</h2>
              <p>Start with a natural request, or enter your dates and budget.</p>
            </div>

            {errorMessage && (
              <div role="alert" className="planning-error">
                <AlertCircle size={17} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="inspiration-heading" id="inspiration">
              <div>
                <span className="inspiration-kicker"><Sparkles size={14} aria-hidden="true" /> A little inspiration</span>
                <h3>Pick a mood or describe where you want to go.</h3>
              </div>
              <span className="inspiration-note">Sample requests · Click to test</span>
            </div>

            <TravelRequestForm
              onSubmit={handlePlanTrip}
              isLoading={isLoading}
            />

            {isLoading && (
              <section className="planning-activity" role="status" aria-live="polite" aria-atomic="true">
                <div className="planning-orbit" aria-hidden="true">
                  <span className="orbit-dot" />
                  <Plane size={20} />
                </div>
                <div className="planning-copy">
                  <span className="planning-label"><span className="live-pulse" /> FINDING YOUR BEST OPTIONS</span>
                  <h3>{['Finding flight routes and seat availability', 'Searching top-rated stays in the destination', 'Verifying prices and taxes'][planningStage]}</h3>
                  <p>Comparing routes and prices. This usually takes just a couple seconds.</p>
                  <div className="planning-track" aria-hidden="true"><span /></div>
                </div>
                <Sparkles className="planning-sparkle" size={23} aria-hidden="true" />
              </section>
            )}
          </section>

          {trip && (
            <section className="workflow-results" aria-label="Your trip planning results">
              {trip.clarification_required && (
                <ClarificationModal
                  questions={trip.clarification_questions}
                  onSubmit={handleClarificationSubmit}
                  isLoading={isLoading}
                />
              )}

              {(trip.status === 'FAILED_RETRY_EXHAUSTED' || trip.status === 'FAILED_INFEASIBLE') && (
                <FailureReport
                  explanation={trip.failure_explanation}
                  nearestAlternatives={trip.nearest_alternatives}
                  retryCount={trip.retry_count}
                  maxBudget={trip.structured_requirements?.max_budget}
                />
              )}

              {/* Confirmed Booking View (E-Tickets & Voucher) */}
              {activeBooking && (
                <ConfirmedBookingView booking={activeBooking} />
              )}

              {/* Recommended Itinerary & Site Booking Links */}
              {trip.recommended_itinerary && (
                <ItineraryComparison
                  itinerary={trip.recommended_itinerary}
                  verificationReport={trip.verification_report}
                  requirements={trip.structured_requirements}
                  alternatives={trip.alternative_itineraries}
                  approvalStatus={trip.user_approval_status}
                  isBooked={Boolean(activeBooking)}
                  onOpenApproval={() => setIsApprovalOpen(true)}
                  onOpenPayment={() => setIsPaymentOpen(true)}
                  onOpenChangeHotel={handleOpenChangeHotel}
                  onOpenChangeFlight={handleOpenChangeFlight}
                />
              )}

              {/* Approval Modal */}
              {trip.recommended_itinerary && (
                <ApprovalModal
                  itinerary={trip.recommended_itinerary}
                  isOpen={isApprovalOpen}
                  onClose={() => setIsApprovalOpen(false)}
                  onConfirm={handleApprovalConfirm}
                  onProceedToPayment={() => {
                    setIsApprovalOpen(false);
                    setIsPaymentOpen(true);
                  }}
                  isLoading={isApproving}
                />
              )}

              {/* Instant Payment & Booking Checkout Modal */}
              {trip.recommended_itinerary && (
                <PaymentBookingModal
                  itinerary={trip.recommended_itinerary}
                  requirements={trip.structured_requirements}
                  isOpen={isPaymentOpen}
                  onClose={() => setIsPaymentOpen(false)}
                  onConfirmBooking={handlePayAndBook}
                  isLoading={isBookingInProgress}
                />
              )}

              {/* Choose Another Accommodation or Flight Modal */}
              {trip.session_id && (
                <ChooseAlternativesModal
                  sessionId={trip.session_id}
                  isOpen={isAlternativesOpen}
                  initialTab={alternativesTab}
                  onClose={() => setIsAlternativesOpen(false)}
                  onTripUpdated={handleTripUpdated}
                />
              )}
            </section>
          )}
        </div>

        <section className="features-section" id="why-roamly" aria-labelledby="features-title">
          <div className="page-content">
            <div className="section-heading">
              <span className="section-eyebrow"><Sparkles size={14} aria-hidden="true" /> Direct &amp; Transparent</span>
              <h2 id="features-title">Everything you need for your trip. Zero middlemen.</h2>
              <p>Direct provider links, verified budgets, and instant confirmed tickets.</p>
            </div>
            <div className="features-grid">
              <article className="feature-card">
                <span className="feature-icon"><Sparkles size={20} aria-hidden="true" /></span>
                <h3>Natural Language Planning</h3>
                <p>Describe your dates, budget, and travel desires. The system matches options automatically.</p>
              </article>
              <article className="feature-card">
                <span className="feature-icon"><Plane size={20} aria-hidden="true" /></span>
                <h3>Official Airline Sites</h3>
                <p>Direct deep links to IndiGo, Air India, Akasa, and Google Flights to book without any intermediary markup.</p>
              </article>
              <article className="feature-card">
                <span className="feature-icon"><Hotel size={20} aria-hidden="true" /></span>
                <h3>Verified Accommodations</h3>
                <p>Direct Booking.com, Agoda, and hotel portal links with verified locations, amenities, and nightly rates.</p>
              </article>
              <article className="feature-card">
                <span className="feature-icon"><CircleDollarSign size={20} aria-hidden="true" /></span>
                <h3>Agent-Free (0% Extra Fee)</h3>
                <p>Save money with 100% agent-free direct inventory pricing. No hidden fees or extra booking markups.</p>
              </article>
              <article className="feature-card">
                <span className="feature-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
                <h3>Customize Anytime</h3>
                <p>Switch to another hotel or flight anytime with 1 click. Costs and budget margins update instantly.</p>
              </article>
              <article className="feature-card">
                <span className="feature-icon"><Globe size={20} aria-hidden="true" /></span>
                <h3>Instant Digital E-Tickets</h3>
                <p>Checkout with Card, UPI, or Sandbox and receive instant confirmed Airline PNRs and Hotel Vouchers.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="journey-section" id="how-it-works" aria-labelledby="journey-title">
          <div className="page-content">
            <div className="section-heading">
              <span className="section-eyebrow"><Route size={15} aria-hidden="true" /> Simple, End-to-End Workflow</span>
              <h2 id="journey-title">Three steps to your next journey.</h2>
              <p>From initial idea to confirmed boarding pass in minutes.</p>
            </div>
            <div className="journey-steps">
              <article className="journey-step">
                <span className="journey-number">01</span>
                <span className="journey-icon"><MapPin size={24} aria-hidden="true" /></span>
                <h3>Tell Us What You Need</h3>
                <p>Enter your origin, destination, travel dates, and budget. We check routes and accommodation options.</p>
              </article>
              <article className="journey-step">
                <span className="journey-number">02</span>
                <span className="journey-icon"><Sparkles size={24} aria-hidden="true" /></span>
                <h3>Review &amp; Customize</h3>
                <p>Check the verified flight and hotel combination, click to swap to another place or ticket, or visit official sites.</p>
              </article>
              <article className="journey-step">
                <span className="journey-number">03</span>
                <span className="journey-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
                <h3>Pay &amp; Instant Book</h3>
                <p>Complete payment with Card, UPI, or Sandbox. Confirmed Airline PNRs and hotel vouchers are issued immediately.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="page-content faq-layout">
            <div className="faq-intro">
              <span className="section-eyebrow"><Sparkles size={14} aria-hidden="true" /> Good to know</span>
              <h2 id="faq-title">Frequently Asked Questions</h2>
              <p>Transparent information about how booking and payments work.</p>
              <a className="faq-plan-link" href="#trip-planner">
                Start planning <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <div className="faq-list">
              <details className="faq-item">
                <summary>How does the Agent-Free direct booking work?</summary>
                <p>For every recommended flight and hotel, we provide pre-filled direct links to the official airline portals (IndiGo, Air India, Akasa) and hotel providers (Booking.com, Google Hotels). You can click and book directly with the provider without paying any agent commissions.</p>
              </details>
              <details className="faq-item">
                <summary>Can I choose another hotel or flight?</summary>
                <p>Yes! Click &quot;Choose Another Hotel&quot; or &quot;Choose Another Flight&quot; on your itinerary card to browse all available options with photos, star ratings, and prices, and switch options with one click.</p>
              </details>
              <details className="faq-item">
                <summary>Can I make payment and book tickets directly inside this platform?</summary>
                <p>Yes! You can securely pay using Credit/Debit Card, UPI QR code, Net Banking, or instant Sandbox checkout. Official Airline PNRs, E-Ticket numbers, seat allocations, and hotel vouchers are generated immediately.</p>
              </details>
              <details className="faq-item">
                <summary>What payment methods are supported?</summary>
                <p>We support Credit and Debit Cards (Visa, MasterCard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking (major Indian banks), and a 1-click Instant Developer Sandbox for immediate testing.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark"><Compass size={23} aria-hidden="true" /></span>
          <span><strong>Smart Booking Optimizer</strong><small>Direct Travel &amp; Instant Booking Engine</small></span>
        </div>
        <div className="footer-links">
          <a href="#trip-planner">Plan a trip</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQs</a>
        </div>
        <div className="footer-disclaimer">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>Direct airline &amp; hotel reservations with zero intermediary markup.</span>
        </div>
        <p className="footer-copyright">© {currentYear} Smart Booking Optimizer · Travel, thoughtfully planned.</p>
      </footer>

      <TripAssistant
        onPlanTrip={(request) => handlePlanTrip(request)}
        isPlanning={isLoading}
        isDemo={health?.llm_service?.demo_mode ?? true}
      />
    </div>
  );
}

export default App;
