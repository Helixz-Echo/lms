import Login from "@/modules/component/Login";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Login redirectTo="/chat" />
        </main>
    );
}
