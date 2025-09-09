export enum UpdateGeminiPromptResponseStatus {
    SUCCESS = 'SUCCESS',
    CACHE = 'CACHE',
    ERROR = 'ERROR'
}

export type UpdateGeminiPromptResponseStatusType =
    UpdateGeminiPromptResponseStatus.SUCCESS
    | UpdateGeminiPromptResponseStatus.CACHE
    | UpdateGeminiPromptResponseStatus.ERROR;