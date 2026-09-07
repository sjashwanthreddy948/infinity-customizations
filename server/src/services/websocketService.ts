import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  businessId: string;
}

const clients: Map<WebSocket, ClientConnection> = new Map();

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized: Missing token');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
      clients.set(ws, {
        ws,
        userId: decoded.userId,
        businessId: decoded.businessId
      });

      // Send welcome / ack message
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: { message: 'Real-time synchronization active', businessId: decoded.businessId }
      }));

      ws.on('close', () => {
        clients.delete(ws);
      });

      ws.on('error', () => {
        clients.delete(ws);
      });
    } catch (err) {
      ws.close(4002, 'Unauthorized: Invalid token');
    }
  });

  return wss;
}

/**
 * Broadcast an event to all connected partners belonging to the specified business
 */
export function broadcastToBusiness(businessId: string, event: { type: string; payload: any }): void {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.businessId === businessId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
