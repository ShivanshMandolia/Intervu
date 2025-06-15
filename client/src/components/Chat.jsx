// src/components/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/auth/AuthContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

const Chat = () => {
  const { chatMessages, sendChatMessage } = useRoom();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (messageUser) => {
    return messageUser?._id === user?._id;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${isOwnMessage(msg.sender) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                isOwnMessage(msg.sender)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}>
                {!isOwnMessage(msg.sender) && (
                  <div className="text-xs text-gray-300 mb-1">
                    {msg.sender?.username || msg.sender?.email || 'Unknown User'}
                  </div>
                )}
                <div className="text-sm">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  isOwnMessage(msg.sender) ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-1">
          {message.length}/500 characters
        </div>
      </div>
    </div>
  );
};

export default Chat;