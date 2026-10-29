import React, { useState } from 'react';
import {
  CheckCircle,
  Plane,
  Building,
  CreditCard,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Luggage,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { BookingConfirmation } from '../types';
import { AirlineLogo, ProviderLogo } from './BrandLogos';

interface ConfirmedBookingViewProps {
  booking: BookingConfirmation;
}

export const ConfirmedBookingView: React.FC<ConfirmedBookingViewProps> = ({ booking }) => {
  const [copiedPNR, setCopiedPNR] = useState(false);
  const [copiedHotel, setCopiedHotel] = useState(false);

  const { flight_ticket, hotel_voucher, payment_receipt } = booking;

  const copyToClipboard = (text: string, type: 'pnr' | 'hotel') => {
    navigator.clipboard.writeText(text);
    if (type === 'pnr') {
      setCopiedPNR(true);
      setTimeout(() => setCopiedPNR(false), 2000);
    } else {
      setCopiedHotel(true);
      setTimeout(() => setCopiedHotel(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 my-8 print:m-0 print:p-0">
      {/* Top Confirmed Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/30 rounded-2xl border border-emerald-400/40 text-emerald-300">
            <CheckCircle size={32} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">Booking Confirmed &amp; Payment Complete!</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                {booking.booking_id}
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Your flight and accommodation reservations are officially confirmed. Digital boarding passes and hotel check-in vouchers are ready below.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Grid of Confirmed Assets: Flight Ticket & Hotel Voucher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flight E-Ticket / Boarding Pass */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <AirlineLogo airline={flight_ticket.airline} size="md" />
                <div>
                  <h3 className="font-bold text-sm text-white">{flight_ticket.airline}</h3>
                  <span className="text-[11px] text-blue-200 font-mono">
                    Flight {flight_ticket.flight_number} · {flight_ticket.status}
                  </span>
                </div>
              </div>

              {/* PNR Badge */}
              <div className="text-right">
                <span className="text-[10px] text-blue-200 block">AIRLINE PNR</span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono font-bold text-sm tracking-wider text-emerald-300">
                    {flight_ticket.pnr}
                  </span>
                  <button
                    onClick={() => copyToClipboard(flight_ticket.pnr, 'pnr')}
                    className="text-blue-300 hover:text-white transition p-1"
                    title="Copy PNR"
                  >
                    {copiedPNR ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Route & Times */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Departure</span>
                  <div className="font-bold text-base text-slate-900">{flight_ticket.origin}</div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    {flight_ticket.departure_time.split('T')[1].slice(0, 5)} hrs
                  </div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 font-medium">Non-Stop</span>
                  <div className="w-16 h-0.5 bg-slate-300 relative my-1">
                    <Plane size={12} className="text-blue-600 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Confirmed</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Arrival</span>
                  <div className="font-bold text-base text-slate-900">{flight_ticket.destination}</div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    {flight_ticket.arrival_time.split('T')[1].slice(0, 5)} hrs
                  </div>
                </div>
              </div>

              {/* Passengers & Assigned Seats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block font-semibold">PASSENGERS</span>
                  <span className="font-semibold text-slate-800 block truncate">
                    {flight_ticket.passengers.join(', ')}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block font-semibold">ALLOCATED SEATS</span>
                  <span className="font-mono font-bold text-blue-700 block">
                    {flight_ticket.seat_assignments.join(', ')}
                  </span>
                </div>
              </div>

              {/* Gate & Baggage */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-800">{flight_ticket.terminal}</span>
                  <span>·</span>
                  <span>{flight_ticket.gate}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  <Luggage size={13} />
                  <span>{flight_ticket.baggage_allowance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer Link */}
          <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-mono">
              E-Ticket: {flight_ticket.eticket_number}
            </span>
            <a
              href={flight_ticket.airline_manage_booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              <span>Manage on Airline Site</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Hotel Check-in Voucher */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Voucher Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 border border-indigo-400/30">
                  <Building size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{hotel_voucher.hotel_name}</h3>
                  <span className="text-[11px] text-indigo-200">
                    {hotel_voucher.city} · {hotel_voucher.neighbourhood}
                  </span>
                </div>
              </div>

              {/* Hotel Confirmation Badge */}
              <div className="text-right">
                <span className="text-[10px] text-indigo-200 block">RESERVATION CODE</span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono font-bold text-sm tracking-wider text-emerald-300">
                    {hotel_voucher.confirmation_code}
                  </span>
                  <button
                    onClick={() => copyToClipboard(hotel_voucher.confirmation_code, 'hotel')}
                    className="text-indigo-300 hover:text-white transition p-1"
                    title="Copy Confirmation Code"
                  >
                    {copiedHotel ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {/* Check-In / Check-Out Grid */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-semibold uppercase">
                    <Calendar size={12} />
                    <span>Check-In</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{hotel_voucher.check_in_date}</div>
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] mt-0.5">
                    <Clock size={11} />
                    <span>From {hotel_voucher.check_in_time}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] font-semibold uppercase">
                    <Calendar size={12} />
                    <span>Check-Out</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{hotel_voucher.check_out_date}</div>
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] mt-0.5">
                    <Clock size={11} />
                    <span>Until {hotel_voucher.check_out_time}</span>
                  </div>
                </div>
              </div>

              {/* Room details & Guests */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block font-semibold">ROOM CATEGORY</span>
                  <span className="font-semibold text-slate-800 block truncate">
                    {hotel_voucher.room_type}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block font-semibold">GUESTS</span>
                  <span className="font-semibold text-slate-800 block truncate">
                    {hotel_voucher.guest_names.join(', ')}
                  </span>
                </div>
              </div>

              {/* Address & Amenities */}
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 space-y-1">
                <div>
                  <strong className="text-slate-700">Address:</strong> {hotel_voucher.hotel_address}
                </div>
                <div>
                  <strong className="text-slate-700">Included Amenities:</strong>{' '}
                  {hotel_voucher.amenities.join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Footer Link */}
          <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>Direct Booking Confirmed</span>
            </span>
            <a
              href={hotel_voucher.hotel_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
            >
              <ProviderLogo provider="booking" size="sm" />
              <span>View on Booking.com</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Official Tax Invoice & Payment Receipt Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-xs text-slate-700">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Official Payment Receipt &amp; Tax Invoice</h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Txn: {payment_receipt.transaction_id} · Invoice: {payment_receipt.invoice_number}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              PAID &amp; SETTLED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block font-semibold">PAYMENT METHOD</span>
            <span className="font-semibold text-slate-800">{payment_receipt.payment_method}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-semibold">DATE &amp; TIME</span>
            <span className="font-semibold text-slate-800">
              {new Date(payment_receipt.payment_timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-semibold">CONTACT EMAIL</span>
            <span className="font-semibold text-slate-800 truncate block">{booking.contact_email}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-semibold">CONTACT PHONE</span>
            <span className="font-semibold text-slate-800">{booking.contact_phone}</span>
          </div>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-emerald-700">
            <Sparkles size={14} />
            <span>
              <strong>Zero Agent Markup:</strong> This booking was executed with 0% extra commissions.
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-500 mr-2">Total Amount Charged:</span>
            <span className="text-base font-bold text-emerald-700">
              ₹{payment_receipt.amount_paid.toLocaleString()} {payment_receipt.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
