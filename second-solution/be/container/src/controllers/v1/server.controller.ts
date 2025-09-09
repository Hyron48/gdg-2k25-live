import { LiveServerMessage } from '@google/genai';
import { Request, Response } from 'express';
import { createReadStream, ReadStream } from 'fs';
import { UpdateGeminiPromptResponseStatus } from '../../helpers/update-gemini-prompt-response-status.enum';
import { GeminiService } from '../../services/gemini.service';
import { ServerService } from '../../services/server.service';

export const pingServer = (_: Request, res: Response): void => {
    res.send("Hello World!");
};

export const testGeminiSocket = async (_: Request, res: Response): Promise<void> => {
    await execTestGeminiSocket(res);
};

export const getActualGeminiPrompt = async (_: Request, res: Response): Promise<void> => {
    res.status(200).json({
        geminiPrompt: ServerService.getInstance().getGeminiPrompt()
    });
};

export default {
    pingServer,
    testGeminiSocket,
    getActualGeminiPrompt
};

async function execTestGeminiSocket(res: Response) {
    const geminiService = new GeminiService();
    let audioStream: ReadStream | undefined = undefined;

    try {
        await geminiService.startSession({
            onmessage: (response: LiveServerMessage) => {
                if (response.serverContent?.turnComplete) {
                    res.status(200).send('Audio di Gemini generato correttamente.');
                    cleanup(audioStream, geminiService);
                }
            },
            onerror: (error: ErrorEvent) => {
                res.status(500).send('Errore durante la sessione Gemini: ' + error);
                cleanup(audioStream, geminiService);
            }
        });

        audioStream = createReadStream('./public/sample.wav');

        audioStream.on('data', (chunk) => {
            console.log('Inoltro chunk audio base64. Dimensione stringa: ' + chunk.length);
            geminiService.sendAudioChunk(chunk.toString('base64'));
        });

        audioStream.on('error', (error) => {
            res.status(500).send('Errore durante la lettura del file audio di test: ' + error);
            cleanup(audioStream, geminiService);
        });

    } catch (error) {
        res.status(500).send('Errore durante l\'avvio della sessione: ' + error);
        cleanup(audioStream, geminiService);
    }
}

function cleanup(audioStream: ReadStream | undefined, geminiService: GeminiService) {
    if (audioStream) {
        audioStream.destroy();
        audioStream = undefined;
    }
    geminiService.closeSession();
}
