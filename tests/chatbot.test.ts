import request from 'supertest';
import app from '../src/server';
import { connectDB, disconnectDB } from '../src/config/database';

describe('Chatbot API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('POST /api/chatbot/query', () => {
    it('should respond to enquiry', async () => {
      const response = await request(app)
        .post('/api/chatbot/query')
        .send({
          question: 'What is your refund policy?'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('answer');
    });
  });
});