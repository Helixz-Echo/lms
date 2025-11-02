'use client';

import { useState } from 'react';
import Message from './message';

export default function Chat() {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input) return;

        setIsLoading(true);
        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ history: messages, question: input }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.answer };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error fetching chat response:', error);
            const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 text-gray-100">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Start chatting...
                    </div>
                )}
                {messages.map((msg, i) => (
                    <Message key={i} role={msg.role} content={typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)} />
                ))}
                {isLoading && <Message role="assistant" content="Thinking..." />}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question..."
                    className="w-full px-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={isLoading}
                />
            </form>
        </div>
    );
}
