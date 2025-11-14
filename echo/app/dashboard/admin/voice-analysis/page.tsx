// app/dashboard/admin/voice-analysis/page.tsx
"use client";

import React, { useState, useRef } from "react";

// --- TYPES (from API and metrics files) ---

type BehaviorMetrics = {
  overallSentimentScore: number;
  empathyLevel: number;
  professionalismCourtesy: number;
  conflictDeEscalation: number;
  activeListening: number;
  toneConsistency: number;
  customerSentimentImpact: number;
  problemSolvingLanguage: number;
  speechPaceClarity: number;
  personalizationVsScript: number;
  summary: string;
  perSkillDescriptions: { [key: string]: string };
};

type CallMetrics = {
    agent: { wpm: number; pronunciationScore: number; speakingSeconds: number; talkRatio: number; fillerCount: number; };
    customer: { wpm: number; speakingSeconds: number; talkRatio: number; fillerCount: number; };
    overall: { totalSilenceSeconds: number; totalWords: number; };
}

type ApiResult = {
  message: string;
  filename: string;
  metrics?: CallMetrics;
  behaviorMetrics?: BehaviorMetrics;
};

// --- MAIN PAGE COMPONENT ---

export default function VoiceAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
        setFile(selectedFile);
        setResult(null);
        setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a .wav file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/analyze-call", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 gap-6 bg-gray-50">
        <div className="w-full max-w-6xl">
            <Header />
            <FileUploader onFileSelected={handleFileChange} file={file} setFile={setFile} />
            <AnalysisButton onAnalyze={handleUpload} loading={loading} file={file} />
            <ErrorMessage error={error} />
            {result && <ResultsDisplay result={result} />}
        </div>
      </main>
  );
}

// --- SUB-COMPONENTS ---

const Header = () => (
    <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Voice Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">Upload a call recording to generate performance metrics.</p>
    </div>
);

