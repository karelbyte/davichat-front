import React, { useState, useEffect, useRef } from 'react';
import { io, /*Socket*/ } from 'socket.io-client';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { FiSend, /*FiSettings*/ } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

type WindowWithTimeout = Window & { loadingTimeout?: ReturnType<typeof setTimeout> };

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  id: string;
  chatOutput: string;
  timestamp: string;
  received: boolean;
}

interface ChatInterfaceProps {
  className?: string;
}

const ChatIA: React.FC<ChatInterfaceProps> = ({ className }) => {
  // Socket.IO para recibir respuestas en tiempo real
  const SEND_WEBHOOK_URL = process.env.NEXT_PUBLIC_SEND_WEBHOOK_URL as string;
  const RECEIVE_WEBHOOK_URL = process.env.NEXT_PUBLIC_RECEIVE_WEBHOOK_URL as string;
  const generateChatId = () => uuidv4();
  const generateMessageId = () => uuidv4();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendWebhookUrl, setSendWebhookUrl] = useState(
    SEND_WEBHOOK_URL
  );
  const [receiveWebhookUrl, setReceiveWebhookUrl] = useState(
    RECEIVE_WEBHOOK_URL
  );
const API_KEY = process.env.NEXT_PUBLIC_API_KEY_IA_CHAT as string;
const IA_SOCKET = process.env.NEXT_PUBLIC_IA_SOCKET as string;

  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, /*setShowSettings*/] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>(() => generateChatId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Conexión a Socket.IO al montar el componente
  useEffect(() => {
    const socketUrl = IA_SOCKET;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('chat-response', (response: ChatResponse) => {
      if (response.id === currentChatId) {
        const botMessage: Message = {
          id: generateMessageId(),
          content: response.chatOutput,
          isUser: false,
          timestamp: new Date(response.timestamp),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        if ((window as WindowWithTimeout).loadingTimeout) {
          clearTimeout((window as WindowWithTimeout).loadingTimeout);
          (window as WindowWithTimeout).loadingTimeout = undefined;
        }
      }
    });
    return () => {
      newSocket.disconnect();
    };
  }, [currentChatId, IA_SOCKET]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const sendMessage = async () => {
    // --- WEBHOOK DE ENVÍO ---
    if (!inputMessage.trim() || isLoading || !sendWebhookUrl) return;
    const chatId = currentChatId;
    const userMessage: Message = {
      id: generateMessageId(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
  const loadingTimeout: ReturnType<typeof setTimeout> = setTimeout(() => setIsLoading(false), 30000);
  (window as WindowWithTimeout).loadingTimeout = loadingTimeout;
    try {
      const messageId = generateMessageId();
      // --- LLAMADA AL WEBHOOK DE ENVÍO ---
      const response = await fetch(sendWebhookUrl, {
        method: 'POST',
        headers: {
          'API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: chatId, messageId, chatInput: userMessage.content }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch {
      setIsLoading(false);
      if ((window as WindowWithTimeout).loadingTimeout) {
        clearTimeout((window as WindowWithTimeout).loadingTimeout);
        (window as WindowWithTimeout).loadingTimeout = undefined;
      }
  }


type WindowWithTimeout = Window & { loadingTimeout?: ReturnType<typeof setTimeout> };
  };

  const startNewChat = () => {
    setCurrentChatId(generateChatId());
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
  <div className={cn('bg-white shadow-lg border-gray-200 w-full h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <img src="/conect.png" alt="Logo" className="w-40 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Davichat IA</h1>
            <p className="text-sm text-gray-700">Asistente IA</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-700">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
               {/* <span className="text-xs text-gray-700">•</span>
             <span className="text-xs text-gray-700">
                Chat ID: {currentChatId.substring(0, 8)}...
              </span>*/}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={startNewChat}
            className="gap-2 !bg-[#e20517] text-white"
          >
            Nuevo Chat
          </Button>
          {/*   <Button
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2 !bg-[#e20517] text-white"
          >
            <FiSettings className="w-4 h-4" />
            Configuración
          </Button>*/}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="m-4 p-4 bg-secondary/50 border border-border rounded-lg animate-slide-up">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Configuración de Webhooks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-700 mb-1 block">Webhook de Envío</label>
              <Input
                placeholder={SEND_WEBHOOK_URL}
                value={sendWebhookUrl}
                onChange={(e) => setSendWebhookUrl(e.target.value)}
                className="bg-chat-input border-border"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 mb-1 block">Webhook de Recepción</label>
              <Input
                placeholder={RECEIVE_WEBHOOK_URL}
                value={receiveWebhookUrl}
                onChange={(e) => setReceiveWebhookUrl(e.target.value)}
                className="bg-chat-input border-border"
                disabled
              />
              <p className="text-xs text-gray-700 mt-1">
                Este webhook recibe respuestas automáticamente desde el backend
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 280px)', scrollbarWidth: 'thin', overscrollBehavior: 'contain' }}>
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse-glow">
                  <img src="/ia.png" alt="Logo" className="w-15 h-15 object-contain" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Bienvenido al Chat IA</h3>
                <p className="text-gray-700">Comienza a chatear</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-12">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex animate-slide-up',
                    message.isUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] p-3 rounded-2xl shadow-soft',
                      message.isUser
                        ? 'bg-chat-bubble-user text-primary-foreground'
                        : 'bg-chat-bubble-bot text-gray-800 border border-border'
                    )}
                  >
                    <p className="text-sm text-gray-800">{message.content}</p>
                    <p className="text-xs mt-1 text-gray-700">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-chat-bubble-bot border border-border p-3 rounded-2xl shadow-soft">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs text-gray-700">Esperando respuesta...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Input
            placeholder={isLoading ? "Esperando respuesta..." : "Escribe tu mensaje..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-chat-input border-border disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatIA;