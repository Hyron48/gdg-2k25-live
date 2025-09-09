import { Router } from 'express';
import {
    generateEphemeralToken,
    pingServer,
} from '../../controllers/v1/server.controller';

const router = Router();

router.get('/ping-server', pingServer);
router.get('/generate-ephemeral-token', generateEphemeralToken);

export default router;
