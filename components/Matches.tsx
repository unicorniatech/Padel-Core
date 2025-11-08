import React, { useState, useEffect, useCallback } from 'react';
import { getVideos, deleteVideo } from '../services/dbService';
import { SavedVideo } from '../types';
import { CloseIcon } from './icons';

const Matches: React.FC = () => {
    const [videos, setVideos] = useState<SavedVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null);
    const [videoUrls, setVideoUrls] = useState<Map<number, string>>(new Map());

    const loadVideos = useCallback(async () => {
        setLoading(true);
        try {
            const savedVideos = await getVideos();
            setVideos(savedVideos.reverse()); // Show newest first
        } catch (error) {
            console.error("Error loading videos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    // Effect to manage Object URLs for video previews
    useEffect(() => {
        const newUrls = new Map<number, string>();
        videos.forEach(video => {
            if (video.videoBlob) {
                const url = URL.createObjectURL(video.videoBlob);
                newUrls.set(video.id, url);
            }
        });
        setVideoUrls(newUrls);

        // Cleanup function to revoke URLs on component unmount or when videos change
        return () => {
            newUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [videos]);


    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este video?')) {
            try {
                await deleteVideo(id);
                loadVideos(); // Refresh the list
            } catch (error) {
                console.error('Failed to delete video:', error);
                alert('No se pudo eliminar el video.');
            }
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = e.currentTarget.querySelector('video');
        if (video) {
            video.play().catch(err => console.error("Video play failed", err));
        }
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = e.currentTarget.querySelector('video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    };

    const VideoPlayerModal: React.FC<{ video: SavedVideo; onClose: () => void }> = ({ video, onClose }) => {
        const videoUrl = videoUrls.get(video.id);

        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
                <div className="bg-brand-gray rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-brand-primary">{video.title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-4 overflow-hidden">
                        <div className="flex-grow lg:w-2/3">
                            {videoUrl && <video src={videoUrl} controls autoPlay className="w-full h-full rounded-md bg-black"></video>}
                        </div>
                        <div className="flex-shrink-0 lg:w-1/3 bg-gray-800 p-4 rounded-md overflow-y-auto max-h-[40vh] lg:max-h-full">
                            <h4 className="text-lg font-semibold text-brand-secondary mb-2">Análisis de IA</h4>
                            <p className="whitespace-pre-wrap text-gray-300 text-sm">{video.analysis || "No se guardó ningún análisis."}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-brand-primary">Partidos Grabados</h2>
            {loading ? (
                 <p>Cargando videos...</p>
            ) : videos.length === 0 ? (
                <div className="text-center py-16 bg-brand-gray rounded-lg">
                    <h3 className="text-xl text-gray-300">No tienes partidos grabados.</h3>
                    <p className="text-gray-400 mt-2">Ve al Laboratorio de IA para grabar tu primera sesión de análisis en vivo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map(video => {
                        const videoUrl = videoUrls.get(video.id);
                        return (
                            <div 
                                key={video.id} 
                                className="bg-brand-gray rounded-lg shadow-lg overflow-hidden group"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="relative aspect-video bg-gray-900 flex items-center justify-center">
                                     {videoUrl && <video src={videoUrl} preload="metadata" loop muted playsInline className="w-full h-full object-cover"></video>}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedVideo(video)} className="text-white text-lg font-bold bg-brand-primary/80 px-6 py-3 rounded-full">
                                            Ver Partido
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg truncate text-brand-light">{video.title}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-gray-400">{new Date(video.date).toLocaleString()}</p>
                                        <button onClick={() => handleDelete(video.id)} className="text-red-500 hover:text-red-400 text-xs font-semibold">
                                            ELIMINAR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default Matches;