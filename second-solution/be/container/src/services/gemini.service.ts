import { GoogleGenAI, LiveCallbacks, LiveConnectConfig, Modality, Session } from '@google/genai';
import { ServerService } from './server.service';

export class GeminiService {
    private geminiAi: GoogleGenAI;
    private session: Session | null = null;
    private geminiConfig: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            languageCode: "it-IT",
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: 'Leda',
                }
            }
        },
    };

    private serverService: ServerService;

    public constructor() {
        this.geminiAi = new GoogleGenAI({
            apiKey: 'your-google-api-key'
        });
        this.serverService = ServerService.getInstance();
    }

    public async startSession(callbacks: LiveCallbacks): Promise<void> {
        this.geminiConfig.systemInstruction = this.serverService.getGeminiPrompt();
        this.session = await this.geminiAi.live.connect({
            model: 'gemini-2.0-flash-live-001',
            config: this.geminiConfig,
            callbacks
        });

        if (this.session) {
            this.session.sendRealtimeInput({
                text: 'Inizia la conversazione.'
            });
        }
    }

    public async sendAudioChunk(audioChunkBase64: string) {
        if (!this.session) {
            throw Error('Tentativo di inviare dati senza una sessione attiva.');
        }

        try {
            this.session.sendRealtimeInput({
                audio: {
                    data: audioChunkBase64,
                    mimeType: 'audio/pcm'
                },
            });
        } catch (error) {
            throw Error('Errore durante l\'invio del chunk audio: ' + error);
        }
    }

    public sendImage(imageBase64: string) {
        if (!this.session) {
            throw Error('Tentativo di inviare dati senza una sessione attiva.');
        }
        try {
            this.session.sendRealtimeInput({
                media: {
                    data: imageBase64,
                    mimeType: 'image/jpeg'
                }
            });
        } catch (error) {
            throw Error('Errore durante l\'invio dell\'immagine: ' + error);
        }
    }

    public closeSession(): void {
        if (this.session) {
            this.session.close();
            this.session = null;
        }
    }
}
