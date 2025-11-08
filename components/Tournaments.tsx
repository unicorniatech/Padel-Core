
import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { getTournaments } from '../services/mockData';
import { showNotification } from '../services/notificationService';

const Tournaments: React.FC = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    useEffect(() => {
        setTournaments(getTournaments());
    }, []);

    const handleTournamentUpdate = () => {
        if (tournaments.length > 0) {
            showNotification('Resultados del Torneo Actualizados', {
                body: `Ya están disponibles los nuevos resultados para el ${tournaments[0].name}.`,
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-brand-primary">Torneos y Rankings</h2>
                <button
                    onClick={handleTournamentUpdate}
                    disabled={tournaments.length === 0}
                    className="bg-brand-secondary text-brand-dark font-bold py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    Simular Notificación de Resultados
                </button>
            </div>
            {tournaments.length > 0 ? (
                tournaments.map(tournament => (
                    <div key={tournament.id} className="bg-brand-gray p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4 text-brand-secondary">{tournament.name}</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                                <thead className="border-b-2 border-brand-secondary">
                                    <tr>
                                        <th className="p-3">Posición</th>
                                        <th className="p-3">Jugador</th>
                                        <th className="p-3 text-right">Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournament.standings.map(s => (
                                        <tr key={s.rank} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-800">
                                            <td className="p-3 font-bold text-xl">{s.rank}</td>
                                            <td className="p-3">{s.player}</td>
                                            <td className="p-3 text-right font-mono text-brand-primary text-lg">{s.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                           </table>
                        </div>
                    </div>
                ))
            ) : (
                <p>No hay torneos activos en este momento.</p>
            )}
        </div>
    );
};

export default Tournaments;
