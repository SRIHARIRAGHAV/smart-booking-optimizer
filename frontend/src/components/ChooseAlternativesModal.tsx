import React, { useState, useEffect } from 'react';
import {
  X,
  Hotel,
  Plane,
  Sparkles,
  ExternalLink,
  Check,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import type { TripOptionsResponse, AvailableHotelOption, AvailableFlightOption } from '../types';
import { getTripOptions, customizeTrip } from '../services/api';
import { AirlineLogo, ProviderLogo, PlacePhotoBadge } from './BrandLogos';

interface ChooseAlternativesModalProps {
  sessionId: string;
  isOpen: boolean;
  initialTab?: 'hotels' | 'flights';
  onClose: () => void;
  onTripUpdated: (updatedTrip: any) => void;
}

export const ChooseAlternativesModal: React.FC<ChooseAlternativesModalProps> = ({
  sessionId,
  isOpen,
  initialTab = 'hotels',
  onClose,
  onTripUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'hotels' | 'flights'>(initialTab);
  const [options, setOptions] = useState<TripOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setIsLoading(true);
    setErrorMsg(null);
    getTripOptions(sessionId)
      .then((data) => setOptions(data))
      .catch((err) => setErrorMsg(err.message || 'Failed to load options.'))
      .finally(() => setIsLoading(false));
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const handleSelectHotel = async (hotelId: string) => {
    setUpdatingId(hotelId);
    setErrorMsg(null);
    try {
      const resp = await customizeTrip(sessionId, { hotel_id: hotelId });
      if (resp.success) {
        onTripUpdated(resp.trip);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update accommodation.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectFlight = async (flightId: string) => {
    setUpdatingId(flightId);
    setErrorMsg(null);
    try {
      const resp = await customizeTrip(sessionId, { flight_id: flightId });
      if (resp.success) {
        onTripUpdated(resp.trip);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update flight ticket.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Choose Another Place to Stay or Flight</h3>
              <p className="text-xs text-indigo-200">
                Browse alternative accommodations and flights with official site links. Select any option to update your plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons & Filter Chips */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 pt-3 pb-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('hotels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Hotel size={15} />
              <span>Places to Stay ({options?.hotels.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('flights')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'flights'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Plane size={15} />
              <span>Flight Tickets ({options?.flights.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-semibold">
            <ShieldCheck size={14} />
            <span>0% Agent Fee · Official Site Rates</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading matching options for your route and dates...</span>
            </div>
          )}

          {/* ACCOMMODATIONS TAB */}
          {!isLoading && activeTab === 'hotels' && options && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-600">
                <span>Select a different accommodation in the destination:</span>
                <span className="text-[11px] text-slate-400">All prices include 12% mandatory taxes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.hotels.map((item: AvailableHotelOption) => {
                  const h = item.hotel;
                  const isCurrent = h.hotel_id === options.current_hotel_id;
                  const isUpdating = updatingId === h.hotel_id;

                  return (
                    <div
                      key={h.hotel_id}
                      className={`rounded-2xl border p-4 transition flex flex-col justify-between ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Place Badge with photo style */}
                        <PlacePhotoBadge
                          neighbourhood={h.neighbourhood}
                          city={h.city}
                          className="mb-3"
                        />

                        {/* Hotel Info */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900">{h.name}</h4>
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                                  Current Pick
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={12} className="text-slate-400" />
                              <span>{h.neighbourhood}, {h.city}</span>
                              {h.is_city_centre && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1 py-0.5 rounded">
                                  City Centre
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <Star size={13} fill="currentColor" />
                            <span>{h.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {h.amenities.slice(0, 3).map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {a}
                            </span>
                          ))}
                        </div>

                        {/* Pricing & Difference */}
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between mb-3">
                          <div>
                            <div className="text-[10px] text-slate-400">Total for {h.nights} night(s)</div>
                            <div className="text-sm font-bold text-slate-900">
                              ₹{h.total_price.toLocaleString()}
                            </div>
                          </div>

                          {!isCurrent && (
                            <div className="text-right">
                              {item.price_difference_vs_current < 0 ? (
                                <div className="text-emerald-600 font-bold flex items-center gap-0.5 text-xs">
                                  <TrendingDown size={13} />
                                  <span>Save ₹{Math.abs(item.price_difference_vs_current).toLocaleString()}</span>
                                </div>
                              ) : item.price_difference_vs_current > 0 ? (
                                <div className="text-blue-600 font-bold flex items-center gap-0.5 text-xs">
                                  <TrendingUp size={13} />
                                  <span>+₹{item.price_difference_vs_current.toLocaleString()}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">Same price</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions: Direct Link to Site & Select Button */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {/* Direct Site Link */}
                        <a
                          href={item.direct_booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-slate-700 hover:text-indigo-600 font-medium text-[11px] py-1 transition cursor-pointer"
                        >
                          <ProviderLogo provider="booking" size="sm" />
                          <span>View on Site</span>
                          <ExternalLink size={11} />
                        </a>

                        {/* Select Accommodation Button */}
                        {isCurrent ? (
                          <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                            <Check size={14} />
                            <span>Selected</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleSelectHotel(h.hotel_id)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <span>Updating...</span>
                            ) : (
                              <>
                                <span>Choose This Place</span>
                                <ArrowRight size={13} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FLIGHTS TAB */}
          {!isLoading && activeTab === 'flights' && options && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-600">
                <span>Select an alternative flight ticket for this route:</span>
                <span className="text-[11px] text-slate-400">Direct flight options available</span>
              </div>

              <div className="space-y-3">
                {options.flights.map((item: AvailableFlightOption) => {
                  const f = item.flight;
                  const isCurrent = f.flight_id === options.current_flight_id;
                  const isUpdating = updatingId === f.flight_id;

                  return (
                    <div
                      key={f.flight_id}
                      className={`rounded-2xl border p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start sm:items-center space-x-3.5 flex-1">
                        {/* Airline Logo */}
                        <AirlineLogo airline={f.airline} size="lg" />

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{f.airline}</h4>
                            <span className="text-[11px] text-slate-400 font-mono">({f.flight_id})</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">
                                Current Pick
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                            <span className="font-semibold text-slate-800">
                              {f.departure_time.split('T')[1].slice(0, 5)} → {f.arrival_time.split('T')[1].slice(0, 5)}
                            </span>
                            <span>·</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              <span>{f.duration_minutes} mins</span>
                            </span>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              {f.is_direct ? 'Direct' : `${f.stops} stop`}
                            </span>
                          </div>

                          {/* Direct Site Link */}
                          <div className="mt-2 flex items-center space-x-3">
                            <a
                              href={item.direct_booking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <span>Official Carrier Portal</span>
                              <ExternalLink size={11} />
                            </a>
                            <span className="text-slate-300">|</span>
                            <a
                              href={item.google_flights_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <ProviderLogo provider="google" size="sm" />
                              <span>Google Flights</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Selection */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="sm:text-right">
                          <div className="text-sm font-bold text-slate-900">
                            ₹{f.total_price.toLocaleString()}
                          </div>
                          {!isCurrent && (
                            <div>
                              {item.price_difference_vs_current < 0 ? (
                                <span className="text-[11px] text-emerald-600 font-bold">
                                  Save ₹{Math.abs(item.price_difference_vs_current).toLocaleString()}
                                </span>
                              ) : item.price_difference_vs_current > 0 ? (
                                <span className="text-[11px] text-blue-600 font-bold">
                                  +₹{item.price_difference_vs_current.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Same price</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="sm:mt-2">
                          {isCurrent ? (
                            <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
                              <Check size={14} />
                              <span>Selected</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleSelectFlight(f.flight_id)}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <span>Updating...</span>
                              ) : (
                                <>
                                  <span>Choose This Ticket</span>
                                  <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
