import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';
import Joi from 'joi';

const chatbotService = new ChatbotService();

const querySchema = Joi.object({
  question: Joi.string().min(1).max(500).required(),
  sessionId: Joi.string().uuid(),
  context: Joi.object()
});

export const handleChatQuery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = querySchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { question, sessionId, context } = value;
    
    const response = await chatbotService.handleQuery(question, sessionId, context);

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getConversationHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    const history = await chatbotService.getConversationHistory(sessionId);

    if (!history) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
      return;
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const escalateToHuman = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, department } = req.body;

    if (!sessionId || !department) {
      res.status(400).json({
        success: false,
        error: 'Session ID and department are required'
      });
      return;
    }

    await chatbotService.escalateConversation(sessionId, department);

    res.json({
      success: true,
      message: `Conversation escalated to ${department} department`
    });
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};