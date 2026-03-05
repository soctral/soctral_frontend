import React, { useEffect, useState, useRef } from 'react';
import { X, Send } from 'lucide-react';
import chatService from '../../services/chatService';

export default function SupportChatModal({ isOpen, onClose, channelType, channelId }) {
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messageNewUnsub = useRef(null);

  useEffect(() => {
    if (!isOpen || !channelId || !channelType) {
      setChannel(null);
      setMessages([]);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    chatService
      .watchSupportChannel(channelType, channelId)
      .then((ch) => {
        if (!mounted) return;
        setChannel(ch);
        setMessages(ch.state?.messages?.slice() || []);
        setLoading(false);
        messageNewUnsub.current = ch.on('message.new', () => {
          if (mounted && ch.state?.messages) {
            setMessages(ch.state.messages.slice());
          }
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to open support chat');
        setLoading(false);
      });
    return () => {
      mounted = false;
      if (messageNewUnsub.current) {
        try {
          messageNewUnsub.current();
        } catch (_) {}
      }
    };
  }, [isOpen, channelId, channelType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = (inputText || '').trim();
    if (!text || !channel) return;
    setInputText('');
    try {
      await channel.sendMessage({ text });
    } catch (err) {
      console.error('Support chat send failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0D0D0D] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Support / Appeal</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
            Loading chat...
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-8 text-red-400 text-center">
            {error}
          </div>
        )}

        {!loading && !error && channel && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Start the conversation. Support will reply here.
                </p>
              )}
              {messages.map((m) => {
                const isSupport = m.user?.id === 'support-agent';
                return (
                  <div
                    key={m.id}
                    className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        isSupport
                          ? 'bg-white/10 text-gray-200'
                          : 'bg-primary/30 text-white'
                      }`}
                    >
                      <div className="text-xs opacity-80 mb-0.5">
                        {m.user?.name || m.user?.id || 'User'}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.text || ''}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
