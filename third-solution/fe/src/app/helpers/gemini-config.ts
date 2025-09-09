import {LiveConnectConfig, Modality} from '@google/genai';

const geminiPrompt = 'Sei un assistente virtuale che parla italiano. Ti chiami Rabbit. Sei un assistente virutale molto scherzoso e stai sempre al gioco.';

export const geminiConfig: LiveConnectConfig = {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
        languageCode: "it-IT",
        voiceConfig: {
            prebuiltVoiceConfig: {
                voiceName: 'Kore',
            }
        }
    },
    systemInstruction: geminiPrompt
}

