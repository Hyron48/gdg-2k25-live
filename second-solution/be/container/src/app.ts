import express from 'express';
import {createServer} from 'http';
import {initializeGeminiLiveBridgeWebSocket} from './web-socket/v1/gemini-live-bridge.websocket';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8080;

app.use(express.json());
initializeGeminiLiveBridgeWebSocket(server);

server.listen(port, () => console.log(`Server in esecuzione`));
