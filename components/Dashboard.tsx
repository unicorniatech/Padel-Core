
import React, { useState, useEffect } from 'react';
import { Booking, Match, Tournament, Player } from '../types';
import { getBookings, getMatches, getTournaments, getPlayers } from '../services/mockData';
import { showNotification } from '../services/notificationService';

const Dashboard: React.FC = () => {
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [lastMatch, setLastMatch] = useState<Match | null>(null);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);

    useEffect(() => {
        setNextBooking(getBookings()[0] || null);
        setLastMatch(getMatches()[0] || null);
        setTournament(getTournaments()[0] || null);
        setPlayer(getPlayers()[0] || null);
    }, []);
    
    const handleReminder = () => {
        if (nextBooking) {
            showNotification('Recordatorio de Partido', {
                body: `Tu partido en ${nextBooking.court} a las ${nextBooking.time} es pronto. ¡No llegues tarde!`,
            });
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-brand-primary">Bienvenido, {player?.name}!</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Próxima Reserva */}
                <div className="bg-brand-gray p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-brand-secondary">Próxima Reserva</h3>
                    {nextBooking ? (
                        <div className="space-y-2">
                            <p className="text-4xl font-bold text-brand-primary">{nextBooking.time}</p>
                            <p className="text-gray-300">{nextBooking.date}, {nextBooking.court}</p>
                            <button 
                                onClick={handleReminder}
                                className="!mt-4 w-full text-sm bg-brand-secondary text-brand-dark font-bold py-1.5 px-3 rounded-md transition-opacity hover:opacity-90"
                            >
                                Simular Recordatorio
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-400">No tienes reservas pendientes.</p>
                    )}
                </div>

                {/* Último Partido */}
                <div className="bg-brand-gray p-6 rounded-lg shadow-lg lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4 text-brand-secondary">Último Partido</h3>
                    {lastMatch ? (
                        <div className="flex flex-col sm:flex-row justify-between items-start">
                           <div>
                               <p className="text-gray-400">{lastMatch.teamA.player1} & {lastMatch.teamA.player2}</p>
                               <p className="text-lg font-bold">vs.</p>
                               <p className="text-gray-400">{lastMatch.teamB.player1} & {lastMatch.teamB.player2}</p>
                           </div>
                           <p className="text-2xl font-bold text-brand-primary mt-2 sm:mt-0">{lastMatch.score}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400">No hay partidos recientes.</p>
                    )}
                </div>

                {/* Análisis IA */}
                <div className="bg-brand-gray p-6 rounded-lg shadow-lg md:col-span-2 lg:col-span-1">
                    <h3 className="text-xl font-semibold mb-4 text-brand-secondary">Análisis de IA</h3>
                    {player ? (
                        <p className="text-gray-300 italic">"{player.aiInsight}"</p>
                    ) : (
                        <p className="text-gray-400">Análisis no disponible.</p>
                    )}
                </div>

                {/* Torneo Actual */}
                <div className="bg-brand-gray p-6 rounded-lg shadow-lg lg:col-span-2">
                     <h3 className="text-xl font-semibold mb-4 text-brand-secondary">{tournament?.name}</h3>
                     {tournament ? (
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2">Rank</th>
                                        <th className="py-2">Jugador</th>
                                        <th className="py-2 text-right">Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournament.standings.slice(0, 3).map(s => (
                                        <tr key={s.rank} className="border-b border-gray-800">
                                            <td className="py-2">{s.rank}</td>
                                            <td className="py-2">{s.player}</td>
                                            <td className="py-2 text-right font-mono text-brand-primary">{s.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                     ) : (
                         <p className="text-gray-400">No estás participando en ningún torneo.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
