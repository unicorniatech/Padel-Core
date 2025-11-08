
export interface Player {
    id: number;
    name: string;
    photoUrl: string;
    skillLevel: number;
    stats: {
        wins: number;
        losses: number;
        winRate: string;
    };
    aiInsight: string;
}

export interface Match {
    id: number;
    teamA: { player1: string; player2: string; };
    teamB: { player1: string; player2: string; };
    score: string;
    date: string;
    videoUrl?: string;
}

export interface Booking {
    id: number;
    court: string;
    time: string;
    date: string;
}

export interface Tournament {
    id: number;
    name: string;
    standings: {
        rank: number;
        player: string;
        points: number;
    }[];
}

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    sources?: GroundingSource[];
}

export interface GroundingSource {
    web?: {
        uri: string;
        title: string;
    };
    maps?: {
        uri: string;
        title: string;
    }
}

export interface SavedVideo {
    id: number;
    title: string;
    date: string;
    videoBlob: Blob;
    analysis: string;
}