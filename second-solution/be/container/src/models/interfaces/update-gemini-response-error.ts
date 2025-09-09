export interface UpdateGeminiResponseError {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: unknown;
}