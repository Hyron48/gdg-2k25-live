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
    template: `
        <div class="text-center w-full px-4 py-8">
            <div class="mb-6 flex justify-center">
                <img ngSrc="/rabbit-ears.svg" alt="rabbit-ears" width="300" height="212" priority=""/>
            </div>

            <h1 class="text-3xl md:text-4xl font-extrabold mb-4" style="color: #2267c5">
                🐰 Chiacchiera cu’ Rabbit!
            </h1>
            <p class="text-gray-400 mb-8 leading-relaxed">
                Uè uagliò, Campobasso t’aspetta! 😍
                <br>
                Nun sai comm’ arrivà? Tranquill’, ci pens’ Rabbit!
                <br>
                Avvia ‘na sessione e facimme due chiacchiere: t’aiuto passo passo a prenotà i biglietti e a goderti la città bella bella!
            </p>

            <button
                class="hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95"
                style="background-color: #2267c5"
                (click)="manageRecordingSession()">
                @if (isSessionRecording()) {
                    <span>Termina la sessione</span>
                } @else {
                    <span>💛 Vieni, parlam’ cu’ Rabbit e partimm’ pe’ Campobasso!</span>
                }
            </button>

            <div id="statusMessage" class="mt-8 text-lg font-semibold p-4 rounded-xl bg-gray-700 text-gray-300 hidden">
            </div>
        </div>
    `,
})
export class VirtualAssistant {
    private virtualAssistantService: VirtualAssistantService = inject(VirtualAssistantService);
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
        return this.virtualAssistantService.isSessionRecording();
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
        const isConnectionStable = await this.virtualAssistantService.startRecordingSession();
        if (this.pipWindow || !isConnectionStable) {
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
        this.virtualAssistantService.stopRecordingSession();
        this.pipWindow?.window.close();
        this.pipWindow = undefined;
    }
}
