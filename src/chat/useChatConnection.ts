import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { API_BASE_URL, getSesion } from '../api';
import type { MensajeChatDto } from './types';

export interface UseChatConnectionOpciones {
  /** Cuando es false, la conexión no se establece (p.ej. usuario no logueado). */
  activo: boolean;
  /** Se invoca al recibir un mensaje de otro usuario. */
  onMensajeRecibido: (mensaje: MensajeChatDto) => void;
  /** Se invoca cuando el servidor confirma que el mensaje propio fue entregado. */
  onMensajeEnviado: (mensaje: MensajeChatDto) => void;
}

export interface ChatConexion {
  /** True cuando la conexión WebSocket está establecida. */
  connected: boolean;
  /**
   * Envía un mensaje privado. Lanza si el destinatario está offline o el
   * contenido está vacío. El error viene directamente del servidor (HubException).
   */
  enviarMensaje: (destinatarioId: number, contenido: string) => Promise<void>;
  /**
   * Obtiene el historial de mensajes no expirados con otro usuario.
   * Devuelve [] si la conexión no está establecida.
   */
  obtenerHistorial: (otroUsuarioId: number) => Promise<MensajeChatDto[]>;
}

export function useChatConnection({
  activo,
  onMensajeRecibido,
  onMensajeEnviado,
}: UseChatConnectionOpciones): ChatConexion {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connected, setConnected] = useState(false);

  // Refs para los callbacks: evitan que el efecto de conexión se re-ejecute
  // cuando el componente padre re-renderiza con nuevas funciones inline.
  const onRecibidoRef = useRef(onMensajeRecibido);
  const onEnviadoRef = useRef(onMensajeEnviado);
  useEffect(() => { onRecibidoRef.current = onMensajeRecibido; }, [onMensajeRecibido]);
  useEffect(() => { onEnviadoRef.current = onMensajeEnviado; }, [onMensajeEnviado]);

  useEffect(() => {
    if (!activo) return;

    const sesion = getSesion();
    if (!sesion?.token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, {
        // SignalR necesita el token en la query string para WebSockets.
        // accessTokenFactory lo gestiona automáticamente.
        accessTokenFactory: () => getSesion()?.token ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('RecibirMensaje', (mensaje: MensajeChatDto) => {
      onRecibidoRef.current(mensaje);
    });

    connection.on('MensajeEnviado', (mensaje: MensajeChatDto) => {
      onEnviadoRef.current(mensaje);
    });

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    connectionRef.current = connection;

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => {
        console.error('[Chat] Error al conectar con el hub:', err);
        setConnected(false);
      });

    return () => {
      connection.stop().catch(() => { /* ignorar errores al desconectar */ });
      connectionRef.current = null;
      setConnected(false);
    };
  }, [activo]);

  const enviarMensaje = useCallback(
    async (destinatarioId: number, contenido: string): Promise<void> => {
      const conn = connectionRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected) {
        throw new Error('No estás conectado al chat. Intentá de nuevo en unos segundos.');
      }
      // Si el destinatario está offline, el servidor lanza HubException.
      // SignalR lo propaga como un Error normal con el mensaje del servidor.
      await conn.invoke('EnviarMensaje', destinatarioId, contenido);
    },
    [],
  );

  const obtenerHistorial = useCallback(
    async (otroUsuarioId: number): Promise<MensajeChatDto[]> => {
      const conn = connectionRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected) {
        return [];
      }
      return conn.invoke<MensajeChatDto[]>('ObtenerHistorial', otroUsuarioId);
    },
    [],
  );

  return { connected, enviarMensaje, obtenerHistorial };
}
