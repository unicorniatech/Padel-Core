
import React from 'react';
import { HomeIcon, CalendarIcon, AiIcon, TrophyIcon, VideoCameraIcon } from './icons';
import { View } from '../App';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Inicio', icon: HomeIcon },
        { id: 'partidos', label: 'Partidos', icon: VideoCameraIcon },
        { id: 'reservas', label: 'Reservas', icon: CalendarIcon },
        { id: 'gemini_lab', label: 'Laboratorio IA', icon: AiIcon },
        { id: 'torneos', label: 'Torneos', icon: TrophyIcon },
    ] as const;

    return (
        <header className="bg-brand-gray/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <TrophyIcon className="h-8 w-8 text-brand-primary" />
                    <h1 className="text-2xl font-bold text-brand-light">PADEL CORE</h1>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === item.id ? 'bg-brand-primary text-brand-dark' : 'text-gray-300 hover:bg-brand-gray hover:text-white'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>
            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-gray border-t border-gray-700 flex justify-around py-2 z-50">
                {navItems.map(item => (
                     <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`flex flex-col items-center justify-center w-full text-xs transition-colors ${currentView === item.id ? 'text-brand-primary' : 'text-gray-400'}`}
                    >
                        <item.icon className="h-6 w-6 mb-1" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;