import {Injectable, signal} from '@angular/core';
import {WebSocketVitalStatus, WebSocketVitalStatusType} from '../helpers/websocket-vital-status.enum';
import {GoogleGenAI, LiveServerMessage, Session} from '@google/genai';
import {geminiConfig} from '../helpers/gemini-config';

@Injectable({
    providedIn: 'root'
})
export class VirtualAssistantSocketService {
    public $_socketVitalStatus = signal<WebSocketVitalStatusType>(WebSocketVitalStatus.CLOSED);
    private $_isPlaying = signal<boolean>(false);

    private audioQueue: string[] = [];
    private audioContext: AudioContext | undefined;
    private audioSourceNode: AudioBufferSourceNode | undefined;

    // Gemini Config
    private geminiAi: GoogleGenAI;
    private session: Session | undefined;

    constructor() {
        this.geminiAi = new GoogleGenAI({
            apiKey: 'your-api-key'
        });
    }

    public getSocketVitalStatus(): WebSocketVitalStatus {
        return this.$_socketVitalStatus();
    }

    public setSocketVitalStatus(status: WebSocketVitalStatusType) {
        this.$_socketVitalStatus.set(status);
    }

    public async connect() {
        if (this.$_socketVitalStatus() == WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.session = await this.geminiAi.live.connect({
            model: 'gemini-2.0-flash-live-001',
            config: geminiConfig,
            callbacks: {
                onmessage: (message: LiveServerMessage) => this.handleIncomingMessage(message),
                onerror: () => {
                    this.setSocketVitalStatus(WebSocketVitalStatus.ERROR);
                },
                onclose: (closeEvent: CloseEvent) => {
                    this.setSocketVitalStatus(WebSocketVitalStatus.CLOSED)
                },
            }
        });
        if (this.session) {
            this.session.sendRealtimeInput({
                text: 'Inizia la conversazione.'
            });
        }
        this.setSocketVitalStatus(WebSocketVitalStatus.ACTIVE);
    }

    public sendAudioChunk(payload: string) {
        if (!this.session || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        try {
            // Why sendRealtimeInput instead of sendClientContent?
            // https://ai.google.dev/gemini-api/docs/live-guide?hl=it#use-automatic-vad
            this.session.sendRealtimeInput({
                audio: {
                    data: payload,
                    mimeType: 'audio/pcm'
                },
            });
        } catch (error) {
            throw Error('Errore durante l\'invio del chunk audio: ' + error);
        }
    }

    public sendImageFrame(payload: string) {
        if (!this.session || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        try {
            // Why send image instead of video?
            // https://ai.google.dev/gemini-api/docs/live-guide?hl=it#maximum-session-duration
            this.session.sendRealtimeInput({
                media: {
                    data: payload.split(';base64,').pop(),
                    mimeType: 'image/jpeg'
                }
            });
        } catch (error) {
            throw Error('Errore durante l\'invio dell\'immagine: ' + error);
        }
    }

    public closeConnection() {
        if (!this.session || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.session.close();
        this.session = undefined;
        this.stopAudioPlayer();
        this.setSocketVitalStatus(WebSocketVitalStatus.CLOSED);
    }

    // Private methods

    private handleIncomingMessage(response: LiveServerMessage) {
        if (response.setupComplete) {
            return;
        }
        if (response.serverContent?.turnComplete) {
            this.stopAudioPlayer();
            return;
        }
        if (response.serverContent?.modelTurn?.parts) {
            const parts: string[] = response.serverContent?.modelTurn?.parts.map(part => part.inlineData?.data)
                .filter(el => typeof el === 'string');
            this.audioQueue = [...this.audioQueue, ...parts];
            if (!this.$_isPlaying()) {
                this.playAudioQueue();
            }
        }
    }

    private async playAudioQueue() {
        if (this.audioQueue.length === 0) {
            this.$_isPlaying.set(false);
            return;
        }
        this.$_isPlaying.set(true);
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new AudioContext({sampleRate: 24000});
        }
        const base64String = this.audioQueue.shift() ?? '';
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBuffer = bytes.buffer;
        const pcm16Data = new Int16Array(audioBuffer);
        const audioBufferToPlay = this.audioContext.createBuffer(1, pcm16Data.length, 24000);
        const channelData = audioBufferToPlay.getChannelData(0);
        for (let i = 0; i < pcm16Data.length; i++) {
            channelData[i] = pcm16Data[i] / 32768.0;
        }
        this.audioSourceNode = this.audioContext.createBufferSource();
        this.audioSourceNode.buffer = audioBufferToPlay;
        this.audioSourceNode.connect(this.audioContext.destination);
        this.audioSourceNode.onended = () => this.playAudioQueue();
        this.audioSourceNode.start();
    }

    private stopAudioPlayer() {
        this.audioQueue = [];
        this.audioSourceNode?.stop();
        this.$_isPlaying.set(false);
    }
}
