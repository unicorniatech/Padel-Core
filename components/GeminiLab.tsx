import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    analyzeImage,
    analyzeVideo,
    complexQuery,
    connectLive
} from '../services/geminiService';
import { UploadIcon, MicIcon, StopIcon, VideoCameraIcon } from './icons';
import { LiveServerMessage, LiveSession } from '@google/genai';
import { saveVideo } from '../services/dbService';


// --- Start of Audio Utilities ---

// Decodes a base64 string into a Uint8Array.
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer for playback.
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Encodes a Uint8Array into a base64 string.
const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Creates a PCM blob in the format expected by the Gemini Live API.
const createPcmBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


// --- End of Audio Utilities ---


// Helper component for each Lab section
interface LabSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}
const LabSection: React.FC<LabSectionProps> = ({ title, description, children }) => (
    <div className="bg-brand-gray p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-2 text-brand-secondary">{title}</h3>
        <p className="text-gray-400 mb-4 text-sm">{description}</p>
        {children}
    </div>
);

// Main Component
const GeminiLab: React.FC = () => {
    // State for all sections
    const [imageAnalysis, setImageAnalysis] = useState({ prompt: 'Describe mi agarre y sugiere mejoras.', file: null as File | null, preview: '', result: '', loading: false, error: '' });
    const [videoAnalysis, setVideoAnalysis] = useState({ prompt: 'Analiza mi remate en este video.', result: '', loading: false, error: '' });
    const [thinkingQuery, setThinkingQuery] = useState({ prompt: 'Crea un plan de entrenamiento de 3 meses para mejorar mi resistencia y agilidad en la pista, dedicando 6 horas a la semana.', result: '', loading: false, error: '' });
    const [liveAgent, setLiveAgent] = useState({ isConnected: false, userTranscript: '', agentTranscript: '', status: 'Desconectado' });
    const [liveVideo, setLiveVideo] = useState({ isAnalyzing: false, status: 'Listo para analizar', analysisText: '' });

    // Refs for Live Video Analysis
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const liveVideoSessionPromise = useRef<Promise<LiveSession> | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const frameIntervalRef = useRef<number | null>(null);
    const liveVideoStreamRef = useRef<MediaStream | null>(null);
    const fullAnalysisTranscript = useRef('');
    const liveVideoInputAudioContextRef = useRef<AudioContext | null>(null);
    const liveVideoScriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const liveVideoMediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Refs and Callbacks for Live Agent (Voice only)
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const preview = URL.createObjectURL(file);
            setImageAnalysis(prev => ({ ...prev, file, preview }));
        }
    };

    const handleImageSubmit = async () => {
        if (!imageAnalysis.file || !imageAnalysis.prompt) return;
        setImageAnalysis(prev => ({ ...prev, loading: true, error: '', result: '' }));
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageAnalysis.file);
            reader.onload = async () => {
                const base64Image = (reader.result as string).split(',')[1];
                const result = await analyzeImage(imageAnalysis.prompt, base64Image, imageAnalysis.file!.type);
                setImageAnalysis(prev => ({ ...prev, result, loading: false }));
            };
        } catch (err) {
            setImageAnalysis(prev => ({ ...prev, error: 'Error al analizar la imagen.', loading: false }));
        }
    };
    
    const handleVideoSubmit = async () => {
        if (!videoAnalysis.prompt) return;
        setVideoAnalysis(prev => ({ ...prev, loading: true, error: '', result: '' }));
        try {
            const result = await analyzeVideo(videoAnalysis.prompt);
            setVideoAnalysis(prev => ({ ...prev, result, loading: false }));
        } catch(err) {
            setVideoAnalysis(prev => ({...prev, error: 'Error en el análisis de video.', loading: false }));
        }
    };

    const handleThinkingQuerySubmit = async () => {
        if (!thinkingQuery.prompt) return;
        setThinkingQuery(prev => ({ ...prev, loading: true, error: '', result: '' }));
        try {
            const stream = await complexQuery(thinkingQuery.prompt);
            for await (const chunk of stream) {
                setThinkingQuery(prev => ({ ...prev, result: prev.result + chunk }));
            }
        } catch (err) {
            setThinkingQuery(prev => ({ ...prev, error: 'Error en la consulta compleja.', loading: false }));
        } finally {
            setThinkingQuery(prev => ({ ...prev, loading: false }));
        }
    };

    // --- Live Agent (Voice) Logic ---
    const stopLiveSession = useCallback(() => {
        sessionPromise.current?.then(session => session.close());

        if (scriptProcessorRef.current && mediaStreamSourceRef.current && inputAudioContextRef.current) {
            mediaStreamSourceRef.current.disconnect(scriptProcessorRef.current);
            scriptProcessorRef.current.disconnect(inputAudioContextRef.current.destination);
        }
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        audioQueueRef.current.forEach(source => source.stop());
        audioQueueRef.current.clear();
        
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamRef.current = null;
        nextStartTimeRef.current = 0;
        sessionPromise.current = null;

        setLiveAgent({ isConnected: false, status: 'Desconectado', userTranscript: '', agentTranscript: '' });

    }, []);

    const startLiveSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

            setLiveAgent({ isConnected: true, status: 'Conectando...', userTranscript: '', agentTranscript: '' });

            sessionPromise.current = connectLive({
                onopen: () => {
                    setLiveAgent(prev => ({ ...prev, status: 'Conectado. ¡Habla ahora!' }));
                    
                    if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if(message.serverContent?.inputTranscription) setLiveAgent(prev => ({ ...prev, userTranscript: prev.userTranscript + message.serverContent.inputTranscription.text }));
                    if(message.serverContent?.outputTranscription) setLiveAgent(prev => ({ ...prev, agentTranscript: prev.agentTranscript + message.serverContent.outputTranscription.text }));
                    if(message.serverContent?.turnComplete) setLiveAgent(prev => ({ ...prev, userTranscript: prev.userTranscript + '\n', agentTranscript: prev.agentTranscript + '\n'}));
                    
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if(audioData && outputAudioContextRef.current) {
                        const audioContext = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContext.destination);
                        
                        source.addEventListener('ended', () => audioQueueRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioQueueRef.current.add(source);
                    }
                },
                onerror: (e) => {
                    console.error("Live session error:", e);
                    setLiveAgent({ isConnected: false, status: 'Error en la conexión', userTranscript: '', agentTranscript: '' });
                    stopLiveSession();
                },
                onclose: () => {
                     setLiveAgent({ isConnected: false, status: 'Desconectado', userTranscript: '', agentTranscript: '' });
                }
            });
        } catch (error) {
            console.error("Failed to start live session:", error);
            setLiveAgent({ isConnected: false, status: 'Error al iniciar', userTranscript: '', agentTranscript: '' });
        }
    };


    const handleSaveVideo = useCallback(async () => {
        if (recordedChunksRef.current.length === 0) {
            console.warn("No video data was recorded.");
            setLiveVideo(prev => ({ ...prev, status: 'Error: La grabación finalizó sin datos.' }));
            alert('Error: No se pudo grabar el video. Inténtalo de nuevo.');
            return;
        }

        setLiveVideo(prev => ({ ...prev, status: 'Procesando video...' }));
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const title = prompt("Introduce un título para tu partido grabado:", `Sesión del ${new Date().toLocaleDateString()}`);
        
        if (title) {
            try {
                setLiveVideo(prev => ({ ...prev, status: 'Guardando video...' }));
                await saveVideo({
                    title,
                    date: new Date().toISOString(),
                    videoBlob,
                    analysis: fullAnalysisTranscript.current,
                });
                setLiveVideo(prev => ({ ...prev, status: `Video "${title}" guardado.` }));
                alert(`Video "${title}" guardado con éxito. Puedes verlo en la sección 'Partidos'.`);
            } catch (err) {
                console.error("Failed to save video:", err);
                setLiveVideo(prev => ({ ...prev, status: 'Error al guardar el video.' }));
                alert('Error al guardar el video.');
            }
        } else {
            setLiveVideo(prev => ({ ...prev, status: 'Guardado cancelado por el usuario.' }));
        }
        
        recordedChunksRef.current = [];
        fullAnalysisTranscript.current = '';
    }, []);

    // --- Live Video Analysis Logic ---
    const stopLiveAnalysis = useCallback(() => {
        setLiveVideo(prev => ({ ...prev, isAnalyzing: false, status: 'Finalizando sesión...' }));

        if (frameIntervalRef.current) {
            clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        
        liveVideoSessionPromise.current?.then(session => session.close());
        liveVideoSessionPromise.current = null;

        if (liveVideoScriptProcessorRef.current && liveVideoMediaStreamSourceRef.current) {
            liveVideoMediaStreamSourceRef.current.disconnect();
            liveVideoScriptProcessorRef.current.disconnect();
        }
        liveVideoInputAudioContextRef.current?.close();
        liveVideoScriptProcessorRef.current = null;
        liveVideoMediaStreamSourceRef.current = null;
        liveVideoInputAudioContextRef.current = null;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = handleSaveVideo;
            mediaRecorderRef.current.stop();
        } else if (recordedChunksRef.current.length > 0) {
            handleSaveVideo();
        }
        
        liveVideoStreamRef.current?.getTracks().forEach(track => track.stop());
        liveVideoStreamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

    }, [handleSaveVideo]);


    const startLiveAnalysis = async () => {
        try {
            setLiveVideo({ isAnalyzing: true, status: 'Iniciando cámara...', analysisText: '' });
            fullAnalysisTranscript.current = '';
            recordedChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            liveVideoStreamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setLiveVideo(prev => ({...prev, status: 'Cámara lista. Conectando a IA...'}));
                    
                    liveVideoInputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

                    liveVideoSessionPromise.current = connectLive({
                        onopen: () => {
                            setLiveVideo(prev => ({...prev, status: 'Conectado. Análisis en vivo...'}));
                            if (!liveVideoStreamRef.current || !liveVideoInputAudioContextRef.current) return;
                            
                            const audioContext = liveVideoInputAudioContextRef.current;
                            liveVideoMediaStreamSourceRef.current = audioContext.createMediaStreamSource(liveVideoStreamRef.current);
                            liveVideoScriptProcessorRef.current = audioContext.createScriptProcessor(4096, 1, 1);
                            
                            liveVideoScriptProcessorRef.current.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                liveVideoSessionPromise.current?.then(s => s.sendRealtimeInput({ media: createPcmBlob(inputData) }));
                            };
                            liveVideoMediaStreamSourceRef.current.connect(liveVideoScriptProcessorRef.current);
                            liveVideoScriptProcessorRef.current.connect(audioContext.destination);

                            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
                            mediaRecorderRef.current.ondataavailable = (e) => {
                                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
                            };
                            mediaRecorderRef.current.start(1000); 
                            
                            frameIntervalRef.current = window.setInterval(sendVideoFrame, 1000); // 1 FPS
                        },
                        onmessage: (msg: LiveServerMessage) => {
                             if (msg.serverContent?.outputTranscription?.text) {
                                const newText = msg.serverContent.outputTranscription.text;
                                fullAnalysisTranscript.current += newText;
                                setLiveVideo(prev => ({...prev, analysisText: prev.analysisText + newText}));
                            }
                        },
                        onerror: (e) => {
                            console.error("Live video error:", e);
                            setLiveVideo(prev => ({...prev, status: 'Error en la conexión. Inténtalo de nuevo.'}));
                            stopLiveAnalysis();
                        },
                        onclose: () => {
                            // Status update handled by stopLiveAnalysis
                        }
                    });
                };
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setLiveVideo({ isAnalyzing: false, status: 'Error: No se pudo acceder a la cámara.', analysisText: '' });
        }
    };

    const sendVideoFrame = useCallback(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            if (blob) {
                const base64Data = await blobToBase64(blob);
                liveVideoSessionPromise.current?.then(session => {
                    session.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                    });
                });
            }
        }, 'image/jpeg', 0.8);
    }, []);
    

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            if (liveAgent.isConnected) stopLiveSession();
            if (liveVideo.isAnalyzing) stopLiveAnalysis();
        };
    }, [liveAgent.isConnected, stopLiveSession, liveVideo.isAnalyzing, stopLiveAnalysis]);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-brand-primary">Laboratorio de IA Gemini</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Live Video Analysis */}
                <LabSection title="Análisis de Video en Vivo" description="Recibe coaching en tiempo real. La IA analizará tus movimientos y te dará feedback mientras juegas. La sesión se grabará para que la revises.">
                    <div className="relative aspect-video bg-gray-900 rounded-md mb-4 overflow-hidden">
                        <video ref={videoRef} muted playsInline className="w-full h-full object-cover"></video>
                        {!liveVideo.isAnalyzing && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><VideoCameraIcon className="w-16 h-16 text-gray-500"/></div>}
                    </div>
                    <button onClick={liveVideo.isAnalyzing ? stopLiveAnalysis : startLiveAnalysis} className={`w-full font-bold py-3 px-4 rounded-md flex items-center justify-center text-lg transition-colors ${liveVideo.isAnalyzing ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-primary hover:opacity-90 text-brand-dark'}`}>
                        {liveVideo.isAnalyzing ? <><StopIcon className="h-6 w-6 mr-2" />Terminar Análisis</> : <><VideoCameraIcon className="h-6 w-6 mr-2" />Iniciar Análisis</>}
                    </button>
                    <div className="mt-4 p-4 bg-gray-800 rounded-md min-h-[120px]">
                        <p className="font-bold text-brand-secondary">{liveVideo.status}</p>
                        <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{liveVideo.analysisText}</p>
                    </div>
                </LabSection>

                 {/* Live Agent */}
                <LabSection title="Entrenador de Voz IA (Live API)" description="Habla en tiempo real con tu entrenador de IA. Hazle preguntas y recibe respuestas de voz al instante.">
                    <button onClick={liveAgent.isConnected ? stopLiveSession : startLiveSession} className={`w-full font-bold py-3 px-4 rounded-md flex items-center justify-center text-lg transition-colors ${liveAgent.isConnected ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                        {liveAgent.isConnected ? <><StopIcon className="h-6 w-6 mr-2" />Terminar Sesión</> : <><MicIcon className="h-6 w-6 mr-2" />Iniciar Sesión de Voz</>}
                    </button>
                    <div className="mt-4 p-4 bg-gray-800 rounded-md min-h-[150px]">
                        <p className="font-bold text-brand-secondary">{liveAgent.status}</p>
                        <div className="mt-2 text-sm whitespace-pre-wrap">
                            <p><span className="font-semibold text-gray-400">Tú:</span> {liveAgent.userTranscript}</p>
                            <p className="mt-2"><span className="font-semibold text-brand-primary">Core:</span> {liveAgent.agentTranscript}</p>
                        </div>
                    </div>
                </LabSection>

                 {/* Image Analysis */}
                <LabSection title="Análisis de Imagen (gemini-2.5-flash)" description="Sube una foto de tu postura, agarre o cualquier otro aspecto de tu juego para recibir un análisis instantáneo.">
                    <textarea value={imageAnalysis.prompt} onChange={e => setImageAnalysis(prev => ({ ...prev, prompt: e.target.value }))} className="w-full bg-gray-700 text-white rounded-md px-4 py-2 mb-4 h-24" />
                    <label className="w-full cursor-pointer bg-brand-secondary text-brand-dark font-bold py-2 px-4 rounded-md flex items-center justify-center">
                        <UploadIcon className="h-5 w-5 mr-2" />
                        {imageAnalysis.file ? imageAnalysis.file.name : 'Seleccionar Imagen'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {imageAnalysis.preview && <img src={imageAnalysis.preview} alt="Preview" className="mt-4 rounded-lg max-h-48" />}
                    <button onClick={handleImageSubmit} disabled={imageAnalysis.loading || !imageAnalysis.file} className="w-full mt-4 bg-brand-primary text-brand-dark font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {imageAnalysis.loading ? 'Analizando...' : 'Analizar'}
                    </button>
                    {imageAnalysis.result && <div className="mt-4 p-4 bg-gray-800 rounded-md whitespace-pre-wrap">{imageAnalysis.result}</div>}
                </LabSection>

                {/* Video Analysis */}
                <LabSection title="Análisis de Video (gemini-2.5-pro)" description="Describe una acción de un video (ej. tu saque) y la IA te dará un análisis detallado como si lo hubiera visto. (Simulación)">
                    <textarea value={videoAnalysis.prompt} onChange={e => setVideoAnalysis(prev => ({ ...prev, prompt: e.target.value }))} className="w-full bg-gray-700 text-white rounded-md px-4 py-2 mb-4 h-24" />
                    <label className="w-full cursor-not-allowed bg-brand-secondary/50 text-brand-dark font-bold py-2 px-4 rounded-md flex items-center justify-center">
                        <UploadIcon className="h-5 w-5 mr-2" />
                        Subir Video (UI Deshabilitada)
                    </label>
                    <button onClick={handleVideoSubmit} disabled={videoAnalysis.loading} className="w-full mt-4 bg-brand-primary text-brand-dark font-bold py-2 px-4 rounded-md disabled:opacity-50">
                         {videoAnalysis.loading ? 'Analizando...' : 'Analizar'}
                    </button>
                    {videoAnalysis.result && <div className="mt-4 p-4 bg-gray-800 rounded-md whitespace-pre-wrap">{videoAnalysis.result}</div>}
                </LabSection>

                {/* Complex Query */}
                <LabSection title="Consulta Compleja (gemini-2.5-pro with Thinking)" description="Haz preguntas complejas que requieran un razonamiento profundo. La IA se tomará su tiempo para darte una respuesta completa.">
                     <textarea value={thinkingQuery.prompt} onChange={e => setThinkingQuery(prev => ({ ...prev, prompt: e.target.value }))} className="w-full bg-gray-700 text-white rounded-md px-4 py-2 mb-4 h-40" />
                     <button onClick={handleThinkingQuerySubmit} disabled={thinkingQuery.loading} className="w-full mt-4 bg-brand-primary text-brand-dark font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {thinkingQuery.loading ? 'Pensando...' : 'Preguntar a la IA'}
                    </button>
                     {thinkingQuery.result && <div className="mt-4 p-4 bg-gray-800 rounded-md whitespace-pre-wrap">{thinkingQuery.result}</div>}
                </LabSection>

            </div>
        </div>
    );
};

export default GeminiLab;