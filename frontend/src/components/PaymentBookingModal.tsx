import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Building2,
  Zap,
  ShieldCheck,
  Plane,
  Building,
  User,
  Mail,
  Phone,
  X,
  Lock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { ItineraryCandidate, StructuredRequirements, PayAndBookRequest, PassengerInfo } from '../types';

interface PaymentBookingModalProps {
  itinerary: ItineraryCandidate;
  requirements?: StructuredRequirements;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (req: PayAndBookRequest) => Promise<void>;
  isLoading: boolean;
}

export const PaymentBookingModal: React.FC<PaymentBookingModalProps> = ({
  itinerary,
  requirements,
  isOpen,
  onClose,
  onConfirmBooking,
  isLoading,
}) => {
  const paxCount = requirements?.passengers || 1;

  // Passenger state
  const [passengers, setPassengers] = useState<PassengerInfo[]>(() =>
    Array.from({ length: paxCount }, (_, i) => ({
      full_name: i === 0 ? 'Johnathan Doe' : `Traveler ${i + 1}`,
      age: 30,
      gender: 'Adult',
    }))
  );

  const [contactEmail, setContactEmail] = useState('johnathan@example.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'INSTANT_SANDBOX' | 'CARD' | 'UPI' | 'NET_BANKING'>(
    'INSTANT_SANDBOX'
  );

  // Card fields
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('882');
  const [cardholderName, setCardholderName] = useState('Johnathan Doe');

  // UPI field
  const [upiId, setUpiId] = useState('johnathan@okaxis');

  // Net banking field
  const [bankName, setBankName] = useState('HDFC Bank');

  if (!isOpen) return null;

  const handlePassengerNameChange = (index: number, name: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], full_name: name };
    setPassengers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PayAndBookRequest = {
      passenger_details: passengers,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      payment_method: paymentMethod,
      card_number: paymentMethod === 'CARD' ? cardNumber : undefined,
      card_expiry: paymentMethod === 'CARD' ? cardExpiry : undefined,
      card_cvv: paymentMethod === 'CARD' ? cardCvv : undefined,
      cardholder_name: paymentMethod === 'CARD' ? cardholderName : undefined,
      upi_id: paymentMethod === 'UPI' ? upiId : undefined,
      bank_name: paymentMethod === 'NET_BANKING' ? bankName : undefined,
    };
    await onConfirmBooking(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Secure Payment &amp; Instant Ticket Booking</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                  Verified Trip
                </span>
              </h3>
              <p className="text-xs text-indigo-200">
                Your official airline PNR and hotel reservation vouchers will be generated and confirmed immediately upon checkout.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-slate-800 text-xs">
          {/* Trip Snapshot Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                <Plane size={15} />
                <span>{itinerary.flight.airline}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                <Building size={15} />
                <span>{itinerary.hotel.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] mr-1">Total Payable:</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{itinerary.total_cost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Section 1: Passenger Details */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <User size={16} className="text-indigo-600" />
              <span>Passenger Information ({passengers.length})</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {passengers.map((p, idx) => (
                <div key={idx}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Passenger {idx + 1} Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={p.full_name}
                    onChange={(e) => handlePassengerNameChange(idx, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="First and Last Name as on ID"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  <span>E-Ticket &amp; Voucher Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  <span>Mobile for Flight SMS Updates</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-600" />
              <span>Choose Payment Method</span>
            </h4>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('INSTANT_SANDBOX')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start gap-1 cursor-pointer ${
                  paymentMethod === 'INSTANT_SANDBOX'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1 text-amber-600 font-bold text-[11px]">
                  <Zap size={14} />
                  <span>Instant Test</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">1-Click Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start gap-1 cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                  <QrCode size={14} />
                  <span>UPI / QR</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">GPay, PhonePe, Paytm</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start gap-1 cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1 text-blue-600 font-bold text-[11px]">
                  <CreditCard size={14} />
                  <span>Card</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">Debit / Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start gap-1 cursor-pointer ${
                  paymentMethod === 'NET_BANKING'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1 text-purple-600 font-bold text-[11px]">
                  <Building2 size={14} />
                  <span>Net Banking</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">All Major Banks</span>
              </button>
            </div>

            {/* Dynamic Inputs Based on Payment Method */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 mt-2">
              {paymentMethod === 'INSTANT_SANDBOX' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-900 font-semibold text-xs">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>Instant Developer Sandbox Checkout</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Zero-friction test payment. Instantly authorizes and issues confirmed reservation tickets and hotel vouchers for demonstration.
                  </p>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Simulated QR Code */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col items-center">
                      <div className="w-24 h-24 bg-slate-900 rounded p-1.5 flex flex-wrap gap-0.5 items-center justify-center">
                        <div className="w-9 h-9 border-2 border-white bg-transparent rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white" />
                        </div>
                        <div className="w-9 h-9 border-2 border-white bg-transparent rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white" />
                        </div>
                        <div className="w-9 h-9 border-2 border-white bg-transparent rounded-xs flex items-center justify-center">
                          <div className="w-4 h-4 bg-white" />
                        </div>
                        <div className="w-9 h-9 bg-white/30 rounded-xs flex items-center justify-center text-[8px] font-mono text-white">
                          PAY
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 font-mono">Scan via GPay/PhonePe</span>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Or enter UPI Virtual Payment Address (VPA):
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-500 block">
                        Supported: Google Pay, PhonePe, Paytm, BHIM UPI
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'CARD' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 0000 0000 0000"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'NET_BANKING' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Your Bank:
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Cost Breakdown */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Flight ({itinerary.flight.airline})</span>
              <span>₹{itinerary.flight_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Hotel ({itinerary.hotel.name})</span>
              <span>₹{(itinerary.hotel_cost - itinerary.taxes_and_fees).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes &amp; GST (12%)</span>
              <span>₹{itinerary.taxes_and_fees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>Agent &amp; Platform Fee (Agents-Free)</span>
              </span>
              <span>₹0 (Waived)</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-900 text-sm">Grand Total</span>
              <span className="font-bold text-indigo-700 text-base">
                ₹{itinerary.total_cost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment &amp; Issuing Tickets...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Pay ₹{itinerary.total_cost.toLocaleString()} &amp; Book Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

