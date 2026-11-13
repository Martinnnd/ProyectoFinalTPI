import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { API_BASE_URL, getSesion } from "../api";
import { parseChatMessage, parseChatMessages, type ChatMessageDto } from "./types";

export interface UseChatConnectionOptions {
  enabled: boolean;
  onMessageReceived: (message: ChatMessageDto) => void;
  onMessageSent: (message: ChatMessageDto) => void;
}

export interface ChatConnection {
  connected: boolean;
  sendMessage: (recipientId: number, content: string) => Promise<void>;
  getHistory: (otherUserId: number) => Promise<ChatMessageDto[]>;
}

export function useChatConnection({
  enabled,
  onMessageReceived,
  onMessageSent,
}: UseChatConnectionOptions): ChatConnection {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);

  const onReceivedRef = useRef(onMessageReceived);
  const onSentRef = useRef(onMessageSent);
  useEffect(() => {
    onReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);
  useEffect(() => {
    onSentRef.current = onMessageSent;
  }, [onMessageSent]);

  useEffect(() => {
    if (!enabled) return;

    const session = getSesion();
    if (!session?.token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, {
        accessTokenFactory: () => getSesion()?.token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("RecibirMensaje", (payload: unknown) => {
      try {
        onReceivedRef.current(parseChatMessage(payload));
      } catch (error) {
        console.error("[Chat] Invalid received message:", error);
      }
    });

    connection.on("MensajeEnviado", (payload: unknown) => {
      try {
        onSentRef.current(parseChatMessage(payload));
      } catch (error) {
        console.error("[Chat] Invalid sent message:", error);
      }
    });

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    connectionRef.current = connection;

    connection
      .start()
      .then(() => setConnected(true))
      .catch((error) => {
        console.error("[Chat] Error connecting to the hub:", error);
        setConnected(false);
      });

    return () => {
      connection.stop().catch(() => {
        /* Ignore errors while stopping during cleanup. */
      });
      connectionRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const sendMessage = useCallback(async (recipientId: number, content: string): Promise<void> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      throw new Error("No estás conectado al chat. Intentá de nuevo en unos segundos.");
    }
    await connection.invoke("EnviarMensaje", recipientId, content);
  }, []);

  const getHistory = useCallback(async (otherUserId: number): Promise<ChatMessageDto[]> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return [];
    }
    const history = await connection.invoke<unknown>("ObtenerHistorial", otherUserId);
    return parseChatMessages(history);
  }, []);

  return { connected, sendMessage, getHistory };
}
