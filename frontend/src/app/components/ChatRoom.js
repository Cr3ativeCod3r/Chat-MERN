import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { authStore } from '../store/authStore';
import { LoadingSpinner } from './LoadingSpinner';
import { ChatMessage } from './ChatMessage';

export const ChatRoom = observer(() => {
  const params = useParams();
  const roomName = params?.roomName;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomDisplayName, setRoomDisplayName] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.getToken() || !roomName) {
      setIsLoading(false);
      if (!authStore.isAuthenticated) router.push('/');
      return;
    }

    socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000');
    const socket = socketRef.current;

    const token = authStore.getToken();
    socket.emit('join_room', { roomName, token });
    setIsLoading(true);

    socket.on('connect', () => {
      console.log('Połączono z serwerem Socket.IO:', socket.id);
    });

    socket.on('joined_room', (data) => {
      setRoomDisplayName(data.roomDisplayName || roomName);
      setUserCount(data.userCount);
      setError('');
      setIsLoading(false);
    });

    socket.on('previous_messages', (prevMessages) => {
      setMessages(prevMessages);
      setIsLoading(false);
    });

    socket.on('new_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('user_joined', (data) => {
      setMessages(prev => [...prev, { _id: Date.now(), nick: 'System', text: `${data.nick} dołączył do pokoju.`, timestamp: new Date() }]);
    });

    socket.on('user_left', (data) => {
      setMessages(prev => [...prev, { _id: Date.now(), nick: 'System', text: `${data.nick} opuścił pokój.`, timestamp: new Date() }]);
    });

    socket.on('room_user_count_update', (data) => {
      if (data.roomName === roomName) {
        setUserCount(data.count);
      }
    });

    socket.on('auth_error', (data) => {
      console.error('Błąd autoryzacji Socket.IO:', data.message);
      setError(`Błąd autoryzacji: ${data.message}. Spróbuj zalogować się ponownie.`);
      authStore.logout();
      router.push('/');
      setIsLoading(false);
    });

    socket.on('error_message', (data) => {
      console.error('Błąd serwera czatu:', data.message);
      setError(data.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Rozłączono z serwerem Socket.IO:', reason);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomName, authStore.isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() && socketRef.current && authStore.getToken()) {
      socketRef.current.emit('send_message', {
        roomName,
        text: inputText,
        token: authStore.getToken(),
      });
      setInputText('');
    }
  };

  const handleSendLike = () => {
    if (socketRef.current && authStore.getToken()) {
      socketRef.current.emit('send_message', {
        roomName,
        text: '👍',
        token: authStore.getToken(),
      });
    }
  };

  if (!authStore.isAuthenticated && !authStore.loading) {
    return <p className="text-center text-red-500">Musisz być zalogowany, aby korzystać z czatu.</p>;
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!roomName) return <p className="text-center">Nie wybrano pokoju.</p>;


  return (
    <div className="flex flex-col h-[85vh] bg-white shadow-xl rounded-lg w-[80vw] ">
      <header className="bg-gray-700 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">
          Pokój: {roomDisplayName || roomName} ({userCount} {userCount === 1 ? 'osoba' : userCount > 1 && userCount < 5 ? 'osoby' : 'osób'})
        </h2>
      </header>

      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        {messages.map((msg) => (
          <ChatMessage
            key={msg._id || msg.timestamp}
            message={msg}
            currentUser={authStore.user}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-100 rounded-b-lg">
        <div className="flex">
          <button
            type="button"
            onClick={handleSendLike}
            className=" text-white p-2  focus:ring-blue-500 disabled:bg-gray-400 curosor pointer text-2xl cursor-pointer"
            disabled={!authStore.isAuthenticated}
            title="Wyślij szybki like"
          >
            <span className=' hover:scale-125 '>👍</span>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!authStore.isAuthenticated}
          />

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            disabled={!authStore.isAuthenticated || !inputText.trim()}
          >
            Wyślij
          </button>
        </div>
      </form>
    </div>
  );
});