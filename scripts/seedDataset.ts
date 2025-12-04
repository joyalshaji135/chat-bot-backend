import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EnquiryModel from '../src/schemas/enquiry.schema';
import CompanyDataModel from '../src/schemas/company-data.schema';

dotenv.config();

const sampleEnquiries = [
  {
    category: 'products',
    question: 'What are the specifications of your flagship product?',
    answer: 'Our flagship product features include: 1) High-performance processor, 2) 8GB RAM, 3) 256GB SSD storage, 4) 15.6" display, 5) 8-hour battery life, and 6) Comprehensive warranty.',
    tags: ['specifications', 'features', 'product details'],
    department: 'sales',
    confidenceScore: 0.95,
    metadata: {
      source: 'manual',
      priority: 'high'
    }
  },
  {
    category: 'support',
    question: 'How do I reset my account password?',
    answer: 'To reset your password: 1) Go to login page, 2) Click "Forgot Password", 3) Enter your email, 4) Check email for reset link, 5) Create new password.',
    tags: ['password', 'account', 'login'],
    department: 'technical',
    confidenceScore: 0.98,
    metadata: {
      source: 'manual',
      priority: 'medium'
    }
  },
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept: Credit cards (Visa, MasterCard, American Express), PayPal, Bank transfers, and Purchase orders for enterprise customers.',
    tags: ['payment', 'billing', 'credit card'],
    department: 'finance',
    confidenceScore: 0.99
  }
];

const sampleCompanyData = [
  {
    dataType: 'policy',
    title: 'Refund Policy',
    content: 'Full refund within 30 days of purchase if product is unopened. Partial refund after 30 days subject to 15% restocking fee.',
    keywords: ['refund', 'return', 'money back', 'policy', '30 days'],
    department: ['finance', 'sales'],
    accessLevel: 'public'
  },
  {
    dataType: 'faq',
    title: 'Shipping Information',
    content: 'Standard shipping: 3-5 business days. Express shipping: 1-2 business days. International shipping: 7-14 business days depending on destination.',
    keywords: ['shipping', 'delivery', 'express', 'international'],
    department: ['sales', 'support'],
    accessLevel: 'public'
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_chatbot';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    console.log('Clearing existing data...');
    
    await EnquiryModel.deleteMany({});
    await CompanyDataModel.deleteMany({});
    
    console.log('Seeding enquiry data...');
    const enquiries = await EnquiryModel.insertMany(sampleEnquiries);
    console.log(`Created ${enquiries.length} enquiries`);
    
    console.log('Seeding company data...');
    const companyData = await CompanyDataModel.insertMany(sampleCompanyData);
    console.log(`Created ${companyData.length} company data entries`);
    
    console.log('Database seeded successfully!');
    console.log('\nSample questions you can ask:');
    sampleEnquiries.forEach((enquiry, index) => {
      console.log(`${index + 1}. ${enquiry.question}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();