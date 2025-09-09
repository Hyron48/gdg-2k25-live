import { readFileSync } from 'fs';
import { UpdateGeminiResponse } from '../models/update-gemini-response';

export class ServerService {
    private static instance: ServerService;
    private readonly geminiPrompt: string = '';
    private defaultGeminiPromptPath: string = './public/gemini-prompt.txt';

    constructor() {
        this.geminiPrompt = readFileSync(this.defaultGeminiPromptPath, 'utf-8');
    }

    public static getInstance(): ServerService {
        if (!ServerService.instance) {
            ServerService.instance = new ServerService();
        }
        return ServerService.instance;
    }

    public getGeminiPrompt(): string {
        return this.geminiPrompt;
    }
}
