import React from 'react';
import { AlertTriangle, TrendingUp, Sliders } from 'lucide-react';

interface FailureReportProps {
  explanation?: string;
  nearestAlternatives?: any[];
  retryCount?: number;
  maxBudget?: number;
}

export const FailureReport: React.FC<FailureReportProps> = ({
  explanation,
  nearestAlternatives = [],
  maxBudget = 0,
}) => {
  return (
    <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-rose-950">No Options Found Within Your Budget</h3>
          <p className="text-xs text-rose-800">
            We strictly protect your budget ceiling ({maxBudget > 0 ? `₹${maxBudget.toLocaleString()}` : ''}) and never exceed it without your permission.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs text-slate-700 leading-relaxed mb-4 shadow-xs">
        <span className="font-bold text-slate-900 block mb-1">Details:</span>
        <p>{explanation || 'All available flight and accommodation options currently exceed the specified budget limit.'}</p>
      </div>

      {nearestAlternatives.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-rose-600" />
            <span>Closest Available Alternatives</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {nearestAlternatives.map((alt, idx) => {
              const totalCost = alt.total_cost || 0;
              const overBy = maxBudget > 0 ? totalCost - maxBudget : 0;
              return (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-slate-900">
                        {alt.flight?.airline || 'Flight'} + {alt.hotel?.name || 'Hotel'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {alt.hotel?.neighbourhood}, {alt.flight?.stops === 0 ? 'Direct flight' : `${alt.flight?.stops} stops`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-rose-700">₹{totalCost.toLocaleString()}</div>
                      {overBy > 0 && (
                        <div className="text-[10px] text-rose-600 font-semibold">+₹{overBy.toLocaleString()} over</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Requires adjusting budget by <strong>₹{overBy > 0 ? overBy.toLocaleString() : 'more'}</strong>.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
