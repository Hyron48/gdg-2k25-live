import { Router } from 'express';
import {
    getActualGeminiPrompt,
    pingServer,
    testGeminiSocket,
} from '../../controllers/v1/server.controller';

const router = Router();

router.get('/ping-server', pingServer);
router.get('/test-gemini-socket', testGeminiSocket);
router.get('/get-gemini-prompt', getActualGeminiPrompt);

export default router;
