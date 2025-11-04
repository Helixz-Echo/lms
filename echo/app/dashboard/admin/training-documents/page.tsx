'use client';

import { useState, useEffect } from 'react';

type TrainingDocument = {
    id: string;
    session_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    training_sessions: {
        id: string;
        session_name: string;
    };
};

export default function TrainingDocumentsPage() {
    const [documents, setDocuments] = useState<TrainingDocument[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/training/documents');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load training documents');
            setDocuments(data.documents || []);
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="h-screen overflow-auto bg-gray-50">
            <div className="min-h-full flex flex-col p-4 sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Training Documents</h1>
                    <p className="text-sm text-gray-600 mt-1">View all uploaded training documents</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            All Training Documents ({documents.length})
                        </h2>
                        <button
                            onClick={loadDocuments}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {message && (
                        <div className="mb-4 p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                            {message}
                        </div>
                    )}

                    {isLoading ? (
                        <p className="text-sm text-gray-500 text-center py-8">Loading...</p>
                    ) : documents.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No training documents found. Upload files to see them here.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {documents.map((doc, index) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                                    {doc.training_sessions?.session_name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{doc.file_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.file_size)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                    {doc.mime_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(doc.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
