'use client'

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useRouter } from 'next/navigation';
import { authStore } from '../store/authStore'; 

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
);

const UserProfile = observer(() => {
    const router = useRouter();
    const [newNick, setNewNick] = useState('');
    const [isEditingNick, setIsEditingNick] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => {
        if (!authStore.loading && !authStore.isAuthenticated) {
            router.push('/');
        }
        if (authStore.user && authStore.user.nick) {
            setNewNick(authStore.user.nick);
        }
    }, [authStore.isAuthenticated, authStore.loading, authStore.user, router]);

    const handleUpdateNick = async (e) => {
        e.preventDefault();
        if (!newNick.trim()) {
            setError('Nick nie może być pusty.');
            return;
        }
        if (newNick.trim() === authStore.user?.nick) {
            setIsEditingNick(false);
            setError('');
            setSuccessMessage('');
            return;
        }

        setApiLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const token = authStore.getToken();
            const response = await fetch(`${backendUrl}/api/auth/profile/nick`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    nick: newNick.trim(),
                    email: authStore.user?.email // dodaj email do body
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Nie udało się zaktualizować nicku.');
            }

            if (authStore.login && data.token && data.nick) {
                 authStore.login(data.token, { _id: data._id, email: data.email, nick: data.nick });
            } else if (authStore.user) { 
                 authStore.user.nick = data.nick;
                 if(data.token && authStore.setToken) authStore.setToken(data.token);
            }

            setSuccessMessage('Nick został pomyślnie zaktualizowany.');
            setIsEditingNick(false);
        } catch (err) {
            setError(err.message || 'Wystąpił błąd serwera.');
        } finally {
            setApiLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.')) {
            return;
        }

        setApiLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const token = authStore.getToken();
            const response = await fetch(`${backendUrl}/api/auth/profile`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Nie udało się usunąć konta.');
            }

            setSuccessMessage('Konto zostało pomyślnie usunięte. Zostaniesz wylogowany.');
            authStore.logout(); 
            setTimeout(() => {
                router.push('/'); 
            }, 2000);

        } catch (err) {
            setError(err.message || 'Wystąpił błąd serwera.');
        } finally {
            setApiLoading(false);
        }
    };

    if (authStore.loading) {
        return <LoadingSpinner />;
    }

    if (!authStore.isAuthenticated || !authStore.user) {
        return <div className="p-6 text-center">Musisz być zalogowany, aby zobaczyć tę stronę.</div>;
    }

    return (
        <div className="py-12 px-4min-h-screen">
            <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-8">
                    <h2 className="text-2xl font-semibold text-white">Profil Użytkownika</h2>
                </div>

                <div className="p-8 space-y-6">
                    {error && <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-md shadow-sm">{error}</div>}
                    {successMessage && <div className="p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded-md shadow-sm">{successMessage}</div>}

                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1 text-lg text-gray-800">{authStore.user.email}</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-sm font-medium text-gray-500">Nick</h3>
                        {!isEditingNick ? (
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-lg text-gray-800">{authStore.user.nick}</p>
                                <button
                                    onClick={() => {
                                        setNewNick(authStore.user?.nick || '');
                                        setIsEditingNick(true);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded-md hover:bg-blue-50 transition-colors"
                                >
                                    Edytuj Nick
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateNick} className="mt-2 space-y-3">
                                <input
                                    type="text"
                                    value={newNick}
                                    onChange={(e) => setNewNick(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    placeholder="Wpisz nowy nick"
                                    required
                                    minLength={3}
                                />
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={apiLoading || !newNick.trim() || newNick.trim() === authStore.user?.nick}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        {apiLoading ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingNick(false);
                                            setNewNick(authStore.user?.nick || ''); // Resetuj do oryginalnego nicku
                                            setError('');
                                        }}
                                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors shadow-sm"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                  
                </div>
                
            </div>
              <div className="pt-4 flex justify-center">
                        <div className="mt-3 p-2 border-2 border-red-300 rounded-lg bg-red-50 shadow-sm">
                            <p className="text-sm text-red-800 mb-4">
                                Usunięcie konta jest operacją nieodwracalną. Wszystkie Twoje dane zostaną trwale usunięte z systemu.
                            </p>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={apiLoading}
                                className=" sm:w-auto p-2 bg-red-400 text-white font-medium rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:bg-gray-400 cursor-pointer transition-colors shadow-sm mx-auto"
                            >
                                {apiLoading ? 'Usuwanie Konta...' : 'Usuń Moje Konto'}
                            </button>
                        </div>
                    </div>
        </div>
    );
});

export default UserProfile;