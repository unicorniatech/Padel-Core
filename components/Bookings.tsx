
import React, { useState } from 'react';
import { mapsSearch } from '../services/geminiService';
import { showNotification } from '../services/notificationService';
import { SearchIcon } from './icons';
import { GroundingSource } from '../types';

const Bookings: React.FC = () => {
    const [query, setQuery] = useState('Pistas de pádel cerca de mí');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ text: string; sources: GroundingSource[] } | null>(null);

    const handleSearch = () => {
        setError(null);
        setLoading(true);
        setResult(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await mapsSearch(query, latitude, longitude);
                    setResult(response);
                } catch (err) {
                    setError('Error al contactar con la IA de Gemini. Por favor, inténtalo de nuevo.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            },
            (geoError) => {
                setError('No se pudo obtener la ubicación. Por favor, habilita los permisos de geolocalización.');
                setLoading(false);
                console.error(geoError);
            }
        );
    };

    const handleBookCourt = () => {
        showNotification('¡Reserva Confirmada!', {
            body: `Tu pista cerca ha sido reservada con éxito. ¡A jugar!`,
        });
        alert('Reserva simulada. Se ha enviado una notificación de confirmación.');
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-brand-primary">Reservar Pista</h2>
            <div className="bg-brand-gray p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-brand-secondary">Encontrar Pistas con IA de Google Maps</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-grow bg-gray-700 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        placeholder="Ej: Pistas cubiertas con cafetería"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-brand-primary text-brand-dark font-bold py-2 px-6 rounded-md flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-brand-dark rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <SearchIcon className="h-5 w-5 mr-2" />
                                Buscar
                            </>
                        )}
                    </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
                
                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br/>') }} />
                        
                        {result.sources.length > 0 && (
                             <div>
                                <h4 className="font-semibold mt-6 mb-2 text-brand-secondary">Fuentes de Google Maps:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {result.sources.map((source, index) => (
                                        source.maps && <li key={index}>
                                            <a href={source.maps.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                {source.maps.title || 'Enlace a Google Maps'}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button
                            onClick={handleBookCourt}
                            className="!mt-6 w-full bg-brand-secondary text-brand-dark font-bold py-2.5 px-6 rounded-md transition-opacity hover:opacity-90"
                        >
                            Simular Reserva y Notificar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;
