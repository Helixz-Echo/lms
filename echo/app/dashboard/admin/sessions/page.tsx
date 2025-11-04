'use client';

import { useState, useEffect } from 'react';

type TrainingSession = {
    id: string;
    session_name: string;
    created_at: string;
};

export default function SessionsPage() {
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [newSessionName, setNewSessionName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await fetch('/api/training/sessions');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load sessions');
            setSessions(data.sessions || []);
        } catch (err: any) {
            setMessage(err.message);
        }
    };

    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionName.trim()) return;

        setIsAdding(true);
        setMessage('');

        try {
            const res = await fetch('/api/training/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_name: newSessionName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add session');
            }

            setMessage('Session added successfully!');
            setNewSessionName('');
            loadSessions();
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="h-screen overflow-auto bg-gray-50">
            <div className="min-h-full flex flex-col p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Training Sessions</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage training session records</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Add New Session */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Add New Session</h2>
                        
                        <form onSubmit={handleAddSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Session Name
                                </label>
                                <input
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    placeholder="e.g., Session 4 - Specialized Training"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isAdding}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                                disabled={!newSessionName.trim() || isAdding}
                            >
                                {isAdding ? 'Adding...' : 'Add Session'}
                            </button>
                        </form>

                        {message && (
                            <div className={`mt-4 p-4 rounded-lg text-sm ${
                                message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                                {message}
                            </div>
                        )}
                    </div>

                    {/* Existing Sessions List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                            All Sessions ({sessions.length})
                        </h2>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {sessions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No sessions found</p>
                            ) : (
                                sessions.map((session, index) => (
                                    <div
                                        key={session.id}
                                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {session.session_name}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Created: {new Date(session.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
