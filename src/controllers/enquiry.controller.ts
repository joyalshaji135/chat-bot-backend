import { Request, Response } from 'express';
import EnquiryModel from '../schemas/enquiry.schema';
import Joi from 'joi';

const enquirySchema = Joi.object({
  category: Joi.string().valid(
    'products', 'services', 'support', 'billing', 'hr', 'technical', 'general'
  ).required(),
  subcategory: Joi.string().optional(),
  question: Joi.string().min(5).max(500).required(),
  answer: Joi.string().min(10).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  department: Joi.string().valid(
    'sales', 'support', 'technical', 'hr', 'finance', 'marketing'
  ).required(),
  confidenceScore: Joi.number().min(0).max(1).optional(),
  metadata: Joi.object({
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    source: Joi.string().valid('manual', 'import', 'api').optional()
  }).optional()
});

export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = enquirySchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const enquiry = await EnquiryModel.create({
      ...value,
      metadata: {
        ...value.metadata,
        lastUpdated: new Date(),
        updatedBy: 'system' // Fixed: use hardcoded value
      }
    });

    res.status(201).json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const searchEnquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category, department, limit = 10, page = 1 } = req.query;

    const filter: any = { isActive: true };

    if (query) {
      filter.$text = { $search: query as string };
    }

    if (category) {
      filter.category = category;
    }

    if (department) {
      filter.department = department;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [enquiries, total] = await Promise.all([
      EnquiryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      EnquiryModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const enquiry = await EnquiryModel.findByIdAndUpdate(
      id,
      {
        ...updates,
        'metadata.lastUpdated': new Date(),
        'metadata.updatedBy': 'system' // Fixed: use hardcoded value
      },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
      return;
    }

    res.json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const deleteEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enquiry = await EnquiryModel.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        'metadata.lastUpdated': new Date(),
        'metadata.updatedBy': 'system'
      },
      { new: true }
    );

    if (!enquiry) {
      res.status(404).json({
        success: false,
        error: 'Enquiry not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Enquiry deactivated successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};