import { Schema, Document, model } from 'mongoose';

interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
  };
}

export interface IConversation extends Document {
  sessionId: string;
  userId?: string;
  messages: IMessage[];
  context: {
    department?: string;
    category?: string;
    lastQuestion?: string;
    userPreferences?: Record<string, any>;
  };
  status: 'active' | 'completed' | 'escalated';
  escalatedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: false
    },
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        intent: String,
        confidence: Number,
        suggestedActions: [String]
      }
    }],
    context: {
      department: String,
      category: String,
      lastQuestion: String,
      userPreferences: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'escalated'],
      default: 'active'
    },
    escalatedTo: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

export default model<IConversation>('Conversation', ConversationSchema);