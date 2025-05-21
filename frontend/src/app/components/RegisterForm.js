'use client';

import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { useRouter } from 'next/navigation';
import { authStore } from '../store/authStore';

export const RegisterForm = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nick, setNick] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setFormError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setFormError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setFormError('');
    const success = await authStore.register(email, password, nick);

    if (success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-green-50 to-gray-100 p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 hover:shadow-green-200 ">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">📝 Rejestracja</h2>

      {(authStore.error || formError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError || authStore.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-400 focus:outline-none shadow-sm transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nick">
            Nick
          </label>
          <input
            id="nick"
            type="text"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-400 focus:outline-none shadow-sm transition"
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-400 focus:outline-none shadow-sm transition"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
            Powtórz hasło
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-400 focus:outline-none shadow-sm transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 cursor-pointer"
          disabled={authStore.loading}
        >
          {authStore.loading ? 'Rejestracja...' : 'Zarejestruj się'}
        </button>
      </form>
    </div>
  );
});