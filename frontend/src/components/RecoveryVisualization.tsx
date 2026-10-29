import React from 'react';
import { RefreshCw, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { TraceStep } from '../types';

interface RecoveryVisualizationProps {
  retryCount: number;
  trace: TraceStep[];
  maxBudget?: number;
}

export const RecoveryVisualization: React.FC<RecoveryVisualizationProps> = ({
  retryCount,
  maxBudget = 20000,
}) => {
  if (retryCount === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 mb-8">
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-amber-950">
            Autonomous Recovery Loop Progression ({retryCount} Retry Cycle{retryCount > 1 ? 's' : ''})
          </h4>
          <p className="text-xs text-amber-800">
            Initial standard candidate exceeded the budget ceiling (₹{maxBudget.toLocaleString()}). The system autonomously
            re-routed search parameters to find a compliant solution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 font-bold mb-1">
            <span>Attempt 1: Initial Search</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-slate-600">
            Standard inventory evaluated. Candidate combination exceeded strict budget constraint and was rejected.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 font-bold mb-1">
            <span>Attempt 2: Recovery Re-search</span>
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
          </div>
          <p className="text-slate-600">
            Targeted search strategy formulated. Queried budget-tier flights & accommodations to satisfy hard constraints.
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 font-bold mb-1">
            <span>Attempt 3: Verified Solution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-slate-600">
            Feasible combination discovered, recalculated by Booking Verifier, and confirmed within budget.
          </p>
        </div>
      </div>
    </div>
  );
};
