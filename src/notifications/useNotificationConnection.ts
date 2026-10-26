import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { API_BASE_URL, getSesion } from "../api";
import { parseNotification, type NotificationDto } from "./types";

export interface UseNotificationConnectionOptions {
  enabled: boolean;
  onNotificationReceived: (notification: NotificationDto) => void;
}

export interface NotificationConnection {
  connected: boolean;
}

export function useNotificationConnection({
  enabled,
  onNotificationReceived,
}: UseNotificationConnectionOptions): NotificationConnection {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);

  const onNotificationReceivedRef = useRef(onNotificationReceived);
  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    if (!enabled) return;

    const session = getSesion();
    if (!session?.token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notificaciones`, {
        accessTokenFactory: () => getSesion()?.token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("RecibirNotificacion", (payload: unknown) => {
      try {
        onNotificationReceivedRef.current(parseNotification(payload));
      } catch (error) {
        console.error("[Notifications] Invalid notification received:", error);
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
        console.error("[Notifications] Error connecting to the hub:", error);
        setConnected(false);
      });

    return () => {
      connection.stop().catch(() => {
        // Ignore errors while stopping the connection during cleanup.
      });
      connectionRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}
