'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TrainingSession = {
    id: string;
    session_name: string;
};

export default function TrainingSessionUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [message, setMessage] = useState('');
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const res = await fetch('/api/training/sessions', { method: 'GET' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to load sessions');
                setSessions(data.sessions || []);
                if (data.sessions && data.sessions.length > 0) {
                    setSelectedSessionId(data.sessions[0].id);
                }
            } catch (err: any) {
                setMessage(err.message);
            }
        };
        loadSessions();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedSessionId) return;

        setIsUploading(true);
        setMessage('Uploading...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', selectedSessionId);

        try {
            const response = await fetch('/api/training/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setMessage(data.error || 'This session already has data. Clear previous data to upload again.');
                } else {
                    throw new Error(data.error || 'Something went wrong');
                }
                return;
            }

            setMessage(data.message || 'File uploaded and processed successfully');
            router.push('/dashboard/admin'); // Navigate after success
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = async () => {
        if (!selectedSessionId) return;
        setIsClearing(true);
        setMessage('Clearing previous data...');

        try {
            const response = await fetch('/api/training/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: selectedSessionId }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear previous data');
            }
            setMessage('Previous data cleared. You can upload again.');
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-6">

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Training Session</label>
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={sessions.length === 0}
                        >
                            {sessions.length === 0 ? (
                                <option value="">No training sessions available</option>
                            ) : (
                                sessions.slice(0, 3).map((s) => (
                                    <option key={s.id} value={s.id}>{s.session_name}</option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Showing first 3 sessions</p>
                    </div>

                    <div className="relative">
                        <input
                            id="training-file-upload"
                            name="training-file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center transition-colors duration-300 hover:border-blue-400 hover:bg-blue-50">
                            <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <p className="text-sm font-semibold text-gray-600">
                                {file ? file.name : 'Choose CSV file or drag here'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">CSV format only</p>
                        </div>
                    </div>

                    {file && (
                        <div className="text-sm text-gray-500">
                            File size: {(file.size / 1024).toFixed(2)} KB
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                            disabled={!file || isUploading || !selectedSessionId || sessions.length === 0}
                        >
                            {isUploading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : 'Upload Session'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="w-full px-6 py-3 text-base font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                            disabled={isClearing || !selectedSessionId || sessions.length === 0}
                        >
                            {isClearing ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Clearing...
                                </span>
                            ) : 'Delete'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`p-4 rounded-lg text-sm ${
                        message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') || message.toLowerCase().includes('blocked') || message.toLowerCase().includes('already has data')
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : message.toLowerCase().includes('clear') 
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}