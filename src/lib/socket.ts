import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join admin room for notifications
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('Client joined admin room:', socket.id);
    });

    // Handle card scan notifications
    socket.on('card-scan', (data: { cardId: string; userId: string; scanType: string; userName: string }) => {
      try {
        // Broadcast to all admin clients
        io.to('admin-room').emit('card-scan-notification', {
          ...data,
          timestamp: new Date().toISOString(),
          message: `${data.userName} melakukan ${data.scanType === 'CHECK_IN' ? 'Check In' : 'Check Out'}`
        });
      } catch (error) {
        console.error('Error handling card-scan event:', error);
        socket.emit('error', { message: 'Failed to process card scan' });
      }
    });
    
    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      try {
        // Echo: broadcast message only the client who send the message
        socket.emit('message', {
          text: `Echo: ${msg.text}`,
          senderId: 'system',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error handling message event:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error for client', socket.id, ':', error);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });

  // Handle server-level errors
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });
};