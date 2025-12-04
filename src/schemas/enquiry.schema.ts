import { Schema, Document, model } from 'mongoose';

export interface IEnquiry extends Document {
  category: string;
  subcategory?: string;
  question: string;
  answer: string;
  tags: string[];
  department: string;
  confidenceScore?: number;
  metadata?: {
    lastUpdated: Date;
    updatedBy: string;
    source: string;
    priority: 'low' | 'medium' | 'high';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    category: {
      type: String,
      required: true,
      enum: ['products', 'services', 'support', 'billing', 'hr', 'technical', 'general']
    },
    subcategory: {
      type: String,
      required: false
    },
    question: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    department: {
      type: String,
      required: true,
      enum: ['sales', 'support', 'technical', 'hr', 'finance', 'marketing']
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    metadata: {
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: String,
        default: 'system'
      },
      source: {
        type: String,
        enum: ['manual', 'import', 'api'],
        default: 'manual'
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Text index for search
EnquirySchema.index({ question: 'text', answer: 'text', tags: 'text' });
EnquirySchema.index({ category: 1, department: 1, isActive: 1 });

export default model<IEnquiry>('Enquiry', EnquirySchema);