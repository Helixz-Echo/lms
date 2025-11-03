'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Uploader() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setMessage('Uploading...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setMessage(data.message);
            // Navigate to dashboard on successful upload
            router.push('/dashboard/admin');

        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="w-full max-w-lg p-8 space-y-8 bg-white border border-gray-200 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800">Upload Your Files</h2>
                    <p className="text-gray-500 mt-2">Upload a CSV file to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg text-center transition-colors duration-300 hover:border-blue-400 hover:bg-blue-50">
                            <svg className="w-16 h-16 mb-4 text-gray-400 flex-shrink-0 block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v6m0 0l-3-3m3 3l3-3"></path></svg>
                            <p className="text-lg font-semibold text-gray-600">
                                {file ? file.name : 'Drag & drop a file here, or click to select a file'}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">CSV files only</p>
                        </div>
                    </div>

                    {file && (
                        <div className="text-sm text-gray-500">
                            File size: {(file.size / 1024).toFixed(2)} KB
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                        disabled={!file || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </form>

                {message && (
                    <p className={`mt-4 text-sm text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}