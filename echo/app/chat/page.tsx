"use client";

import Chat from "../../modules/component/Chat";
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');

  return <Chat session_id={session_id || undefined} />;
}
