import React, { useState } from 'react';
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  Cpu,
  BookOpen,
  Wrench,
  Bot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TraceStep } from '../types';

interface ExecutionTraceProps {
  trace: TraceStep[];
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ trace }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const filteredTrace = trace.filter((step) => {
    if (selectedAgent === 'ALL') return true;
    return step.agent_name.toLowerCase().includes(selectedAgent.toLowerCase());
  });

  const getEngineBadge = (type: string) => {
    switch (type) {
      case 'LLM':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Bot className="w-3 h-3 text-purple-600" />
            <span>LLM Reasoning</span>
          </span>
        );
      case 'RETRIEVAL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <BookOpen className="w-3 h-3 text-indigo-600" />
            <span>LlamaIndex RAG</span>
          </span>
        );
      case 'DETERMINISTIC_TOOL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Wrench className="w-3 h-3 text-blue-600" />
            <span>Deterministic Tool</span>
          </span>
        );
      case 'DETERMINISTIC_FALLBACK':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Cpu className="w-3 h-3 text-amber-600" />
            <span>Deterministic Fallback</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ListFilter className="w-4 h-4 text-blue-600" />
            <span>Multi-Agent Execution Trace & Evidence Log</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent record of agent decisions, tool invocations, inputs, and outputs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'Planner', 'Flight', 'Hotel', 'Optimizer', 'Verifier'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedAgent(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedAgent === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredTrace.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No trace events match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrace.map((step) => {
            const isExpanded = expandedStep === step.step_number;
            return (
              <div
                key={step.step_number}
                className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setExpandedStep(isExpanded ? null : step.step_number)}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {step.step_number}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{step.agent_name}</span>
                    {step.tool_invoked && (
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[11px] font-mono">
                        {step.tool_invoked}()
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {getEngineBadge(step.execution_type)}
                    {step.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Concise Summary */}
                <div className="mt-2 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Decision: </span>
                  {step.decision}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Input Summary:</span>
                      <p className="text-slate-600 leading-relaxed">{step.input_summary}</p>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">Output Summary:</span>
                      <p className="text-slate-600 leading-relaxed">{step.output_summary}</p>
                    </div>

                    {step.evidence_sources && step.evidence_sources.length > 0 && (
                      <div className="md:col-span-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-indigo-900 text-[11px]">Evidence & Provenance:</span>
                        {step.evidence_sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-[11px] font-mono text-indigo-800"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
