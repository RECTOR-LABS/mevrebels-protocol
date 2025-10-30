/**
 * WebSocket Server
 *
 * Real-time updates for opportunities and executions
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
