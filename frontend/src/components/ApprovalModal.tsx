import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, X, CreditCard } from 'lucide-react';
import type { ItineraryCandidate } from '../types';

interface ApprovalModalProps {
  itinerary: ItineraryCandidate;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (approved: boolean, notes?: string) => void;
  onProceedToPayment?: (notes?: string) => void;
  isLoading: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  itinerary,
  isOpen,
  onClose,
  onConfirm,
  onProceedToPayment,
  isLoading,
}) => {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Review &amp; Approve Travel Plan</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-950">
            <div className="font-bold text-sm mb-1">{itinerary.flight.airline} + {itinerary.hotel.name}</div>
            <div className="flex justify-between text-xs text-emerald-900 mt-1">
              <span>Verified Total Cost:</span>
              <span className="font-bold">₹{itinerary.total_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-900">
              <span>Remaining Budget Margin:</span>
              <span className="font-bold text-emerald-700">₹{itinerary.budget_remaining.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-indigo-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Verified Travel Plan:</strong> Route, availability, and pricing have been verified against your budget. You can record approval or proceed directly to payment and confirmed ticket issuance.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Optional Notes / Trip Purpose:</label>
            <input
              type="text"
              placeholder="E.g., Approved for family vacation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onConfirm(true, notes)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
            >
              Record Approval
            </button>

            {onProceedToPayment && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  onConfirm(true, notes);
                  onProceedToPayment(notes);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay &amp; Book Tickets</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
