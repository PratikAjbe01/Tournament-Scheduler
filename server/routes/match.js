// ============================================
// ROUTES (routes/match.js)
// ============================================
import express from 'express';
import {
  getAllMatches,
  getMatchDetails,
  markWinner,
  editWinner,
} from '../controllers/match.js';
import isAuthenticated from '../middlewares/authenticate.js';

const matchRouter = express.Router();

// Public routes
matchRouter.get('/tournament/:tournamentId', getAllMatches);
matchRouter.get('/:matchId', getMatchDetails);

// Admin only routes
matchRouter.patch('/:matchId/winner', isAuthenticated, markWinner);
matchRouter.patch('/:matchId/edit-winner', isAuthenticated, editWinner);

export default matchRouter;