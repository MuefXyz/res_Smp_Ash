'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { io, Socket } from 'socket.io-client';

export default function SocketTest() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : `${window.location.protocol}//${window.location.hostname}:3000`;
    
    console.log('🚀 Attempting to connect to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      path: '/api/socketio',
      transports: ['polling'],
      timeout: 10000,
      reconnection: false,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server');
      setConnected(true);
      setConnectionStatus('Connected');
      setMessages(prev => [...prev, `✅ Connected to server (ID: ${newSocket.id})`]);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server:', reason);
      setConnected(false);
      setConnectionStatus(`Disconnected: ${reason}`);
      setMessages(prev => [...prev, `❌ Disconnected: ${reason}`]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      setConnectionStatus(`Connection Error: ${error.message}`);
      setMessages(prev => [...prev, `🔥 Connection Error: ${error.message}`]);
      
      // Clean up failed connection
      newSocket.disconnect();
    });

    newSocket.on('message', (data) => {
      console.log('Received message:', data);
      setMessages(prev => [...prev, `📨 ${data.text}`]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const testConnection = () => {
    if (socket && connected) {
      socket.emit('join-admin');
      setMessages(prev => [...prev, '📤 Sent join-admin event']);
    }
  };

  const testMessage = () => {
    if (socket && connected) {
      socket.emit('message', { text: 'Test message', senderId: 'test' });
      setMessages(prev => [...prev, '📤 Sent test message']);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Socket.IO Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "destructive"}>
              {connectionStatus}
            </Badge>
            <span className="text-sm text-gray-600">
              Socket ID: {socket?.id || 'N/A'}
            </span>
          </div>

          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={!connected}>
              Test Join Admin
            </Button>
            <Button onClick={testMessage} disabled={!connected}>
              Send Test Message
            </Button>
          </div>

          <div className="border rounded-lg p-4 h-64 overflow-y-auto">
            <h3 className="font-semibold mb-2">Messages:</h3>
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet...</p>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, index) => (
                  <div key={index} className="text-sm font-mono">
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}