import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json(
            { message: "Logout successful" },
            { status: 200 }
        );

        // Clear the auth cookie
        response.cookies.set("auth", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0, // Expire immediately
            path: "/"
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}