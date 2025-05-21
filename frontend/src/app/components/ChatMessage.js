import React from 'react';

export const ChatMessage = ({ message, currentUser, onLike }) => {
  const { _id, nick, text, timestamp } = message;
  const isSystemMessage = nick === 'System';
  const isCurrentUser = nick === currentUser?.nick;

  return (
    <div
      className={`mb-3 max-w-[75%] flex ${
        isSystemMessage
          ? 'justify-center w-full'
          : isCurrentUser
            ? 'ml-auto flex-row-reverse'
            : 'mr-auto'
      }`}
    >
      {!isSystemMessage && (
        <img
          src="/user.png"
          alt="User"
          className="w-7 h-7 rounded-full object-cover border border-gray-300 mt-2 ml-2 mr-2"
        />
      )}
      <div
        className={`p-3 rounded-lg flex-1 ${
          isSystemMessage
            ? 'bg-yellow-200 text-yellow-800 text-sm italic text-center'
            : isCurrentUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
        }`}
      >
        {!isSystemMessage && (
          <p className="font-bold text-sm">
            {nick}{isCurrentUser ? ' (Ty)' : ''}
          </p>
        )}
        <p className="text-base">{text}</p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs opacity-75 text-right">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};