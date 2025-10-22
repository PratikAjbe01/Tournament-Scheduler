// ============================================
// controllers/team.js
// ============================================
import Team from '../models/team.js';
import Tournament from '../models/tournament.js';

// ============================================
// GET ALL TEAMS IN TOURNAMENT
// ============================================
export const getTeamsInTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Validate tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Fetch all teams in the tournament
    const teams = await Team.find({ tournamentId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: teams,
      count: teams.length,
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teams',
    });
  }
};

// ============================================
// GET SINGLE TEAM DETAILS
// ============================================
export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('tournamentId', 'name year status');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team',
    });
  }
};

// ============================================
// GET TEAMS WITH BYE STATUS
// ============================================
export const getTeamsWithBye = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Get tournament to find bye teams
    const tournament = await Tournament.findById(tournamentId)
      .populate('teamsWithBye');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tournament.teamsWithBye,
      count: tournament.teamsWithBye.length,
      message: `${tournament.teamsWithBye.length} teams received bye`,
    });
  } catch (error) {
    console.error('Error fetching bye teams:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bye teams',
    });
  }
};

// ============================================
// GET TEAMS BY PREVIOUS STANDING
// ============================================
export const getTeamsByStanding = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { standing } = req.query;

    const validStandings = ['winner', 'runnerUp', 'semiFinalist1', 'semiFinalist2', 'none'];

    if (standing && !validStandings.includes(standing)) {
      return res.status(400).json({
        success: false,
        message: `Invalid standing. Must be one of: ${validStandings.join(', ')}`,
      });
    }

    let query = { tournamentId };
    if (standing) {
      query.previousStanding = standing;
    }

    const teams = await Team.find(query);

    res.status(200).json({
      success: true,
      data: teams,
      count: teams.length,
      standing: standing || 'all',
    });
  } catch (error) {
    console.error('Error fetching teams by standing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch teams by standing',
    });
  }
};

// ============================================
// UPDATE TEAM DETAILS (Admin only)
// ============================================
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, logo, description, previousStanding } = req.body;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Validate previousStanding if provided
    if (previousStanding) {
      const validStandings = ['winner', 'runnerUp', 'semiFinalist1', 'semiFinalist2', 'none'];
      if (!validStandings.includes(previousStanding)) {
        return res.status(400).json({
          success: false,
          message: `Invalid standing. Must be one of: ${validStandings.join(', ')}`,
        });
      }
    }

    // Update only provided fields
    if (name) team.name = name.trim();
    if (logo) team.logo = logo;
    if (description) team.description = description.trim();
    if (previousStanding) team.previousStanding = previousStanding;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update team',
    });
  }
};

// ============================================
// DELETE TEAM (Admin only)
// ============================================
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Validate team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if tournament has bracket generated
    const tournament = await Tournament.findById(team.tournamentId);
    if (tournament.totalRounds > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team after bracket has been generated',
      });
    }

    // Remove team from tournament
    await Tournament.findByIdAndUpdate(
      team.tournamentId,
      {
        $pull: { teams: teamId },
        $set: { totalTeams: tournament.totalTeams - 1 },
      }
    );

    // Delete team
    await Team.findByIdAndDelete(teamId);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete team',
    });
  }
};

// ============================================
// GET TEAM STATISTICS (Matches played, wins, etc.)
// ============================================
export const getTeamStats = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Import Match model
    const Match = require('../models/match.js').default;

    // Get all matches where this team participated
    const matchesAsTeam1 = await Match.find({ team1: teamId });
    const matchesAsTeam2 = await Match.find({ team2: teamId });
    const allMatches = [...matchesAsTeam1, ...matchesAsTeam2];

    // Calculate stats
    let wins = 0;
    let losses = 0;
    let completed = 0;
    let pending = 0;

    for (let match of allMatches) {
      if (match.status === 'completed') {
        completed++;
        if (match.winner && match.winner.toString() === teamId) {
          wins++;
        } else {
          losses++;
        }
      } else {
        pending++;
      }
    }

    // Determine current position (if any)
    const tournament = await Tournament.findById(team.tournamentId);
    let position = null;

    // Check if team is champion
    if (tournament.champion && tournament.champion.toString() === teamId) {
      position = 'Champion';
    }

    res.status(200).json({
      success: true,
      data: {
        teamId: team._id,
        name: team.name,
        logo: team.logo,
        previousStanding: team.previousStanding,
        statistics: {
          totalMatches: allMatches.length,
          completedMatches: completed,
          pendingMatches: pending,
          wins,
          losses,
          winPercentage: completed > 0 ? ((wins / completed) * 100).toFixed(2) : 0,
        },
        position,
        tournamentName: tournament.name,
      },
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team statistics',
    });
  }
};

// ============================================
// SEARCH TEAMS BY NAME
// ============================================
export const searchTeams = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Case-insensitive search
    const teams = await Team.find({
      tournamentId,
      name: { $regex: query, $options: 'i' },
    });

    res.status(200).json({
      success: true,
      data: teams,
      count: teams.length,
      searchQuery: query,
    });
  } catch (error) {
    console.error('Error searching teams:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search teams',
    });
  }
};

// ============================================
// BULK UPDATE TEAM STANDING (For next year)
// ============================================
export const bulkUpdateStanding = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { updates } = req.body;
    // updates: [{ teamId: "...", previousStanding: "winner" }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and must not be empty',
      });
    }

    const validStandings = ['winner', 'runnerUp', 'semiFinalist1', 'semiFinalist2', 'none'];
    const results = [];

    for (let update of updates) {
      const { teamId, previousStanding } = update;

      if (!validStandings.includes(previousStanding)) {
        results.push({
          teamId,
          success: false,
          message: `Invalid standing: ${previousStanding}`,
        });
        continue;
      }

      const team = await Team.findByIdAndUpdate(
        teamId,
        { previousStanding },
        { new: true }
      );

      if (team) {
        results.push({
          teamId,
          success: true,
          message: `Standing updated to ${previousStanding}`,
          data: team,
        });
      } else {
        results.push({
          teamId,
          success: false,
          message: 'Team not found',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      results,
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to bulk update teams',
    });
  }
};