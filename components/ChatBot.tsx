
import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, CloseIcon, SendIcon, SearchIcon } from './icons';
import { ChatMessage, GroundingSource } from '../types';
import { createChat, groundedSearch } from '../services/geminiService';
import { Chat } from '@google/genai';


const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(false);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            chatRef.current = createChat('Eres un asistente de pádel amigable y conocedor. Proporciona respuestas claras y concisas en español.');
            setMessages([{ sender: 'bot', text: '¡Hola! Soy tu asistente de pádel. ¿En qué puedo ayudarte hoy?' }]);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (useSearch) {
                const response = await groundedSearch(input);
                const botMessage: ChatMessage = { sender: 'bot', text: response.text, sources: response.sources };
                setMessages(prev => [...prev, botMessage]);
            } else {
                if (!chatRef.current) throw new Error("Chat not initialized");
                const response = await chatRef.current.sendMessage({ message: input });
                const botMessage: ChatMessage = { sender: 'bot', text: response.text };
                 setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { sender: 'bot', text: 'Lo siento, he encontrado un problema. Inténtalo de nuevo.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => (
        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-brand-primary text-brand-dark' : 'bg-brand-gray'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                         <h4 className="font-semibold text-xs mb-1 text-gray-400">Fuentes:</h4>
                         <ul className="list-disc list-inside space-y-1">
                            {msg.sources.map((source, i) => (
                                (source.web || source.maps) && <li key={i}>
                                    <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">
                                        {source.web?.title || source.maps?.title || 'Enlace'}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-primary text-brand-dark p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                aria-label="Abrir chat"
            >
                <ChatIcon className="h-8 w-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-96 h-[70vh] sm:h-[60vh] bg-gray-800/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col z-50">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="font-bold text-lg text-brand-light">Asistente Padel Core</h2>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                    <CloseIcon className="h-6 w-6" />
                </button>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map(renderMessage)}
                {isLoading && <div className="flex justify-start"><div className="bg-brand-gray rounded-lg px-4 py-2 "><div className="animate-pulse">...</div></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder={useSearch ? "Buscar en la web..." : "Pregúntame algo..."}
                        className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-brand-primary text-brand-dark p-2 rounded-full disabled:opacity-50"
                    >
                        <SendIcon className="h-5 w-5" />
                    </button>
                </div>
                 <div className="flex items-center justify-center mt-3">
                    <label htmlFor="search-toggle" className="flex items-center cursor-pointer text-xs text-gray-400">
                        <SearchIcon className={`h-4 w-4 mr-2 transition-colors ${useSearch ? 'text-brand-primary' : 'text-gray-500'}`} />
                        <span className="mr-2">Búsqueda con Google</span>
                        <div className="relative">
                            <input type="checkbox" id="search-toggle" className="sr-only" checked={useSearch} onChange={() => setUseSearch(!useSearch)} />
                            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useSearch ? 'translate-x-full bg-brand-primary' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </footer>
        </div>
    );
};

export default ChatBot;
