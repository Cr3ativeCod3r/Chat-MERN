'use client'

import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { authStore } from '../store/authStore';
import initialChatRooms from '../rooms';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);

export const Dashboard = observer(() => {
    const router = useRouter();
    const [roomsData, setRoomsData] = useState(
        initialChatRooms.map(room => ({
            ...room,
            participants: 0,
        }))
    );
    const socketRef = useRef(null);

    useEffect(() => {
        if (!authStore.loading && !authStore.isAuthenticated) {
            router.push('/');
        }
    }, [authStore.isAuthenticated, authStore.loading, router]);

    useEffect(() => {
        if (authStore.isAuthenticated && !socketRef.current) {
            const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000', {
                auth: { token: authStore.getToken() },
            });
            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                newSocket.emit('request_room_stats');
            });

            newSocket.on('available_rooms', (rooms) => {
                console.log('Dashboard: Otrzymano dostępne pokoje', rooms);
                setRoomsData(prevRooms =>
                    prevRooms.map(room => {
                        const update = rooms.find(r => r.id === room.id);
                        return update
                            ? { ...room, participants: update.userCount || 0, status: update.status || room.status }
                            : room;
                    })
                );
            });
            
            newSocket.on('room_stats_update', (rooms) => {
                console.log('Dashboard: Otrzymano aktualizację statystyk pokoi', rooms);
                setRoomsData(prevRooms =>
                    prevRooms.map(room => {
                        const update = rooms.find(r => r.id === room.id);
                        return update
                            ? { ...room, participants: update.userCount || 0 }
                            : room;
                    })
                );
            });

            newSocket.on('room_user_count_update', (data) => {
                console.log('Dashboard: Aktualizacja liczby użytkowników', data);
                setRoomsData(prevRooms =>
                    prevRooms.map(room =>
                        room.id === data.roomName ? { ...room, participants: data.count || 0 } : room
                    )
                );
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Dashboard: Rozłączono z Socket.IO:', reason);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Dashboard: Błąd połączenia Socket.IO:', err.message);
                if (err.message.includes('Authentication error') || err.message.includes('Unauthorized')) {
                }
            });

            return () => {
                if (newSocket) {
                    console.log('Dashboard: Rozłączanie Socket.IO');
                    newSocket.disconnect();
                    socketRef.current = null;
                }
            };
        } else if (!authStore.isAuthenticated && socketRef.current) {
            console.log('Dashboard: Użytkownik wylogowany, rozłączanie Socket.IO');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, [authStore.isAuthenticated, authStore.getToken]);

    const handleEnterRoom = (roomId) => {
        router.push(`/chat/${roomId}`);
    };

    if (authStore.loading) {
        return <LoadingSpinner />;
    }

    if (!authStore.isAuthenticated || !authStore.user) {
        return null;
    }

    return (
        <div className="py-12 px-4">
            <div className="max-w-5xl mx-auto">

                <main className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 w-[80vw]">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
                        <h2 className="text-xl font-semibold text-white">Dostępne pokoje</h2>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {roomsData.map(room => (
                            <div key={room.id} className="hover:bg-blue-50 transition-colors duration-200">
                                <div className="p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-xl text-gray-800">{room.name}</h3>
                                            {room.status === 'nieaktywny' && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Nieaktywny</span>
                                            )}
                                            {room.status !== 'nieaktywny' && (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Aktywny</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {room.participants} uczestników online
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleEnterRoom(room.id)}
                                        className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium text-white shadow-sm cursor-pointer ${room.status === 'nieaktywny'
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5 hover:shadow-md'
                                            }`}
                                        disabled={room.status === 'nieaktywny'}
                                    >
                                        Dołącz
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
});

export default Dashboard;