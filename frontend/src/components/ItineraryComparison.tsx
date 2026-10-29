import React from 'react';
import {
  Plane,
  Building,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Star,
  MapPin,
} from 'lucide-react';
import type { ItineraryCandidate, VerificationReport, StructuredRequirements } from '../types';
import { SiteBookingLinksCard } from './SiteBookingLinksCard';
import { AirlineLogo, ProviderLogo, PlacePhotoBadge } from './BrandLogos';

interface ItineraryComparisonProps {
  itinerary: ItineraryCandidate;
  verificationReport?: VerificationReport;
  requirements?: StructuredRequirements;
  alternatives?: ItineraryCandidate[];
  approvalStatus: string;
  isBooked?: boolean;
  onOpenApproval: () => void;
  onOpenPayment?: () => void;
  onOpenChangeHotel?: () => void;
  onOpenChangeFlight?: () => void;
}

export const ItineraryComparison: React.FC<ItineraryComparisonProps> = ({
  itinerary,
  verificationReport,
  requirements,
  alternatives = [],
  approvalStatus,
  isBooked = false,
  onOpenApproval,
  onOpenPayment,
  onOpenChangeHotel,
  onOpenChangeFlight,
}) => {
  const { flight, hotel, site_booking_links } = itinerary;

  return (
    <div className="space-y-6 mb-8">
      {/* Primary Recommended Itinerary Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
              <Sparkles className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">Your Selected Travel Itinerary</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-800 text-blue-200">
                  {itinerary.itinerary_id}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Verified within ₹{requirements?.max_budget?.toLocaleString() || '20,000'} budget · Surplus: ₹
                {itinerary.budget_remaining.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {verificationReport?.status === 'VERIFIED' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Price &amp; Availability Verified</span>
              </div>
            )}

            {isBooked ? (
              <span className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Tickets Booked &amp; Confirmed</span>
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenApproval}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-medium border border-slate-600/60 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-slate-300" />
                  <span>{approvalStatus === 'APPROVED' ? 'Approved' : 'Review Plan'}</span>
                </button>

                {onOpenPayment && (
                  <button
                    type="button"
                    onClick={onOpenPayment}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer ring-2 ring-emerald-400/40"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay &amp; Instant Book (₹{itinerary.total_cost.toLocaleString()})</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Suggestion Bar: Choose Another Place / Flight */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-indigo-950 font-semibold">
            <Sparkles size={15} className="text-indigo-600" />
            <span>Need something different? Customize anytime:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenChangeHotel && (
              <button
                type="button"
                onClick={onOpenChangeHotel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs transition cursor-pointer"
              >
                <Building size={14} />
                <span>Choose Another Hotel</span>
                <RefreshCw size={12} className="text-indigo-400" />
              </button>
            )}

            {onOpenChangeFlight && (
              <button
                type="button"
                onClick={onOpenChangeFlight}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs transition cursor-pointer"
              >
                <Plane size={14} />
                <span>Choose Another Flight</span>
                <RefreshCw size={12} className="text-blue-400" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details Column */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <AirlineLogo airline={flight.airline} size="md" />
                <span className="text-[11px] font-mono text-slate-500 font-semibold">{flight.flight_id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Route</span>
                  <span className="font-semibold text-slate-800">
                    {flight.origin} → {flight.destination}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Departure</span>
                  <span className="font-semibold text-slate-800">
                    {flight.departure_time.split('T')[1].slice(0, 5)} hrs
                  </span>
                </div>

                {flight.return_flight_id && (
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Return Flight</span>
                    <span className="font-semibold text-slate-800">
                      {flight.return_flight_id} ({flight.return_departure_time?.split('T')[1].slice(0, 5)} hrs)
                    </span>
                  </div>
                )}

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Direct / Stops</span>
                  <span className="font-semibold text-slate-800">
                    {flight.is_direct ? 'Direct (0 stops)' : `${flight.stops} stop(s)`}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Fare ({requirements?.passengers || 1} pax)</span>
                  <span className="font-semibold text-slate-800">
                    ₹{flight.total_price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Flight Actions: Direct Site Link & Change Button */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col gap-2">
              <a
                href={site_booking_links?.flight_search_url || site_booking_links?.flight_direct_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Book on {flight.airline.split(' ')[0]} Site</span>
                <ExternalLink size={12} />
              </a>

              {onOpenChangeFlight && (
                <button
                  type="button"
                  onClick={onOpenChangeFlight}
                  className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-center text-xs border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw size={12} className="text-slate-400" />
                  <span>Choose Another Flight</span>
                </button>
              )}
            </div>
          </div>

          {/* Hotel Details Column */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              {/* Place Badge with photo style */}
              <PlacePhotoBadge
                neighbourhood={hotel.neighbourhood}
                city={hotel.city}
                className="mb-3"
              />

              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{hotel.name}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-slate-400" />
                    <span>{hotel.neighbourhood}, {hotel.city}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Star size={12} fill="currentColor" />
                  <span>{hotel.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs mb-3">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Duration &amp; Rooms</span>
                  <span className="font-semibold text-slate-800">
                    {hotel.nights} night(s) · {hotel.room_count} room(s)
                  </span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Amenities</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {hotel.amenities.slice(0, 2).join(', ')}
                  </span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Nightly Rate</span>
                  <span className="font-semibold text-slate-800">
                    ₹{hotel.price_per_night.toLocaleString()} + 12% tax
                  </span>
                </div>

                <div className="flex justify-between pt-0.5">
                  <span className="font-bold text-slate-700">Hotel Subtotal (incl. tax)</span>
                  <span className="font-bold text-indigo-600">
                    ₹{hotel.total_price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Hotel Actions: Direct Site Link & Change Button */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col gap-2">
              <a
                href={site_booking_links?.hotel_direct_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <ProviderLogo provider="booking" size="sm" />
                <span>Book on Booking.com</span>
                <ExternalLink size={12} />
              </a>

              {onOpenChangeHotel && (
                <button
                  type="button"
                  onClick={onOpenChangeHotel}
                  className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-center text-xs border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw size={12} className="text-slate-400" />
                  <span>Choose Another Hotel</span>
                </button>
              )}
            </div>
          </div>

          {/* Cost Breakdown & Verification Column */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="text-slate-900 font-bold text-sm mb-3">
                Total Price Breakdown
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-500">Flights ({flight.airline.split(' ')[0]})</span>
                  <span className="font-semibold text-slate-800">
                    ₹{itinerary.flight_cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-500">Accommodation Base</span>
                  <span className="font-semibold text-slate-800">
                    ₹{(itinerary.hotel_cost - itinerary.taxes_and_fees).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Taxes &amp; GST (12%)</span>
                  <span className="font-semibold text-slate-800">
                    ₹{itinerary.taxes_and_fees.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 bg-slate-100 px-2 rounded-lg">
                  <span className="font-bold text-slate-900 text-sm">Total Trip Cost</span>
                  <span className="font-bold text-blue-700 text-sm">
                    ₹{itinerary.total_cost.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Your Budget Limit</span>
                  <span className="font-semibold text-slate-800">
                    ₹{requirements?.max_budget?.toLocaleString() ?? '20,000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">Remaining Surplus</span>
                  <span className="font-bold text-emerald-600">
                    ₹{itinerary.budget_remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Constraints Check */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Guaranteed Trip Highlights:</span>
              <div className="flex flex-wrap gap-1">
                {requirements?.mandatory_constraints.map((c, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>{c.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent-Free Direct Site Booking Section */}
        <div className="p-6 pt-0">
          <SiteBookingLinksCard
            links={site_booking_links}
            airlineName={flight.airline}
            hotelName={hotel.name}
          />
        </div>

        {/* Verification Summary Banner */}
        {verificationReport && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Verification Report:</strong> {verificationReport.explanation}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Recalculated: ₹{verificationReport.recalculated_total_cost.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Alternative Itineraries (if available) */}
      {alternatives.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900">
              Alternative Verified Combinations ({alternatives.length})
            </h4>
            {onOpenChangeHotel && (
              <button
                type="button"
                onClick={onOpenChangeHotel}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Browse All Places &amp; Flights</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {alternatives.map((alt) => (
              <div
                key={alt.itinerary_id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {alt.flight.airline} + {alt.hotel.name}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {alt.hotel.neighbourhood} · Score: {alt.preference_score}
                  </div>
                  {alt.site_booking_links && (
                    <div className="flex gap-2 mt-2">
                      <a
                        href={alt.site_booking_links.flight_search_url || alt.site_booking_links.flight_direct_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Airline Portal</span>
                        <ExternalLink size={10} />
                      </a>
                      <a
                        href={alt.site_booking_links.hotel_direct_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Hotel Portal</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{alt.total_cost.toLocaleString()}</div>
                  <div className="text-emerald-600 text-[11px]">
                    +₹{alt.budget_remaining.toLocaleString()} under
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
