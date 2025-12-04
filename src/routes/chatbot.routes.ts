import { Router } from 'express';
import {
  handleChatQuery,
  getConversationHistory,
  escalateToHuman
} from '../controllers/chatbot.controller';

const router = Router();

router.post('/query', handleChatQuery);
router.get('/conversation/:sessionId', getConversationHistory);
router.post('/escalate', escalateToHuman);

export default router;