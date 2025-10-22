// ============================================
// ROUTES (routes/bracket.js)
// ============================================
import express from 'express';
import { getBracketStructure } from '../controllers/bracket.js';

const bracketRouter = express.Router();

// Public route - users can view bracket
bracketRouter.get('/:tournamentId', getBracketStructure);

export default bracketRouter;