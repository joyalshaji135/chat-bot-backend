import { Schema, Document, model } from 'mongoose';

export interface ICompanyData extends Document {
  dataType: 'faq' | 'product' | 'service' | 'policy' | 'procedure' | 'contact';
  title: string;
  content: string;
  keywords: string[];
  department: string[];
  accessLevel: 'public' | 'internal' | 'restricted';
  relatedDocuments?: string[];
  effectiveDate: Date;
  expiryDate?: Date;
  version: number;
  isActive: boolean;
}

const CompanyDataSchema = new Schema<ICompanyData>(
  {
    dataType: {
      type: String,
      required: true,
      enum: ['faq', 'product', 'service', 'policy', 'procedure', 'contact']
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    keywords: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    department: [{
      type: String,
      required: true
    }],
    accessLevel: {
      type: String,
      enum: ['public', 'internal', 'restricted'],
      default: 'public'
    },
    relatedDocuments: [String],
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: Date,
    version: {
      type: Number,
      default: 1
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

// Text index for full-text search
CompanyDataSchema.index({ title: 'text', content: 'text', keywords: 'text' });

export default model<ICompanyData>('CompanyData', CompanyDataSchema);