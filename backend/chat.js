const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

const STATIC_ROOMS = [
  { id: 'general', name: 'Ogólny' },
  { id: 'tech', name: 'Technologiczny' },
  { id: 'random', name: 'Luźne rozmowy' },
  { id: 'programowanie', name: 'Programowanie' },
  { id: 'web', name: 'Web Dev' },
];

const roomSockets = {};

STATIC_ROOMS.forEach(room => {
  roomSockets[room.id] = new Set();
});

const socketUserDetails = new Map(); 


module.exports = function (io) {
  const verifyTokenAndGetUser = async (token) => {
    if (!token) {
      return { error: 'Brak tokenu autoryzacyjnego', user: null };
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('nick').lean();
      if (!user) {
        return { error: 'Użytkownik nie znaleziony', user: null };
      }
      return { error: null, user: { id: user._id.toString(), nick: user.nick } };
    } catch (err) {
      return { error: 'Nieprawidłowy token', user: null };
    }
  };

  const broadcastRoomStats = () => {
    const roomStats = STATIC_ROOMS.map(room => ({
      id: room.id,
      name: room.name,
      userCount: roomSockets[room.id]?.size || 0
    }));
    
    io.emit('room_stats_update', roomStats);
  };

  const leaveCurrentRoom = (socket) => {
    const userDetails = socketUserDetails.get(socket.id);
    if (userDetails && userDetails.currentRoom) {
      const roomName = userDetails.currentRoom;
      socket.leave(roomName);

      if (roomSockets[roomName]) {
        roomSockets[roomName].delete(socket.id);
      }
      
      userDetails.currentRoom = null;
      socketUserDetails.set(socket.id, userDetails);

      socket.to(roomName).emit('user_left', { nick: userDetails.nick, roomName });

      io.to(roomName).emit('room_user_count_update', {
        roomName,
        count: roomSockets[roomName] ? roomSockets[roomName].size : 0,
      });
      
      broadcastRoomStats();
    }
  };

  io.on('connection', (socket) => {

    socketUserDetails.set(socket.id, { userId: null, nick: null, currentRoom: null });
    socket.emit('available_rooms', STATIC_ROOMS.map(room => ({
      ...room,
      userCount: roomSockets[room.id] ? roomSockets[room.id].size : 0
    })));

    socket.on('request_room_stats', () => {
      const roomStats = STATIC_ROOMS.map(room => ({
        id: room.id,
        name: room.name,
        userCount: roomSockets[room.id]?.size || 0
      }));
      socket.emit('room_stats_update', roomStats);
    });

    socket.on('join_room', async ({ roomName, token }) => {
      const { error, user } = await verifyTokenAndGetUser(token);

      if (error || !user) {
        return socket.emit('auth_error', { message: error || 'Nie udało się zweryfikować użytkownika.' });
      }

      if (!STATIC_ROOMS.find(r => r.id === roomName)) {
        return socket.emit('error_message', { message: 'Pokój nie istnieje.' });
      }
      leaveCurrentRoom(socket);

      socket.join(roomName);
      roomSockets[roomName].add(socket.id);
      socketUserDetails.set(socket.id, { userId: user.id, nick: user.nick, currentRoom: roomName });

      socket.emit('joined_room', {
        roomName,
        roomDisplayName: STATIC_ROOMS.find(r => r.id === roomName)?.name,
        userCount: roomSockets[roomName].size,
      });

      socket.to(roomName).emit('user_joined', { nick: user.nick, roomName });

      io.to(roomName).emit('room_user_count_update', {
        roomName,
        count: roomSockets[roomName].size,
      });
      
      broadcastRoomStats();

      try {
        const messages = await Message.find({ room: roomName })
          .sort({ timestamp: -1 })
          .limit(50) 
          .lean(); 
        socket.emit('previous_messages', messages.reverse()); 

      } catch (dbError) {
        console.error('Błąd pobierania wiadomości:', dbError);
        socket.emit('error_message', { message: 'Nie udało się załadować historii wiadomości.' });
      }
    });

    socket.on('send_message', async ({ roomName, text, token }) => {
      const { error, user } = await verifyTokenAndGetUser(token);

      if (error || !user) {
        return socket.emit('auth_error', { message: error || 'Nie udało się zweryfikować użytkownika przed wysłaniem wiadomości.' });
      }

      const userDetails = socketUserDetails.get(socket.id);
      if (!userDetails || userDetails.currentRoom !== roomName || userDetails.userId !== user.id) {
        return socket.emit('error_message', { message: 'Nie jesteś w tym pokoju lub błąd autoryzacji.' });
      }

      if (!text || text.trim() === '') {
        return socket.emit('error_message', { message: 'Wiadomość nie może być pusta.' });
      }

      try {
        const message = new Message({
          room: roomName,
          user: user.id,
          nick: user.nick,
          text: text.trim(),
          timestamp: new Date(),
        });
        await message.save();

        io.to(roomName).emit('new_message', {
          _id: message._id,
          room: message.room,
          user: message.user, 
          nick: message.nick,
          text: message.text,
          timestamp: message.timestamp,
        });
      } catch (dbError) {
        console.error('Błąd zapisu wiadomości:', dbError);
        socket.emit('error_message', { message: 'Nie udało się wysłać wiadomości.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Klient rozłączony: ${socket.id}`);
      const userDetails = socketUserDetails.get(socket.id);
      if (userDetails && userDetails.currentRoom) {
        leaveCurrentRoom(socket); 
      }
      socketUserDetails.delete(socket.id);
    
      broadcastRoomStats();
    });
  });

  console.log('Socket.IO Chat Server skonfigurowany.');
};