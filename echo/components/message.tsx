import { FC } from 'react';

interface MessageProps {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}

const Message: FC<MessageProps> = ({ role, content }) => {
    const isUser = role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`px-4 py-2 rounded-lg max-w-2xl ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-100'}
                    }`}>
                <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        </div>
    );
};

export default Message;
