/**
 * Wires up socket.io connections. Admin dashboards join a room named
 * "session:<sessionId>" so they only receive updates for their own session.
 */
export function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.on('watchSession', (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
      }
    });

    socket.on('unwatchSession', (sessionId) => {
      if (sessionId) {
        socket.leave(`session:${sessionId}`);
      }
    });
  });
}
