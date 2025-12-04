import { IEnquiry } from '../schemas/enquiry.schema';
import { IConversation } from '../schemas/conversation.schema';
import EnquiryModel from '../schemas/enquiry.schema';
import ConversationModel from '../schemas/conversation.schema';
import CompanyDataModel from '../schemas/company-data.schema';
import { NLPProcessor } from './nlp-processor';
import { v4 as uuidv4 } from 'uuid';

interface ChatResponse {
  answer: string;
  confidence: number;
  source: string;
  suggestedQuestions?: string[];
  metadata?: Record<string, any>;
}

export class ChatbotService {
  private nlpProcessor: NLPProcessor;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
  }

  async findBestMatch(question: string): Promise<ChatResponse | null> {
    // Step 1: Direct text search
    const directMatches = await EnquiryModel.find(
      { $text: { $search: question }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5);

    if (directMatches.length > 0 && (directMatches[0] as any).score > 2) {
      const bestMatch = directMatches[0];
      return {
        answer: bestMatch.answer,
        confidence: bestMatch.confidenceScore || 0.9,
        source: 'enquiry_database',
        suggestedQuestions: await this.getSuggestedQuestions(bestMatch.category),
        metadata: {
          category: bestMatch.category,
          department: bestMatch.department,
          tags: bestMatch.tags
        }
      };
    }

    // Step 2: Semantic similarity search
    const allEnquiries = await EnquiryModel.find({ isActive: true }).limit(100);
    let bestSimilarity = 0;
    let bestEnquiry: IEnquiry | null = null;

    for (const enquiry of allEnquiries) {
      const similarity = this.nlpProcessor.calculateSimilarity(question, enquiry.question);
      if (similarity > bestSimilarity && similarity > 0.5) {
        bestSimilarity = similarity;
        bestEnquiry = enquiry;
      }
    }

    if (bestEnquiry) {
      return {
        answer: bestEnquiry.answer,
        confidence: bestSimilarity,
        source: 'semantic_match',
        suggestedQuestions: await this.getSuggestedQuestions(bestEnquiry.category),
        metadata: {
          category: bestEnquiry.category,
          department: bestEnquiry.department,
          tags: bestEnquiry.tags
        }
      };
    }

    // Step 3: Search in company data
    const companyData = await CompanyDataModel.find(
      { 
        $text: { $search: question },
        isActive: true,
        accessLevel: 'public'
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3);

    if (companyData.length > 0) {
      return {
        answer: `Based on our company information: ${companyData[0].content}`,
        confidence: 0.7,
        source: 'company_data',
        metadata: {
          dataType: companyData[0].dataType,
          title: companyData[0].title,
          keywords: companyData[0].keywords
        }
      };
    }

    return null;
  }

  async handleQuery(
    question: string, 
    sessionId?: string, 
    context?: any
  ): Promise<ChatResponse> {
    let conversation: IConversation | null = null;

    // Get or create conversation
    if (sessionId) {
      conversation = await ConversationModel.findOne({ sessionId });
    }

    if (!conversation) {
      sessionId = uuidv4();
      conversation = await ConversationModel.create({
        sessionId,
        messages: [],
        context: context || {},
        status: 'active'
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: question,
      timestamp: new Date(),
      metadata: {
        intent: this.nlpProcessor.detectIntent(question),
        confidence: 1
      }
    });

    // Find best match
    const response = await this.findBestMatch(question);

    if (response) {
      // Add assistant response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          suggestedActions: response.suggestedQuestions
        }
      });

      // Update conversation context
      if (response.metadata?.category) {
        conversation.context.category = response.metadata.category;
      }
      if (response.metadata?.department) {
        conversation.context.department = response.metadata.department;
      }

      await conversation.save();

      return {
        ...response,
        metadata: {
          ...response.metadata,
          sessionId: conversation.sessionId
        }
      };
    }

    // Fallback response
    const fallbackResponse: ChatResponse = {
      answer: "I'm sorry, I don't have enough information to answer that question specifically. Could you please contact our support team for further assistance?",
      confidence: 0,
      source: 'fallback',
      suggestedQuestions: await this.getGeneralQuestions()
    };

    // Add fallback response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: fallbackResponse.answer,
      timestamp: new Date(),
      metadata: {
        confidence: 0,
        suggestedActions: ['Contact Support', 'Browse FAQ']
      }
    });

    conversation.status = 'escalated';
    conversation.escalatedTo = 'support';

    await conversation.save();

    return {
      ...fallbackResponse,
      metadata: { sessionId: conversation.sessionId }
    };
  }

  private async getSuggestedQuestions(category: string): Promise<string[]> {
    const questions = await EnquiryModel.find({
      category,
      isActive: true
    })
    .limit(5)
    .select('question');

    return questions.map(q => q.question);
  }

  private async getGeneralQuestions(): Promise<string[]> {
    const questions = await EnquiryModel.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 5 } },
      { $project: { question: 1 } }
    ]);

    return questions.map(q => q.question);
  }

  async getConversationHistory(sessionId: string): Promise<IConversation | null> {
    return ConversationModel.findOne({ sessionId });
  }

  async escalateConversation(sessionId: string, department: string): Promise<void> {
    await ConversationModel.updateOne(
      { sessionId },
      {
        status: 'escalated',
        escalatedTo: department,
        $push: {
          messages: {
            role: 'system',
            content: `Conversation escalated to ${department} department`,
            timestamp: new Date()
          }
        }
      }
    );
  }
}