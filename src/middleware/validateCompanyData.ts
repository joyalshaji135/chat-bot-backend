import { Request, Response, NextFunction } from 'express';
import CompanyDataModel from '../schemas/company-data.schema';

export const validateCompanyData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure all data operations are within company dataset
    const { source } = req.body;
    
    if (source && source !== 'company') {
      res.status(403).json({
        success: false,
        error: 'Only company-specific data sources are allowed'
      });
      return;
    }

    // Check if data already exists (prevent duplicates)
    const { title, dataType } = req.body;
    
    if (title && dataType) {
      const existing = await CompanyDataModel.findOne({
        title: new RegExp(`^${title}$`, 'i'),
        dataType
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: 'Similar data already exists in company dataset'
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};