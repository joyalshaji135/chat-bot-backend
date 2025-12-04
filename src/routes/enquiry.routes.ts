import { Router } from 'express';
import {
  createEnquiry,
  searchEnquiries,
  updateEnquiry,
  deleteEnquiry
} from '../controllers/enquiry.controller';

const router = Router();

// Make all routes public for now
router.post('/', createEnquiry);
router.get('/search', searchEnquiries);
router.put('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);

export default router;