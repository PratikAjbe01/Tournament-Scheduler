import express from 'express';
import {
  getTeamsInTournament,
  getTeamDetails,
  getTeamsWithBye,
  getTeamsByStanding,
  updateTeam,
  deleteTeam,
  getTeamStats,
  searchTeams,
  bulkUpdateStanding,
} from '../controllers/team.js';
import isAuthenticated from '../middlewares/authenticate.js';

const teamRouter = express.Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Get all teams in a tournament
teamRouter.get('/tournament/:tournamentId', getTeamsInTournament);

// Get single team details
teamRouter.get('/:teamId', getTeamDetails);

// Get teams with bye status for a tournament
teamRouter.get('/tournament/:tournamentId/bye', getTeamsWithBye);

// Get teams by previous standing
teamRouter.get('/tournament/:tournamentId/standing', getTeamsByStanding);

// Get team statistics
teamRouter.get('/:teamId/stats', getTeamStats);

// Search teams in tournament
teamRouter.get('/tournament/:tournamentId/search', searchTeams);

// ============================================
// ADMIN ROUTES (Auth required)
// ============================================

// Update team details
teamRouter.patch('/:teamId', isAuthenticated, updateTeam);

// Delete team
teamRouter.delete('/:teamId', isAuthenticated, deleteTeam);

// Bulk update team standings
teamRouter.patch(
  '/tournament/:tournamentId/bulk-update-standing',
  isAuthenticated,
  bulkUpdateStanding
);

export default teamRouter;