import express from 'express';
import cors from 'cors';
import {createServer} from 'http';
import v1Routes from "./routes/v1";
import {initializeGeminiLiveBridgeWebSocket} from './web-socket/v1/gemini-live-bridge.websocket';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8080;

const CORS_OPT = {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(express.json());
app.use('/api/v1', cors(CORS_OPT), v1Routes);
initializeGeminiLiveBridgeWebSocket(server);

server.listen(port, () => console.log(`Server in esecuzione`));
