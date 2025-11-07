import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication - Echo LMS",
    description: "Sign in to access Echo LMS training platform",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    );
}