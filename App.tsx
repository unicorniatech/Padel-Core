
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import GeminiLab from './components/GeminiLab';
import Tournaments from './components/Tournaments';
import Matches from './components/Matches';
import ChatBot from './components/ChatBot';
import { initializeData } from './services/mockData';
import { requestNotificationPermission } from './services/notificationService';
import { initDB } from './services/dbService';

export type View = 'dashboard' | 'partidos' | 'reservas' | 'gemini_lab' | 'torneos';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');

    useEffect(() => {
        initializeData();
        requestNotificationPermission();
        initDB().catch(err => console.error("Failed to initialize DB:", err));
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'partidos':
                return <Matches />;
            case 'reservas':
                return <Bookings />;
            case 'gemini_lab':
                return <GeminiLab />;
            case 'torneos':
                return <Tournaments />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-brand-light font-sans">
            <Header currentView={currentView} setView={setCurrentView} />
            <main className="container mx-auto px-4 py-24 md:py-20 mb-24 md:mb-0">
                {renderView()}
            </main>
            <ChatBot />
        </div>
    );
};

export default App;