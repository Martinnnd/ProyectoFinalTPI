"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Chat from "../../../components/Chat";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useEra } from "../../../context/EraContext";
import { getUserByUsername } from "../../../chat/chatApi";
import { LoaderCircle } from "lucide-react";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conParam = searchParams.get("con");

  const { session, status } = useAuth();
  const { period } = useEra();

  const [chatWith, setChatWith] = useState<{ userId: number; username: string; ts: number } | null>(
    null,
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login?returnTo=/chat");
      return;
    }

    if (conParam && conParam !== session.username) {
      getUserByUsername(conParam)
        .then((user) => {
          setChatWith({ userId: user.userId, username: user.username, ts: Date.now() });
        })
        .catch((err) => {
          console.warn("No se pudo iniciar chat con usuario:", err);
        });
    }
  }, [conParam, session, status, router]);

  if (status === "loading") {
    return (
      <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
        <LoaderCircle size={28} className="animate-spin" />
        <span>Cargando chat…</span>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="chat-page-host">
      <Chat
        decade={period.decade}
        fullPage={true}
        onOpenPage={() => {}}
        hidden={false}
        chatWith={chatWith}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
          <LoaderCircle size={28} className="animate-spin" />
          <span>Cargando chat…</span>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