const FileUploader = ({ onFileSelected, file, setFile }: { onFileSelected: (file: File | null) => void, file: File | null, setFile: (file: File | null) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleButtonClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => onFileSelected(e.target.files?.[0] || null);
    const removeFile = () => {
        setFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white text-center transition-colors duration-300 hover:border-blue-400 hover:bg-blue-50">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".wav,audio/wav" className="hidden" />
            <div className="flex flex-col items-center justify-center">
                <UploadCloudIcon />
                {file ? (
                    <div className="mt-4">
                        <p className="font-semibold text-gray-700">{file.name}</p>
                        <p className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                        <button onClick={removeFile} className="mt-2 text-xs text-red-500 hover:underline">Remove File</button>
                    </div>
                ) : (
                    <>
                        <p className="mt-4 font-semibold text-gray-600">
                            <button onClick={handleButtonClick} className="text-blue-600 hover:underline focus:outline-none">Click to select</button> a .wav file
                        </p>
                        <p className="text-xs text-gray-400 mt-1">WAV format only</p>
                    </>
                )}
            </div>
        </div>
    );
};

const AnalysisButton = ({ onAnalyze, loading, file }: { onAnalyze: () => void, loading: boolean, file: File | null }) => (
    <div className="mt-6 text-center">
        <button onClick={onAnalyze} disabled={!file || loading} className="w-full max-w-md px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "Analyzing..." : "Analyze Call"}
        </button>
    </div>
);

const ErrorMessage = ({ error }: { error: string | null }) => {
    if (!error) return null;
    return <div className="mt-6 w-full max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
        <strong className="font-bold">Error: </strong>
        <span>{error}</span>
    </div>;
};

const ResultsDisplay = ({ result }: { result: ApiResult }) => (
    <section className="w-full mt-8 space-y-8">
        {result.metrics && <QuantitativeAnalysis metrics={result.metrics} />}
        {result.behaviorMetrics && <BehavioralAnalysis behaviorMetrics={result.behaviorMetrics} />}
    </section>
);

const QuantitativeAnalysis = ({ metrics }: { metrics: CallMetrics }) => (
    <div className="p-6 bg-white border rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quantitative Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Agent WPM" value={metrics.agent.wpm.toFixed(0)} helpText="Words Per Minute" />
            <StatCard title="Customer WPM" value={metrics.customer.wpm.toFixed(0)} helpText="Words Per Minute" />
            <StatCard title="Agent Pronunciation" value={<Gauge value={metrics.agent.pronunciationScore} />} helpText="Average word confidence" />
            <StatCard title="Agent Filler Words" value={metrics.agent.fillerCount} helpText="Count of words like 'um', 'uh'" />
            <StatCard title="Customer Filler Words" value={metrics.customer.fillerCount} helpText="Count of words like 'um', 'uh'" />
            <StatCard title="Total Silence" value={`${metrics.overall.totalSilenceSeconds.toFixed(1)}s`} helpText="Total duration of silence" />
        </div>
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Talk Ratio</h3>
            <RatioBar agent={metrics.agent.talkRatio} customer={metrics.customer.talkRatio} />
        </div>
    </div>
);

const BehavioralAnalysis = ({ behaviorMetrics: bm }: { behaviorMetrics: BehaviorMetrics }) => (
    <div className="p-6 bg-white border rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Behavioral Analysis</h2>
        <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <h3 className="font-semibold text-blue-800 text-lg mb-2 flex items-center gap-2">
                <InfoIcon />
                Overall Summary
            </h3>
            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{bm.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(bm.perSkillDescriptions).map(([key, description]) => (
                <MetricCard
                    key={key}
                    title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    value={(bm as any)[key]}
                    description={description}
                    scale={key === 'overallSentimentScore' || key === 'customerSentimentImpact' ? "-1 to +1" : "0 to 1"}
                />
            ))}
        </div>
    </div>
);

// --- UI HELPER & CARD COMPONENTS ---

const StatCard = ({ title, value, helpText }: { title: string, value: string | React.ReactNode, helpText: string }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-3xl font-bold text-gray-800 mt-1">{value}</div>
        <p className="text-xs text-gray-400 mt-1">{helpText}</p>
    </div>
);

const MetricCard = ({ title, value, description, scale }: { title: string, value: number, description?: string, scale?: string }) => {
    const isBipolar = scale === "-1 to +1";
    const normalizedValue = isBipolar ? (value + 1) / 2 : value; // convert -1..+1 to 0..1
    const percentage = Math.max(0, Math.min(1, normalizedValue)) * 100;
    
    const getBarColor = () => {
        if (isBipolar) {
            return value > 0.2 ? 'bg-green-500' : value < -0.2 ? 'bg-red-500' : 'bg-yellow-500';
        }
        return percentage > 85 ? 'bg-green-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-red-500';
    };

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-3 transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <h3 className="font-semibold text-base text-gray-800">{title}</h3>
                <span className="text-xl font-bold text-gray-900">{value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${getBarColor()} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
    );
};

const Gauge = ({ value }: { value: number }) => {
    const percentage = Math.max(0, Math.min(1, value)) * 100;
    const color = percentage > 85 ? 'text-green-500' : percentage > 60 ? 'text-yellow-500' : 'text-red-500';
    return <div className={`font-bold ${color}`}>{percentage.toFixed(0)}%</div>;
};

const RatioBar = ({ agent, customer }: { agent: number, customer: number }) => {
    const total = agent + customer;
    const agentPct = total > 0 ? (agent / total) * 100 : 50;
    const customerPct = total > 0 ? (customer / total) * 100 : 50;
    return (
        <div>
            <div className="w-full flex rounded-full h-8 bg-gray-200 overflow-hidden shadow-inner">
                <div style={{ width: `${agentPct}%` }} className="bg-blue-500 flex items-center justify-center text-sm text-white font-bold">
                    {agentPct.toFixed(0)}%
                </div>
                <div style={{ width: `${customerPct}%` }} className="bg-purple-500 flex items-center justify-center text-sm text-white font-bold">
                    {customerPct.toFixed(0)}%
                </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Agent</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span>Customer</span>
                </div>
            </div>
        </div>
    );
};

const UploadCloudIcon = () => (
    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
