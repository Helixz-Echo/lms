import Chat from "@/components/chat";
import Uploader from "@/components/uploader";

export default function Home() {
  return (
    <div className="w-full max-w-4xl mx-auto my-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">RAG Web App</h1>
        <p className="mt-2 text-lg text-gray-600">Upload a CSV and chat with your data.</p>
      </div>
      <Uploader />
      <div className="h-[600px] border rounded-lg">
        <Chat />
      </div>
    </div>
  );
}