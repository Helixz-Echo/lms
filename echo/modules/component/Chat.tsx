"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    timestamp: Date;
}

export default function Chat() {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSignOut = async () => {
        try {
            await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });
            router.push("/auth/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleNavigation = (label: string) => {
        setIsMobileMenuOpen(false);
        
        switch (label) {
            case "Dashboard":
                router.push("/dashboard");
                break;
            case "Start new chat":
                setMessage("");
                setMessages([]);
                setIsLoading(false);
                break;
            case "AI chat":
                router.push("/chat");
                break;
            default:
                break;
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: message,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage("");
        setIsLoading(true);

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `I received your message: "${userMessage.text}". This is a simulated response. Replace this with your actual AI API integration.`,
                sender: "ai",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsLoading(false);
            inputRef.current?.focus();
        }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickAction = (action: string) => {
        setMessage(action);
        inputRef.current?.focus();
    };

    const quickActions = ["Article", "Weather", "Sport", "Press", "Food", "Plants", "Suggest something"];

    const navItems = [
        { icon: DashboardIcon, label: "Dashboard", active: false },
        { icon: AddIcon, label: "Start new chat", active: false },
        { icon: CommentIcon, label: "AI chat", active: true },
    ];

    return (
        <div className="flex h-screen bg-linear-to-br from-[#7B93DB] via-[#8DA8E3] to-[#9DB3E8]">
            {/* Mobile Menu Button */}
            <button
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] text-white shadow-lg md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-white/20 bg-linear-to-b from-white/10 to-white/5 backdrop-blur-md px-6 py-8 shadow-2xl transition-transform duration-300 ease-in-out md:static md:z-auto md:w-64 md:translate-x-0 lg:w-72 xl:w-[280px] ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col gap-6">
                    {/* Logo */}
                    <div className="flex flex-col gap-3">
                        <h1 className="font-['IBM_Plex_Mono'] text-3xl font-bold leading-tight text-white drop-shadow-lg md:text-3xl lg:text-4xl xl:text-[40px]">
                            Soft GPT
                        </h1>
                        <div className="h-px bg-white/30"></div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                                    item.active 
                                        ? "bg-white/20 shadow-lg backdrop-blur-sm" 
                                        : "hover:bg-white/10 hover:shadow-md"
                                }`}
                                onClick={() => handleNavigation(item.label)}
                            >
                                <div className={`transition-transform duration-200 ${item.active ? '' : 'group-hover:scale-110'}`}>
                                    <item.icon active={item.active} />
                                </div>
                                <span
                                    className={`font-['Roboto'] text-base font-semibold md:text-base lg:text-lg ${
                                        item.active ? "text-white" : "text-white/90 group-hover:text-white"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="flex flex-col gap-4">
                    <div className="h-px bg-white/30"></div>
                    <button className="group flex items-center justify-between rounded-lg p-2 transition-all hover:bg-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
                                <span className="font-['Source_Sans_3'] text-lg font-semibold text-white">
                                    KI
                                </span>
                            </div>
                            <span className="font-['Roboto'] text-base font-semibold text-white/90 group-hover:text-white md:text-base lg:text-lg">
                                kesharaIndukumara
                            </span>
                        </div>
                        <div className="transition-transform group-hover:rotate-180">
                            <ExpandDownIcon />
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col">
                {/* Header */}
                <header className="flex justify-end gap-3 px-4 py-4 pt-16 md:px-8 md:py-8 md:pt-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12">
                    <button 
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 hover:shadow-lg"
                        aria-label="Toggle color mode"
                    >
                        <ColorModeIcon />
                    </button>
                    <button 
                        onClick={handleSignOut}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/20 hover:shadow-lg"
                        title="Sign Out"
                        aria-label="Sign out"
                    >
                        <SignOutIcon />
                    </button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] shadow-lg ring-2 ring-white/30 transition-transform hover:scale-110">
                        <span className="font-['Roboto'] text-sm font-bold text-white">
                            KI
                        </span>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12 xl:px-20">
                    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
                        {/* Messages Container */}
                        {messages.length === 0 ? (
                            // Empty State - What can I help with?
                            <div className="flex flex-1 items-center justify-center p-6 md:p-8 lg:p-12 xl:p-16">
                                <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-6 md:gap-8 lg:gap-10">
                                    <h2 className="font-['IBM_Plex_Mono'] text-center text-2xl font-bold leading-tight text-[#3D2D4C] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                                        What can I help with?
                                    </h2>

                                    {/* Quick Actions */}
                                    <div className="flex w-full flex-wrap items-center justify-center gap-2 md:gap-3">
                                        {quickActions.map((action, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickAction(action)}
                                                className="group flex items-center justify-center gap-2 rounded-full border-2 border-[#7B93DB]/30 bg-white/80 px-3 py-2 backdrop-blur-sm transition-all hover:scale-105 hover:border-[#7B93DB] hover:bg-linear-to-r hover:from-[#7B93DB]/10 hover:to-[#9DB3E8]/10 hover:shadow-md active:scale-95 md:px-4 md:py-2.5 lg:px-5 lg:py-3"
                                            >
                                                <span className="font-['Roboto'] text-xs font-medium text-[#7B93DB] transition-colors group-hover:text-[#7B93DB] md:text-sm lg:text-base">
                                                    {action}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <p className="hidden text-center text-sm text-[#3D2D4C]/60 md:block lg:text-base">
                                        Soft GPT can make mistakes. Check important info.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Messages Display
                            <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
                                <div className="mx-auto w-full max-w-3xl space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`flex max-w-[85%] gap-3 ${
                                                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                                                }`}
                                            >
                                                {/* Avatar */}
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                        msg.sender === "user"
                                                            ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8]"
                                                            : "bg-linear-to-r from-purple-500 to-pink-500"
                                                    } shadow-lg`}
                                                >
                                                    <span className="text-xs font-bold text-white">
                                                        {msg.sender === "user" ? "KI" : "AI"}
                                                    </span>
                                                </div>

                                                {/* Message Bubble */}
                                                <div
                                                    className={`rounded-2xl px-4 py-3 shadow-md ${
                                                        msg.sender === "user"
                                                            ? "bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] text-white"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    <p className="text-sm leading-relaxed md:text-base">
                                                        {msg.text}
                                                    </p>
                                                    <p
                                                        className={`mt-1 text-xs ${
                                                            msg.sender === "user"
                                                                ? "text-white/70"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        {msg.timestamp.toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Loading Indicator */}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex max-w-[85%] gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-pink-500 shadow-lg">
                                                    <span className="text-xs font-bold text-white">AI</span>
                                                </div>
                                                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 shadow-md">
                                                    <div className="flex space-x-1">
                                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                                                    </div>
                                                    <span className="text-sm text-gray-500">Typing...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}

                        {/* Input Box - Always at Bottom */}
                        <div className="border-t border-gray-200 bg-white/80 p-4 md:p-6">
                            <div className="mx-auto w-full max-w-3xl">
                                <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#7B93DB]/30 bg-white px-4 py-3 shadow-lg transition-all focus-within:border-[#7B93DB] focus-within:shadow-xl md:px-6 md:py-4 lg:px-8 lg:py-5">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Message Soft GPT"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={isLoading}
                                        className="flex-1 bg-transparent font-['Roboto'] text-base text-[#3D2D4C] outline-none placeholder:text-[#3D2D4C]/60 disabled:opacity-50 md:text-lg lg:text-xl"
                                    />
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <button 
                                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110 hover:bg-gray-100 md:h-10 md:w-10"
                                            aria-label="Attach file"
                                        >
                                            <PaperClipIcon />
                                        </button>
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={!message.trim() || isLoading}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-r from-[#7B93DB] to-[#9DB3E8] shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 md:h-12 md:w-12"
                                            aria-label="Send message"
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DashboardIcon({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_2_158)">
                <path
                    d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4ZM15.833 7.337C16.07 7.171 16.392 7.199 16.596 7.404C16.8 7.608 16.826 7.93 16.659 8.164C14.479 11.21 13.279 12.842 13.061 13.061C12.475 13.646 11.525 13.646 10.939 13.061C10.354 12.475 10.354 11.525 10.939 10.939C11.313 10.566 12.944 9.365 15.833 7.337ZM17.5 11C18.052 11 18.5 11.448 18.5 12C18.5 12.552 18.052 13 17.5 13C16.948 13 16.5 12.552 16.5 12C16.5 11.448 16.948 11 17.5 11ZM6.5 11C7.052 11 7.5 11.448 7.5 12C7.5 12.552 7.052 13 6.5 13C5.948 13 5.5 12.552 5.5 12C5.5 11.448 5.948 11 6.5 11ZM8.818 7.404C9.208 7.794 9.208 8.427 8.818 8.818C8.428 9.208 7.794 9.208 7.404 8.818C7.014 8.428 7.014 7.794 7.404 7.404C7.794 7.014 8.427 7.014 8.818 7.404ZM12 5.5C12.552 5.5 13 5.948 13 6.5C13 7.052 12.552 7.5 12 7.5C11.448 7.5 11 7.052 11 6.5C11 5.948 11.448 5.5 12 5.5Z"
                    fill={active ? "white" : "white"}
                    fillOpacity={active ? "1" : "0.9"}
                />
            </g>
            <defs>
                <clipPath id="clip0_2_158">
                    <rect width="24" height="24" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

function AddIcon({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12.7279 15.7279L12.7279 9.72792"
                stroke={active ? "white" : "white"}
                strokeOpacity={active ? "1" : "0.9"}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M15.7279 12.7279L9.72791 12.7279"
                stroke={active ? "white" : "white"}
                strokeOpacity={active ? "1" : "0.9"}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M17.5844 5.75015C14.2698 3.43752 9.67507 3.75998 6.71753 6.71752C3.39807 10.037 3.39807 15.4189 6.71753 18.7383C10.037 22.0578 15.4189 22.0578 18.7383 18.7383C21.6959 15.7808 22.0183 11.186 19.7057 7.87147"
                stroke={active ? "white" : "white"}
                strokeOpacity={active ? "1" : "0.9"}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CommentIcon({ active }: { active: boolean }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M18.3619 5.32715L18.816 4.43616L18.8159 4.43614L18.3619 5.32715ZM19.6725 6.6377L20.5635 6.18371L20.5634 6.18355L19.6725 6.6377ZM19.9996 9.7998L20.9996 9.7998L19.9996 9.7998ZM19.9996 12.2002H20.9996H19.9996ZM19.6725 15.3623L20.5634 15.8164L20.5635 15.8163L19.6725 15.3623ZM18.3619 16.6729L18.8159 17.5639L18.816 17.5638L18.3619 16.6729ZM4.76819 20.2314L4.06108 19.5243L4.06108 19.5243L4.76819 20.2314ZM3.99963 19.9141L2.99963 19.9141L2.99963 19.915L3.99963 19.9141ZM3.99963 9.7998H2.99963H3.99963ZM4.32678 6.6377L3.43581 6.18364L3.43578 6.1837L4.32678 6.6377ZM5.63831 5.32715L5.18441 4.43609L5.18432 4.43614L5.63831 5.32715ZM7.70674 17.2929L6.99963 16.5858L7.70674 17.2929ZM15.1998 5V6C16.0564 6 16.6387 6.00082 17.0888 6.03763C17.5272 6.07349 17.7515 6.13844 17.9079 6.21816L18.3619 5.32715L18.8159 4.43614C18.3306 4.18887 17.8139 4.09026 17.2518 4.04428C16.7013 3.99926 16.0235 4 15.1998 4V5ZM18.3619 5.32715L17.9079 6.21814C18.284 6.40977 18.5897 6.71554 18.7816 7.09184L19.6725 6.6377L20.5634 6.18355C20.18 5.43135 19.5685 4.81962 18.816 4.43616L18.3619 5.32715ZM19.6725 6.6377L18.7815 7.09168C18.8612 7.24811 18.9261 7.47241 18.962 7.91089C18.9988 8.361 18.9996 8.94335 18.9996 9.7998L19.9996 9.7998L20.9996 9.7998C20.9996 8.97623 21.0004 8.29838 20.9553 7.74787C20.9094 7.18573 20.8108 6.66899 20.5635 6.18371L19.6725 6.6377ZM19.9996 9.7998H18.9996V12.2002H19.9996H20.9996V9.7998H19.9996ZM19.9996 12.2002L18.9996 12.2002C18.9996 13.0566 18.9988 13.639 18.962 14.0891C18.9261 14.5276 18.8612 14.7519 18.7815 14.9083L19.6725 15.3623L20.5635 15.8163C20.8108 15.331 20.9094 14.8143 20.9553 14.2521C21.0004 13.7016 20.9996 13.0238 20.9996 12.2002L19.9996 12.2002ZM19.6725 15.3623L18.7816 14.9082C18.5897 15.2845 18.284 15.5902 17.9079 15.7819L18.3619 16.6729L18.816 17.5638C19.5685 17.1804 20.18 16.5686 20.5634 15.8164L19.6725 15.3623ZM18.3619 16.6729L17.9079 15.7818C17.7515 15.8616 17.5272 15.9265 17.0888 15.9624C16.6387 15.9992 16.0564 16 15.1998 16V17V18C16.0235 18 16.7013 18.0007 17.2518 17.9557C17.8139 17.9097 18.3306 17.8111 18.8159 17.5639L18.3619 16.6729ZM15.1998 17V16H8.41385V17V18H15.1998V17ZM7.70674 17.2929L6.99963 16.5858L4.06108 19.5243L4.76819 20.2314L5.4753 20.9386L8.41385 18L7.70674 17.2929ZM4.76819 20.2314L4.06108 19.5243C4.40577 19.1796 4.99918 19.421 4.99963 19.9131L3.99963 19.9141L2.99963 19.915C3.00083 21.2083 4.56385 21.85 5.4753 20.9386L4.76819 20.2314ZM3.99963 19.9141H4.99963V9.7998H3.99963H2.99963V19.9141H3.99963ZM3.99963 9.7998L4.99963 9.7998C4.99963 8.94335 5.00046 8.361 5.03727 7.91089C5.07313 7.47241 5.13809 7.24811 5.21779 7.09169L4.32678 6.6377L3.43578 6.1837C3.18851 6.66899 3.0899 7.18573 3.04392 7.74787C2.9989 8.29838 2.99963 8.97623 2.99963 9.7998L3.99963 9.7998ZM4.32678 6.6377L5.21775 7.09175C5.40919 6.71611 5.7154 6.41019 6.0923 6.21815L5.63831 5.32715L5.18432 4.43614C4.43238 4.81927 3.81963 5.4305 3.43581 6.18364L4.32678 6.6377ZM5.63831 5.32715L6.0922 6.2182C6.24867 6.1385 6.47304 6.07353 6.91154 6.03766C7.36165 6.00084 7.94401 6 8.80042 6V5V4C7.97683 4 7.29899 3.99929 6.74848 4.04432C6.18634 4.09031 5.66965 4.18892 5.18441 4.43609L5.63831 5.32715ZM8.80042 5V6H15.1998V5V4H8.80042V5ZM8.41385 17V16C7.88341 16 7.37471 16.2107 6.99963 16.5858L7.70674 17.2929L8.41385 18L8.41385 18V17Z"
                fill="white"
            />
            <path d="M8 9L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 13L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ColorModeIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
            <path
                d="M18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12C3 14.3869 3.94821 16.6761 5.63604 18.364L12 12L18.364 5.63604Z"
                fill="white"
                fillOpacity="0.9"
            />
        </svg>
    );
}

function SignOutIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8 18.9282C9.21615 19.6303 10.5957 20 12 20C13.4043 20 14.7838 19.6303 16 18.9282C17.2162 18.2261 18.2261 17.2162 18.9282 16C19.6303 14.7838 20 13.4043 20 12C20 10.5957 19.6303 9.21615 18.9282 8C18.2261 6.78385 17.2162 5.77394 16 5.0718C14.7838 4.36965 13.4043 4 12 4C10.5957 4 9.21615 4.36965 8 5.0718"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.9"
            />
            <path
                d="M2 12L1.21913 11.3753L0.719375 12L1.21913 12.6247L2 12ZM11 13C11.5523 13 12 12.5523 12 12C12 11.4477 11.5523 11 11 11V12V13ZM6 7L5.21913 6.3753L1.21913 11.3753L2 12L2.78087 12.6247L6.78087 7.6247L6 7ZM2 12L1.21913 12.6247L5.21913 17.6247L6 17L6.78087 16.3753L2.78087 11.3753L2 12ZM2 12V13H11V12V11H2V12Z"
                fill="white"
                fillOpacity="0.9"
            />
        </svg>
    );
}

function ExpandDownIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 9L12 15L6 9" stroke="white" strokeWidth="2" strokeOpacity="0.9" />
        </svg>
    );
}

function PaperClipIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M11 7V15C11 16.1046 11.8954 17 13 17C14.1046 17 15 16.1046 15 15V7C15 4.79086 13.2091 3 11 3C8.79086 3 7 4.79086 7 7V15C7 18.3137 9.68629 21 13 21C16.3137 21 19 18.3137 19 15V10"
                stroke="#3D2D4C"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function SendIcon() {
    return (
        <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 17L20 11L26 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 11.5V29" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}