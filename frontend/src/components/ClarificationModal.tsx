import React, { useState } from 'react';
import { HelpCircle, Send } from 'lucide-react';

interface ClarificationModalProps {
  questions: string[];
  onSubmit: (answers: Record<string, any>) => void;
  isLoading: boolean;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  questions,
  onSubmit,
  isLoading,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleTextChange = (idx: number, val: string) => {
    setAnswers({ ...answers, [`answer_${idx}`]: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base text-purple-950">Clarification Needed to Proceed</h3>
          <p className="text-xs text-purple-800">
            The Request Planner identified missing or ambiguous travel parameters. The system refuses to invent requirements.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-800 mb-2">{q}</label>
              <input
                type="text"
                required
                placeholder="E.g., Chennai, 2026-11-10 to 2026-11-12, budget 20000 INR..."
                value={answers[`answer_${idx}`] || ''}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs flex items-center space-x-2 shadow-xs transition"
        >
          {isLoading ? (
            <span>Resuming Workflow...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Clarification & Resume Planning</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
