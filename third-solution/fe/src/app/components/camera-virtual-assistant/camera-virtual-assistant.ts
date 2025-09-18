import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, Signal, viewChild} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {VirtualAssistantService} from '../../services/virtual-assistant.service';
import {VirtualAssistantSocketService} from '../../services/virtual-assistant-socket.service';
import {VirtualAssistantHttpService} from '../../services/virtual-assistant-http.service';
import {Router} from '@angular/router';
import {WebSocketVitalStatus} from '../../helpers/websocket-vital-status.enum';
import {tap} from 'rxjs';
import {AuthToken} from '@google/genai';

@Component({
    selector: 'app-camera-virtual-assistant',
    imports: [
        NgOptimizedImage
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="text-center w-full px-4 py-8">
            <div class="mb-6 flex justify-center">
                <img ngSrc="/armochromy-rabbit-ears.png" alt="rabbit-ears" width="300" height="212" priority=""/>
            </div>

            <h1 class="text-3xl md:text-4xl font-extrabold mb-4" style="color: #2267c5">
                🎨 Parla con Rabbit, il raffinato esperto di armocromia
            </h1>
            <p class="text-gray-400 mb-8 leading-relaxed">
                Bonjour!
                <br>
                Lascia che un vero intenditore di eleganza analizzi i tuoi colori e riveli la palette più sublime per te.
            </p>

            <div class="flex flex-col items-center">
                <button
                    class="hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out w-fit transform hover:scale-105 active:scale-95 my-4"
                    style="background-color: #2267c5"
                    (click)="manageRecordingSession()">
                    @if (isSessionRecording()) {
                        <span>Termina la sessione</span>
                    } @else {
                        <span>📸 Inizia l’analisi dei tuoi colori</span>
                    }
                </button>
                <video class="video w-[500px]"
                       #video
                       autoplay
                       [class.h-0]="!isSessionRecording()"
                       [class.invisible]="!isSessionRecording()">
                </video>
                @if (!isSessionRecording()) {
                    <button
                        class="hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 ease-in-out w-fit transform hover:scale-105 active:scale-95 my-4"
                        style="background-color: #2267c5"
                        (click)="navigateToScreenAssistant()">
                        🍕 Torna d’‘o pizzaiuolo
                    </button>
                }
            </div>
        </div>
    `
})
export class CameraVirtualAssistant {
    private virtualAssistantService: VirtualAssistantService = inject(VirtualAssistantService);
    private virtualAssistantSocketService: VirtualAssistantSocketService = inject(VirtualAssistantSocketService);
    private virtualAssistantHttpService: VirtualAssistantHttpService = inject(VirtualAssistantHttpService);
    private router: Router = inject(Router);

    public videoElementRef: Signal<ElementRef<HTMLVideoElement> | undefined> = viewChild('video');

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

    public navigateToScreenAssistant() {
        this.router.navigate(['/']);
    }

    // Private Methods

    private async startRecordingSession() {
        this.virtualAssistantHttpService.generateEphemeralToken().pipe(
            tap(async (token: AuthToken) => {
                if (!this.videoElementRef()?.nativeElement) {
                    return;
                }
                const isConnectionStable = await this.virtualAssistantService.startRecordingCameraSession(token, this.videoElementRef()!.nativeElement);

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
            })
        ).subscribe();
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
