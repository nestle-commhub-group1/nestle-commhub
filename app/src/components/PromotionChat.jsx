import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, MessageCircle } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config/api';

const PromotionChat = ({ promotionId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && promotionId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, promotionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/promo/${promotionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/messages/promo/${promotionId}`, {
        message: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchMessages();
      setLoading(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-nestle-brown text-white">
        <div className="flex items-center space-x-3">
          <MessageCircle size={20} />
          <div>
            <h3 className="text-[16px] font-black uppercase tracking-wider">Campaign Chat</h3>
            <p className="text-[11px] font-bold opacity-70">Promotion ID: {promotionId.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
            <MessageCircle size={48} />
            <p className="text-sm font-bold italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user._id;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[20px] p-4 ${isMe ? 'bg-[#3D2B1F] text-white' : 'bg-white border border-gray-100 text-[#2C1810] shadow-sm'}`}>
                  {!isMe && <p className="text-[10px] font-black uppercase tracking-widest text-nestle-brown mb-1">{msg.senderName}</p>}
                  <p className="text-[14px] font-medium leading-relaxed">{msg.message}</p>
                  <p className={`text-[9px] mt-2 font-bold uppercase tracking-tighter ${isMe ? 'text-white/50 text-right' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type your message..."
            className="w-full bg-gray-50 border border-gray-100 rounded-[16px] pl-5 pr-14 py-4 text-[14px] font-bold focus:bg-white focus:ring-2 focus:ring-nestle-brown/10 outline-none transition-all transition-all"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-nestle-brown text-white rounded-[12px] hover:bg-[#2c1f16] shadow-sm disabled:opacity-30 disabled:hover:bg-nestle-brown transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromotionChat;
