import { UpdateGeminiPromptResponseStatus, UpdateGeminiPromptResponseStatusType } from '../helpers/update-gemini-prompt-response-status.enum';
import { UpdateGeminiResponseError } from './interfaces/update-gemini-response-error';

export class UpdateGeminiResponse {
    public status: UpdateGeminiPromptResponseStatusType;
    public error?: UpdateGeminiResponseError;

    private constructor(status: UpdateGeminiPromptResponseStatusType, error?: UpdateGeminiResponseError) {
        this.status = status;
        this.error = error;
    }

    public static success(): UpdateGeminiResponse {
        return new UpdateGeminiResponse(UpdateGeminiPromptResponseStatus.SUCCESS);
    }

    public static cache(): UpdateGeminiResponse {
        return new UpdateGeminiResponse(UpdateGeminiPromptResponseStatus.CACHE);
    }

    public static error(status: number, statusText: string, body?: unknown): UpdateGeminiResponse {
        return new UpdateGeminiResponse(UpdateGeminiPromptResponseStatus.ERROR, {
            status,
            statusText,
            headers: {},
            body
        });
    }

    public static async fromHttpResponse(response: Response): Promise<UpdateGeminiResponse> {
        let errorBody: unknown;
        try {
            errorBody = await response.text();
        } catch {
            errorBody = 'Impossibile leggere il corpo della risposta';
        }

        const headers: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => headers[key] = value);

        return UpdateGeminiResponse.error(response.status, response.statusText, errorBody);
    }

    public static fromError(error: unknown): UpdateGeminiResponse {
        if (error instanceof Error) {
            return UpdateGeminiResponse.error(0, error.message, error.stack);
        }
        return UpdateGeminiResponse.error(0, 'Errore sconosciuto durante l\'aggiornamento del prompr Gemini', error);
    }
}
