import { LiveCallbacks, LiveServerMessage } from '@google/genai';
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { GeminiSocketTypeMessage } from '../../helpers/gemini-socket-type-message.enum';
import { GeminiService } from '../../services/gemini.service';

export class GeminiLiveBridgeWebSocket {
    private wss: WebSocketServer;

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.initializeWebSocket();
    }

    private initializeWebSocket() {
        this.wss.on('connection', async (ws: WebSocket) => {
            const geminiService = new GeminiService();
            await geminiService.startSession(this.getGeminiCallbacks(ws));

            ws.on('message', async (message: string) => {
                try {
                    this.parseWebSocketMessage(message, geminiService);
                } catch (error) {
                    console.error('Errore durante il parsing del messaggio dal client:', error);
                    ws.send(JSON.stringify({ type: GeminiSocketTypeMessage.ERROR, message: 'Formato messaggio non valido.' }));
                }
            });

            ws.on('error', (error: ErrorEvent) => {
                console.error('Errore durante la sessione Gemini: ', error);
                geminiService.closeSession();
            });

            ws.on('close', () => geminiService.closeSession());
        });
    }

    private getGeminiCallbacks(ws: WebSocket): LiveCallbacks {
        return {
            onmessage: (message: LiveServerMessage) => this.forwardGeminiResponseToClient(message, ws),
            onerror: (error: ErrorEvent) => {
                console.error('Errore durante la sessione Gemini: ', error);
                ws.close();
            },
            onclose: (closeEvent: CloseEvent) => {
                console.log('Sessione Gemini chiusa: ', closeEvent.reason);
                ws.close();
            },
        };
    }

    private forwardGeminiResponseToClient(response: LiveServerMessage, ws: WebSocket) {
        if (ws.readyState !== WebSocket.OPEN) {
            return;
        }

        if (response.setupComplete) {
            ws.send(JSON.stringify({ type: GeminiSocketTypeMessage.SETUP_COMPLETE }));
            return;
        }

        if (response.serverContent?.turnComplete) {
            ws.send(JSON.stringify({ type: GeminiSocketTypeMessage.TURN_COMPLETE }));
            return;
        }

        if (response.serverContent?.modelTurn?.parts) {
            for (const part of response.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                    ws.send(JSON.stringify({ type: GeminiSocketTypeMessage.AUDIO_PART, payload: part.inlineData.data }));
                }
            }
        }
    }

    private parseWebSocketMessage(message: string, geminiService: GeminiService) {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === GeminiSocketTypeMessage.AUDIO_PART && data.payload) {
                const audioBase64Payload = data.payload;
                if (typeof audioBase64Payload !== 'string') {
                    console.error('Errore: il payload dell\'audio non è una stringa base64.');
                    return;
                }
                geminiService.sendAudioChunk(audioBase64Payload);
            }
            if (data.type === GeminiSocketTypeMessage.IMAGE_PART && data.payload) {
                if (typeof data.payload !== 'string') {
                    console.error('Errore: il payload dell\'immagine non è una stringa base64.');
                    return;
                }
                const imageBase64 = data.payload.split(';base64,').pop();
                geminiService.sendImage(imageBase64);
            }
        } catch (error) {
            console.error('Errore nel processare ed inviare il messaggio dal client: ', error);
            geminiService.closeSession();
        }
    }
}

export let geminiLiveBridgeWebSocket: GeminiLiveBridgeWebSocket;

export function initializeGeminiLiveBridgeWebSocket(server: Server) {
    if (!geminiLiveBridgeWebSocket) {
        geminiLiveBridgeWebSocket = new GeminiLiveBridgeWebSocket(server);
    }
    return geminiLiveBridgeWebSocket;
}
