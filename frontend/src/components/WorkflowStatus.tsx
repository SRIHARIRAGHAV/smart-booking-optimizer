import React from 'react';
import {
  FileText,
  Plane,
  Building,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface WorkflowStatusProps {
  status: string;
  retryCount: number;
  stepCount: number;
  clarificationRequired: boolean;
  approvalStatus: string;
}

export const WorkflowStatus: React.FC<WorkflowStatusProps> = ({
  status,
  retryCount,
  stepCount,
  clarificationRequired,
  approvalStatus,
}) => {
  const stages = [
    { id: 'PLANNER', label: '1. Request Planner', icon: FileText },
    { id: 'FLIGHT', label: '2. Flight Searcher', icon: Plane },
    { id: 'HOTEL', label: '3. Hotel Searcher', icon: Building },
    { id: 'OPTIMIZER', label: '4. Budget Optimizer', icon: TrendingDown },
    { id: 'VERIFIER', label: '5. Booking Verifier', icon: ShieldCheck },
    { id: 'APPROVAL', label: '6. User Approval', icon: CheckCircle },
  ];

  const getStageState = (index: number) => {
    if (clarificationRequired) {
      if (index === 0) return 'warning';
      return 'idle';
    }

    if (status === 'VERIFIED_RECOMMENDATION' || status === 'APPROVED') {
      if (index < 5) return 'completed';
      if (index === 5) return approvalStatus === 'APPROVED' ? 'completed' : 'active';
    }

    if (status === 'FAILED_RETRY_EXHAUSTED' || status === 'FAILED_INFEASIBLE') {
      if (index <= 3) return 'completed';
      return 'failed';
    }

    // Default progression based on status
    if (status === 'PLANNING') {
      if (index === 0) return 'active';
      return 'idle';
    }

    return 'completed';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="font-bold text-sm text-slate-800">LangGraph Execution Pipeline</span>
          {retryCount > 0 && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
              <span>Recovery Active (Attempt #{retryCount + 1})</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <div>
            Total Steps: <span className="font-semibold text-slate-800">{stepCount}</span>
          </div>
          <div>
            Recovery Retries: <span className="font-semibold text-slate-800">{retryCount}/3</span>
          </div>
          <div>
            Status:{' '}
            <span
              className={`font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                status === 'VERIFIED_RECOMMENDATION' || status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'CLARIFICATION_REQUIRED'
                  ? 'bg-purple-100 text-purple-800'
                  : status.startsWith('FAILED')
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Steps Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {stages.map((stage, idx) => {
          const state = getStageState(idx);
          const Icon = stage.icon;

          let badgeClasses = 'bg-slate-50 border-slate-200 text-slate-500';
          let iconColor = 'text-slate-400';

          if (state === 'completed') {
            badgeClasses = 'bg-emerald-50 border-emerald-300 text-emerald-900';
            iconColor = 'text-emerald-600';
          } else if (state === 'active') {
            badgeClasses = 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20';
            iconColor = 'text-blue-600';
          } else if (state === 'warning') {
            badgeClasses = 'bg-purple-50 border-purple-300 text-purple-900';
            iconColor = 'text-purple-600';
          } else if (state === 'failed') {
            badgeClasses = 'bg-rose-50 border-rose-300 text-rose-900';
            iconColor = 'text-rose-600';
          }

          return (
            <div
              key={stage.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition ${badgeClasses}`}
            >
              <div className="p-2 rounded-lg bg-white shadow-xs mb-2">
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <span className="text-xs font-semibold leading-tight">{stage.label}</span>
              <span className="text-[10px] text-slate-400 uppercase mt-1">
                {state === 'completed'
                  ? 'Passed'
                  : state === 'active'
                  ? 'In Progress'
                  : state === 'warning'
                  ? 'Input Needed'
                  : state === 'failed'
                  ? 'Stopped'
                  : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
