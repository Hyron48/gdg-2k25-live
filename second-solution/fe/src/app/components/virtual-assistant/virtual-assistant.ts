import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {VirtualAssistantService} from '../../services/virtual-assistant.service';
import {NgOptimizedImage} from '@angular/common';
import {VirtualAssistantSocketService} from '../../services/virtual-assistant-socket.service';
import {WebSocketVitalStatus} from '../../helpers/websocket-vital-status.enum';

@Component({
    selector: 'app-virtual-assistant',
    imports: [
        NgOptimizedImage
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    template: `
        <div class="text-center w-full px-4 py-8">
            <div class="mb-6 flex justify-center">
                <img ngSrc="/rabbit-ears.svg" alt="rabbit-ears" width="300" height="212" priority=""/>
            </div>

            <h1 class="text-3xl md:text-4xl font-extrabold mb-4" style="color: #2267c5">
                Parla con Rabbit
            </h1>
            <p class="text-gray-400 mb-8 leading-relaxed">
                Avvia una nuova sessione per interagire con il tuo assistente virtuale personale.
            </p>

            <button
                class="hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                style="background-color: #2267c5"
                (click)="manageRecordingSession()">
                @if (isSessionRecording()) {
                    <span>Termina la sessione</span>
                } @else {
                    <span>Condividi lo schermo ed inizia a parlare</span>
                }
            </button>

            <div id="statusMessage" class="mt-8 text-lg font-semibold p-4 rounded-xl bg-gray-700 text-gray-300 hidden">
            </div>
        </div>
    `,
})
export class VirtualAssistant {
    private assistantLiveSessionService: VirtualAssistantService = inject(VirtualAssistantService);
    private virtualAssistantSocketService: VirtualAssistantSocketService = inject(VirtualAssistantSocketService);

    private pipWindow: Window | undefined;

    constructor() {
        effect(() => {
            if (this.virtualAssistantSocketService.getSocketVitalStatus() == WebSocketVitalStatus.CLOSED) {
                this.stopRecordPipWindowButton();
            }
        });
    }

    public isSessionRecording() {
        return this.assistantLiveSessionService.isSessionRecording();
    }

    public async manageRecordingSession() {
        if (this.isSessionRecording()) {
            this.stopRecordPipWindowButton();
        } else {
            await this.startRecordingSession();
        }
    }

    // Private Methods

    private async startRecordingSession() {
        await this.assistantLiveSessionService.startRecordingSession();

        if (this.pipWindow) {
            return;
        }

        this.pipWindow = await (window).documentPictureInPicture.requestWindow({
            disallowReturnToOpener: true,
            width: 265,
            height: 410,
        });
        const container = this.getPipWindowBodyHTML();
        this.pipWindow.document.body.append(container);
        this.pipWindow.document.body.style.backgroundColor = '#1F2937';

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'rabbit-template.css';
        this.pipWindow.document.head.appendChild(link);
    }

    private getPipWindowBodyHTML(): HTMLElement {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';

        container.innerHTML = `
            <div class="bunny-container">
                <div class="ear-left">
                    <div class="inner-ear"></div>
                </div>
                <div class="ear-right">
                    <div class="inner-ear"></div>
                </div>
                <div class="head">
                    <div class="face-mask talking">
                        <div class="eye"></div>
                        <div class="eye"></div>
                    </div>
                </div>
            </div>
            <button class="stop-button">Stop</button>
        `;

        const stopButton = container.querySelector('button');
        if (stopButton) {
            stopButton.addEventListener('click', () => this.stopRecordPipWindowButton());
        }

        return container;
    }

    private stopRecordPipWindowButton() {
        this.assistantLiveSessionService.stopRecordingSession();
        this.pipWindow?.window.close();
        this.pipWindow = undefined;
    }
}
