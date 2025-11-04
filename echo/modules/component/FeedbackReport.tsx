"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, TrendingUp, Book, MessageCircle } from "lucide-react";

interface FeedbackReportProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    questionAnalysis?: string[];
    score?: number;
  };
  questionsAnswered: number;
  totalQuestions: number;
  questionsData?: Array<{
    question: string;
    answer: string;
    context: string[];
  }>;
}

export default function FeedbackReport({
  isOpen,
  onClose,
  feedback,
  questionsAnswered,
  totalQuestions,
  questionsData = [],
}: FeedbackReportProps) {
  if (!isOpen) return null;

  const parseFeedback = (rawFeedback: string) => {
    // Enhanced parsing for structured feedback
    const lines = rawFeedback.split('\n').filter(line => line.trim());
    
    let summary = '';
    const strengths: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];
    const questionAnalysis: string[] = [];
    
    let currentSection = 'summary';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      
      // Section detection
      if (lower.includes('**summary:**') || lower.includes('summary:')) {
        currentSection = 'summary';
        return;
      } else if (lower.includes('**strengths:**') || lower.includes('strengths:')) {
        currentSection = 'strengths';
        return;
      } else if (lower.includes('**improvements:**') || lower.includes('improvement') || lower.includes('areas for improvement')) {
        currentSection = 'improvements';
        return;
      } else if (lower.includes('**recommendations:**') || lower.includes('recommendations:')) {
        currentSection = 'recommendations';
        return;
      } else if (lower.includes('**detailed question analysis:**') || lower.includes('question analysis:')) {
        currentSection = 'questionAnalysis';
        return;
      }
      
      // Content assignment
      if (trimmed.startsWith('**') || !trimmed) return;
      
      if (currentSection === 'summary') {
        summary += (summary ? ' ' : '') + trimmed;
      } else if (currentSection === 'strengths') {
        const cleaned = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
        if (cleaned) strengths.push(cleaned);
      } else if (currentSection === 'improvements') {
        const cleaned = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
        if (cleaned) improvements.push(cleaned);
      } else if (currentSection === 'recommendations') {
        const cleaned = trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
        if (cleaned) recommendations.push(cleaned);
      } else if (currentSection === 'questionAnalysis') {
        if (trimmed.match(/^Q\d+:/i)) {
          questionAnalysis.push(trimmed);
        }
      }
    });
    
    return { 
      summary: summary || rawFeedback, 
      strengths, 
      improvements, 
      recommendations,
      questionAnalysis 
    };
  };

  const parsed = typeof feedback === 'string' 
    ? parseFeedback(feedback as any)
    : feedback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['IBM_Plex_Mono'] text-2xl font-bold">Assessment Report</h2>
              <p className="font-['Roboto'] text-sm text-white/80">
                {questionsAnswered} of {totalQuestions} questions completed
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30 hover:scale-110"
              aria-label="Close report"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Questions and Answers Section */}
          {questionsData && questionsData.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-['IBM_Plex_Mono'] text-xl font-bold text-[#3D2D4C] mb-4">
                📝 Your Assessment Responses
              </h3>
              {questionsData.map((qa, index) => (
                <div key={index} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm">
                      Q{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-['Roboto'] font-semibold text-[#3D2D4C] mb-2">
                        {qa.question}
                      </p>
                      <div className="flex items-start gap-2 mt-3 pl-2 border-l-4 border-[#7B93DB]">
                        <MessageCircle className="h-4 w-4 text-[#7B93DB] mt-1 shrink-0" />
                        <p className="font-['Roboto'] text-[#3D2D4C]/80 italic">
                          {qa.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          {questionsData && questionsData.length > 0 && (
            <div className="border-t-2 border-gray-200 my-6"></div>
          )}

          {/* Score/Summary Card */}
          <div className="rounded-xl border-2 border-[#7B93DB]/20 bg-linear-to-br from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7B93DB] text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-['IBM_Plex_Mono'] text-lg font-bold text-[#3D2D4C] mb-2">
                  Overall Performance
                </h3>
                <p className="font-['Roboto'] text-[#3D2D4C]/80 leading-relaxed whitespace-pre-wrap">
                  {parsed.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {parsed.strengths && parsed.strengths.length > 0 && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['IBM_Plex_Mono'] text-lg font-bold text-green-900 mb-3">
                    Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    {parsed.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="font-['Roboto'] text-green-800">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {parsed.improvements && parsed.improvements.length > 0 && (
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['IBM_Plex_Mono'] text-lg font-bold text-orange-900 mb-3">
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {parsed.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">→</span>
                        <span className="font-['Roboto'] text-orange-800">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {parsed.recommendations && parsed.recommendations.length > 0 && (
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
                  <Book className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['IBM_Plex_Mono'] text-lg font-bold text-purple-900 mb-3">
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {parsed.recommendations.map((recommendation, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">📚</span>
                        <span className="font-['Roboto'] text-purple-800">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* If feedback is just plain text without sections */}
          {!parsed.strengths?.length && !parsed.improvements?.length && !parsed.recommendations?.length && parsed.summary && (
            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
              <div className="font-['Roboto'] text-[#3D2D4C] leading-relaxed whitespace-pre-wrap">
                {parsed.summary}
              </div>
            </div>
          )}

          {/* Detailed Question Analysis */}
          {parsed.questionAnalysis && parsed.questionAnalysis.length > 0 && (
            <>
              <div className="border-t-2 border-gray-200 my-6"></div>
              <div className="space-y-3">
                <h3 className="font-['IBM_Plex_Mono'] text-xl font-bold text-[#3D2D4C] mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-[#7B93DB]" />
                  Detailed Question Feedback
                </h3>
                {parsed.questionAnalysis.map((analysis: string, idx: number) => {
                  const [qNum, ...rest] = analysis.split(':');
                  const feedback = rest.join(':').trim();
                  return (
                    <div key={idx} className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                          {qNum}
                        </div>
                        <p className="font-['Roboto'] text-indigo-900 leading-relaxed flex-1">
                          {feedback}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-['Roboto'] text-sm text-[#3D2D4C]/60">
              Review your performance and continue learning
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-xl border-2 border-[#7B93DB] px-6 py-2 font-['Roboto'] font-semibold text-[#7B93DB] transition-all hover:bg-[#7B93DB]/10"
              >
                Print Report
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] px-6 py-2 font-['Roboto'] font-semibold text-white shadow-lg transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
