
import { Player, Match, Booking, Tournament } from '../types';

const players: Player[] = [
    { id: 1, name: 'Carlos Aguilar', photoUrl: 'https://picsum.photos/seed/carlos/200', skillLevel: 4.5, stats: { wins: 25, losses: 8, winRate: '75.8%' }, aiInsight: 'Carlos tiene una volea de derecha dominante, pero necesita mejorar la consistencia de su bandeja.' },
    { id: 2, name: 'Sofía Navarro', photoUrl: 'https://picsum.photos/seed/sofia/200', skillLevel: 4.2, stats: { wins: 22, losses: 10, winRate: '68.8%' }, aiInsight: 'Sofía muestra una excelente defensa desde el fondo de la pista. Trabajar en un remate más agresivo podría llevar su juego al siguiente nivel.' },
    { id: 3, name: 'Javier Moreno', photoUrl: 'https://picsum.photos/seed/javier/200', skillLevel: 4.8, stats: { wins: 30, losses: 5, winRate: '85.7%' }, aiInsight: 'La principal fortaleza de Javier es su visión táctica y el control del ritmo del partido. Podría beneficiarse de una mayor potencia en sus smash.' },
    { id: 4, name: 'Lucía Jiménez', photoUrl: 'https://picsum.photos/seed/lucia/200', skillLevel: 4.6, stats: { wins: 28, losses: 6, winRate: '82.4%' }, aiInsight: 'Lucía posee una velocidad y agilidad excepcionales. Concentrarse en la selección de tiros en momentos de presión mejorará sus resultados.' }
];

const matches: Match[] = [
    { id: 1, teamA: { player1: 'Carlos Aguilar', player2: 'Sofía Navarro' }, teamB: { player1: 'Javier Moreno', player2: 'Lucía Jiménez' }, score: '6-4, 3-6, 7-5', date: 'Ayer', videoUrl: 'https://example.com/video1' },
    { id: 2, teamA: { player1: 'Carlos Aguilar', player2: 'Javier Moreno' }, teamB: { player1: 'Sofía Navarro', player2: 'Lucía Jiménez' }, score: '6-2, 6-3', date: 'Hace 3 días', videoUrl: 'https://example.com/video2' }
];

const bookings: Booking[] = [
    { id: 1, court: 'Pista Central', time: '18:00', date: 'Hoy' },
    { id: 2, court: 'Pista 2', time: '19:00', date: 'Mañana' },
    { id: 3, court: 'Pista 1', time: '17:00', date: 'Pasado Mañana' }
];

const tournaments: Tournament[] = [
    {
        id: 1,
        name: 'Torneo de Verano Padel Core',
        standings: [
            { rank: 1, player: 'Javier Moreno', points: 1250 },
            { rank: 2, player: 'Lucía Jiménez', points: 1180 },
            { rank: 3, player: 'Carlos Aguilar', points: 1100 },
            { rank: 4, player: 'Sofía Navarro', points: 1050 }
        ]
    }
];

export const initializeData = () => {
    if (!localStorage.getItem('padel_core_players')) {
        localStorage.setItem('padel_core_players', JSON.stringify(players));
    }
    if (!localStorage.getItem('padel_core_matches')) {
        localStorage.setItem('padel_core_matches', JSON.stringify(matches));
    }
    if (!localStorage.getItem('padel_core_bookings')) {
        localStorage.setItem('padel_core_bookings', JSON.stringify(bookings));
    }
    if (!localStorage.getItem('padel_core_tournaments')) {
        localStorage.setItem('padel_core_tournaments', JSON.stringify(tournaments));
    }
};

export const getPlayers = (): Player[] => JSON.parse(localStorage.getItem('padel_core_players') || '[]');
export const getMatches = (): Match[] => JSON.parse(localStorage.getItem('padel_core_matches') || '[]');
export const getBookings = (): Booking[] => JSON.parse(localStorage.getItem('padel_core_bookings') || '[]');
export const getTournaments = (): Tournament[] => JSON.parse(localStorage.getItem('padel_core_tournaments') || '[]');
