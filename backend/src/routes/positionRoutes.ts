import { Router } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';

const router = Router();

// GET endpoint para obtener candidatos por posición
router.get('/:id/candidates', getCandidatesByPosition);

export default router; 