/**
 * WebSocket Server
 *
 * Real-time updates for opportunities and executions
 *
 * SECURITY MODEL:
 * - Currently NO authentication required (public data only)
 * - All broadcasted data is publicly available (opportunities, executions, proposals)
 * - For production: Consider adding authentication to prevent abuse
 * - Rate limiting handled at Nginx layer (100 req/s per IP)
 *
 * FUTURE IMPROVEMENTS:
 * - Token-based authentication via query parameter (?token=...)
 * - Origin validation to prevent unauthorized domains
 * - Connection rate limiting (max connections per IP)
 * - Message rate limiting (max messages per connection)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createSubscriber } from './redis';
import { WSMessage } from '../types';

const subscriber = createSubscriber();

export function initWebSocketServer(wss: WebSocketServer): void {
  console.log('Initializing WebSocket server...');

  // Subscribe to Redis channels
  subscriber.subscribe('opportunities', 'executions', 'proposals');

  // Handle Redis messages
  subscriber.on('message', (channel, message) => {
    console.log(`Received message on channel ${channel}`);

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const wsMessage: WSMessage = {
          type: channel as any,
          data: JSON.parse(message),
        };
        client.send(JSON.stringify(wsMessage));
      }
    });
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected');

    // Send welcome message
    const welcome: WSMessage = {
      type: 'ping',
      data: { message: 'Connected to MEVrebels WebSocket Server' },
    };
    ws.send(JSON.stringify(welcome));

    // Handle incoming messages from client
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;
        console.log('Received from client:', message);

        // Handle ping/pong
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', data: {} }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('✅ WebSocket server initialized');
}
