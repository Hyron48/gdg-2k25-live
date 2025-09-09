import {effect, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {WebSocketVitalStatus} from '../helpers/websocket-vital-status.enum';
import {VirtualAssistantSocketService} from './virtual-assistant-socket.service';
import {AuthToken} from '@google/genai';

@Injectable({
    providedIn: 'root'
})
export class VirtualAssistantService {
    private _$isRecording: WritableSignal<boolean> = signal(false);
    private audioContext: AudioContext | undefined;
    private audioWorkletNode: AudioWorkletNode | undefined;
    private audioStreamSource: MediaStreamAudioSourceNode | undefined;
    private screenStream: MediaStream | null = null;
    private screenCaptureInterval: ReturnType<typeof setInterval> | undefined;
    private assistantLiveSessionSocketService: VirtualAssistantSocketService = inject(VirtualAssistantSocketService);

    constructor() {
        effect(() => {
            if ([WebSocketVitalStatus.CLOSED, WebSocketVitalStatus.ERROR].includes(this.assistantLiveSessionSocketService.getSocketVitalStatus())) {
                this.stopRecordingSession();
            }
        });
    }

    public isSessionRecording(): boolean {
        return this._$isRecording();
    }

    public async startRecordingSession(token: AuthToken) {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
            const audioStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});

            await this.assistantLiveSessionSocketService.connect(token);
            this.startScreenCapture();
            await this.setupAudioStreaming(audioStream);

            this._$isRecording.set(true);
        } catch (error) {
            console.error('Error starting recording session => ', error);
        }
    }

    private async setupAudioStreaming(stream: MediaStream) {
        this.audioContext = new AudioContext({sampleRate: 16000});
        await this.audioContext.audioWorklet.addModule('audio/recorder-worklet.js');

        this.audioStreamSource = this.audioContext.createMediaStreamSource(stream);
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet-processor');

        this.audioStreamSource.connect(this.audioWorkletNode);

        this.audioWorkletNode.port.onmessage = (event) => {
            const pcm16Data = new Int16Array(event.data);
            const base64String = this.arrayBufferToBase64(pcm16Data.buffer);
            this.assistantLiveSessionSocketService.sendAudioChunk(base64String);
        };
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private startScreenCapture() {
        if (!this.screenStream) {
            return;
        }
        const video = document.createElement('video');
        video.srcObject = this.screenStream;
        video.play();

        this.screenStream.getTracks().forEach(track => track.onended = () => this.stopRecordingSession());

        this.screenCaptureInterval = setInterval(async () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    this.assistantLiveSessionSocketService.sendImageFrame(imageData);
                }
            } catch (error) {
                console.error('Errore durante la cattura dello screenshot:', error);
            }
        }, 1000);
    }

    public stopRecordingSession() {
        if (this.screenCaptureInterval) {
            clearInterval(this.screenCaptureInterval);
            this.screenCaptureInterval = undefined;
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
            }
        }
        if (this.audioContext) {
            this.audioStreamSource?.disconnect();
            this.audioStreamSource?.mediaStream.getTracks().forEach(track => track.stop());
            this.audioWorkletNode?.disconnect();
            if (this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        }

        this.assistantLiveSessionSocketService.closeConnection();
        this._$isRecording.set(false);
    }
}
