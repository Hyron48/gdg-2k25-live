import {Request, Response} from 'express';
import {GoogleGenAI} from '@google/genai';

export const pingServer = (_: Request, res: Response): void => {
    res.send("Hello World!");
};

export const generateEphemeralToken = (_: Request, res: Response): void => {
    const client = new GoogleGenAI({
        apiKey: 'your-api-key'
    });

    client.authTokens.create({
        config: {
            uses: 1,
            httpOptions: {apiVersion: 'v1alpha'},
        },
    }).then(
        (token) => res.status(200).json(token),
        (error) => res.status(500).json({error})
    );
}
