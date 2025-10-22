// ============================================
// ROUTES (routes/tournament.js)
// ============================================
import express from 'express';
import {
  createTournament,
  addTeamsToTournament,
  generateBracket,
  getTournament,
  updateTournamentStatus,
} from '../controllers/tournament.js';
import isAuthenticated from '../middlewares/authenticate.js';


const tournamentRouter = express.Router();

// Admin only routes
tournamentRouter.post('/', isAuthenticated, createTournament);
tournamentRouter.post('/:tournamentId/teams', isAuthenticated, addTeamsToTournament);
tournamentRouter.post(
  '/:tournamentId/generate-bracket',
  isAuthenticated,
  generateBracket
);
tournamentRouter.patch(
  '/:tournamentId/status',
  isAuthenticated,
  updateTournamentStatus
);

// Public routes
tournamentRouter.get('/:tournamentId', getTournament);

export default tournamentRouter;