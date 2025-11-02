"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Chat() {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                // Clear the message and stay on current page
                setMessage("");
                break;
            case "AI chat":
                router.push("/chat");
                break;
            default:
                break;
        }
    };

    const quickActions = ["Article", "Weather", "Sport", "Press", "Food", "Plants", "Suggest something"];

    const navItems = [
        { icon: DashboardIcon, label: "Dashboard", active: false },
        { icon: AddIcon, label: "Start new chat", active: false },
        { icon: CommentIcon, label: "AI chat", active: true },
    ];

    return (
        <div className="flex h-screen bg-gradient-to-br from-[#7B93DB] via-[#8DA8E3] to-[#9DB3E8]">
            {/* Mobile Menu Button */}
            <button
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8] text-white shadow-lg md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-[#B7BCC9] bg-gradient-to-b from-[#7B93DB]/20 to-[#9DB3E8]/20 backdrop-blur-sm px-4 py-6 transition-transform duration-300 ease-in-out md:static md:z-auto md:w-60 md:translate-x-0 lg:w-64 lg:px-6 lg:py-8 xl:w-[267px] xl:px-7 xl:py-10 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}>
                {/* Close button for mobile */}
                <button
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#3D2D4C] hover:bg-gray-200 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>

                <div className="flex flex-col gap-4 lg:gap-[18px]">
                    {/* Logo */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-['IBM_Plex_Mono'] text-2xl font-bold leading-8 text-[#3D2D4C] sm:text-3xl sm:leading-10 lg:text-4xl lg:leading-12 xl:text-[40px] xl:leading-[60px]">
                            Soft GPT
                        </h1>
                        <div className="h-px bg-[#B7BCC9]"></div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-2 lg:gap-2.5">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                className={`flex items-center gap-3 rounded px-3 py-3 text-left transition-colors hover:bg-opacity-80 lg:gap-2.5 lg:px-2.5 lg:py-2.5 ${
                                    item.active ? "bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8]" : "hover:bg-gradient-to-r hover:from-[#7B93DB]/30 hover:to-[#9DB3E8]/30"
                                }`}
                                onClick={() => handleNavigation(item.label)}
                            >
                                <item.icon active={item.active} />
                                <span
                                    className={`font-['Roboto'] text-base font-bold leading-6 lg:text-lg lg:leading-7 ${
                                        item.active ? "text-white" : "text-[#3D2D4C]"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* User Profile */}
                <div className="flex flex-col gap-3 lg:gap-4">
                    <div className="h-px bg-[#B7BCC9]"></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-[13px]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8]">
                                <span className="font-['Source_Sans_3'] text-base font-semibold leading-6 text-white lg:text-lg lg:leading-7">
                                    A
                                </span>
                            </div>
                            <span className="font-['Roboto'] text-base font-bold leading-6 text-[#3D2D4C] lg:text-lg lg:leading-7">
                                Alexandra
                            </span>
                        </div>
                        <ExpandDownIcon />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden md:ml-0">
                {/* Header */}
                <header className="flex justify-end gap-2 px-4 py-4 sm:px-6 sm:py-6 lg:px-12 lg:py-12 xl:px-[70px] xl:py-[70px]">
                    <button className="flex h-6 w-6 items-center justify-center transition-transform hover:scale-110">
                        <ColorModeIcon />
                    </button>
                    <button 
                        onClick={handleSignOut}
                        className="flex h-6 w-6 items-center justify-center transition-transform hover:scale-110"
                        title="Sign Out"
                    >
                        <SignOutIcon />
                    </button>
                    <div className="flex h-6 w-6 items-center justify-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8]">
                            <span className="font-['Roboto'] text-xs font-bold leading-3.5 text-white">
                                AC
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex flex-1 items-center justify-center overflow-auto px-4 pb-6 sm:px-6 sm:pb-8 lg:px-12 xl:px-[292px]">
                    <div className="relative w-full max-w-6xl rounded bg-white/90 backdrop-blur-sm border border-[#9DB3E8]/30 shadow-[0_8px_32px_0_rgba(123,147,219,0.2)] p-6 sm:p-8 lg:p-12 xl:h-[850px] xl:max-w-[1174px]">
                        {/* Centered Content */}
                        <div className="flex h-full flex-col items-center justify-center gap-6 lg:gap-8 xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[956px] xl:-translate-x-1/2 xl:-translate-y-1/2">
                            {/* Title */}
                            <h2 className="font-['IBM_Plex_Mono'] text-center text-2xl font-bold leading-tight text-[#3D2D4C] sm:text-3xl sm:leading-9 lg:text-4xl lg:leading-[50px] xl:text-5xl xl:leading-[70px]">
                                What can I help with?
                            </h2>

                            {/* Input Box */}
                            <div className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-[#7B93DB]/50 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-lg sm:px-5 sm:py-4 lg:gap-2.5 xl:px-[27px] xl:py-[21px]">
                                <input
                                    type="text"
                                    placeholder="Message Soft GPT"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-1 font-['Roboto'] text-sm leading-5 text-[#3D2D4C] outline-none placeholder:text-[#3D2D4C]/70 bg-transparent sm:text-base sm:leading-6 lg:text-lg lg:leading-7"
                                />
                                <div className="flex items-center gap-2 lg:gap-2.5">
                                    <button className="flex h-6 w-6 items-center justify-center transition-transform hover:scale-110">
                                        <PaperClipIcon />
                                    </button>
                                    <button className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8] transition-all hover:shadow-lg hover:scale-105 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                                        <SendIcon />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 xl:gap-4">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="flex h-8 items-center justify-center gap-2 rounded-[30px] border border-[#7B93DB]/40 bg-white/60 backdrop-blur-sm px-3 text-xs transition-all hover:border-[#7B93DB] hover:bg-gradient-to-r hover:from-[#7B93DB]/10 hover:to-[#9DB3E8]/10 hover:shadow-md sm:h-9 sm:px-4 sm:text-sm lg:h-10 lg:gap-2.5 lg:px-2.5 lg:text-base"
                                    >
                                        <span className="font-['Roboto'] text-center leading-5 text-[#7B93DB] lg:leading-[25px]">
                                            {action}
                                        </span>
                                    </button>
                                ))}
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
                    fill={active ? "white" : "#3D2D4C"}
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
                stroke={active ? "white" : "#3D2D4C"}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M15.7279 12.7279L9.72791 12.7279"
                stroke={active ? "white" : "#3D2D4C"}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
            <path
                d="M17.5844 5.75015C14.2698 3.43752 9.67507 3.75998 6.71753 6.71752C3.39807 10.037 3.39807 15.4189 6.71753 18.7383C10.037 22.0578 15.4189 22.0578 18.7383 18.7383C21.6959 15.7808 22.0183 11.186 19.7057 7.87147"
                stroke={active ? "white" : "#3D2D4C"}
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
            <circle cx="12" cy="12" r="9" stroke="#3D2D4C" strokeWidth="2" />
            <path
                d="M18.364 5.63604C16.6761 3.94821 14.3869 3 12 3C9.61305 3 7.32387 3.94821 5.63604 5.63604C3.94821 7.32387 3 9.61305 3 12C3 14.3869 3.94821 16.6761 5.63604 18.364L12 12L18.364 5.63604Z"
                fill="#3D2D4C"
            />
        </svg>
    );
}

function SignOutIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8 18.9282C9.21615 19.6303 10.5957 20 12 20C13.4043 20 14.7838 19.6303 16 18.9282C17.2162 18.2261 18.2261 17.2162 18.9282 16C19.6303 14.7838 20 13.4043 20 12C20 10.5957 19.6303 9.21615 18.9282 8C18.2261 6.78385 17.2162 5.77394 16 5.0718C14.7838 4.36965 13.4043 4 12 4C10.5957 4 9.21615 4.36965 8 5.0718"
                stroke="#3D2D4C"
                strokeWidth="2"
            />
            <path
                d="M2 12L1.21913 11.3753L0.719375 12L1.21913 12.6247L2 12ZM11 13C11.5523 13 12 12.5523 12 12C12 11.4477 11.5523 11 11 11V12V13ZM6 7L5.21913 6.3753L1.21913 11.3753L2 12L2.78087 12.6247L6.78087 7.6247L6 7ZM2 12L1.21913 12.6247L5.21913 17.6247L6 17L6.78087 16.3753L2.78087 11.3753L2 12ZM2 12V13H11V12V11H2V12Z"
                fill="#3D2D4C"
            />
        </svg>
    );
}

function ExpandDownIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 9L12 15L6 9" stroke="#3D2D4C" strokeWidth="2" />
        </svg>
    );
}

function PaperClipIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 17L20 11L26 17" stroke="#F0F7FB" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 11.5V29" stroke="#F0F7FB" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}