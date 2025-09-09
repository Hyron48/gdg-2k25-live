import { GeminiSocketTypeMessage } from '../../helpers/gemini-socket-type-message.enum';

export interface AssistantMessage {
    type: GeminiSocketTypeMessage;
    payload?: string;
}
