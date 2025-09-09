import {Injectable, signal} from '@angular/core';
import {WebSocketSubject} from 'rxjs/internal/observable/dom/WebSocketSubject';
import {webSocket} from 'rxjs/webSocket';
import {AssistantMessage} from '../models/interfaces/assistant-message';
import {WebSocketVitalStatus, WebSocketVitalStatusType} from '../helpers/websocket-vital-status.enum';
import {GeminiSocketTypeMessage} from '../helpers/gemini-socket-type-message.enum';

@Injectable({
    providedIn: 'root'
})
export class VirtualAssistantSocketService {
    private socket$: WebSocketSubject<AssistantMessage> | undefined;

    public $_socketVitalStatus = signal<WebSocketVitalStatusType>(WebSocketVitalStatus.CLOSED);

    private audioQueue: string[] = [];
    private audioContext: AudioContext | undefined;
    private audioSourceNode: AudioBufferSourceNode | undefined;
    private isPlaying: boolean = false;

    public getSocketVitalStatus(): WebSocketVitalStatus {
        return this.$_socketVitalStatus();
    }

    public setSocketVitalStatus(status: WebSocketVitalStatusType) {
        this.$_socketVitalStatus.set(status);
    }

    public connect() {
        if (this.$_socketVitalStatus() == WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.socket$ = webSocket('ws://localhost:8080');
        this.socket$.subscribe({
            next: (msg: AssistantMessage) => this.handleIncomingMessage(msg),
            error: () => this.setSocketVitalStatus(WebSocketVitalStatus.ERROR),
            complete: () => this.setSocketVitalStatus(WebSocketVitalStatus.CLOSED)
        });

        this.setSocketVitalStatus(WebSocketVitalStatus.ACTIVE);
    }

    public sendAudioChunk(payload: string) {
        if (!this.socket$ || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.socket$.next({type: GeminiSocketTypeMessage.AUDIO_PART, payload});
    }

    public sendImageFrame(payload: string) {
        if (!this.socket$ || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.socket$.next({type: GeminiSocketTypeMessage.IMAGE_PART, payload});
    }

    public closeConnection() {
        if (!this.socket$ || this.getSocketVitalStatus() !== WebSocketVitalStatus.ACTIVE) {
            return;
        }
        this.socket$.complete();
        this.stopAudioPlayer();
        this.setSocketVitalStatus(WebSocketVitalStatus.CLOSED);
    }

    // Private methods

    private handleIncomingMessage(message: AssistantMessage) {
        switch (message.type) {
            case GeminiSocketTypeMessage.AUDIO_PART:
                if (message?.payload) {
                    this.audioQueue.push(message.payload);
                }

                if (!this.isPlaying) {
                    this.playAudioQueue();
                }
                break;
            case GeminiSocketTypeMessage.TURN_COMPLETE:
                this.stopAudioPlayer();
                break;
            case GeminiSocketTypeMessage.SETUP_COMPLETE:
                break;
            case GeminiSocketTypeMessage.ERROR:
                this.$_socketVitalStatus.set(WebSocketVitalStatus.ERROR);
                break;
        }
    }

    private async playAudioQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;

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
        this.isPlaying = false;
    }
}
