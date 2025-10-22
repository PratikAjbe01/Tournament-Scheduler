// controllers/tournament.js
import Tournament from '../models/tournament.js';
import Team from '../models/team.js';
import Match from '../models/match.js';
import Bracket from '../models/bracket.js';
import {
  calculateTotalRounds,
  calculateByes,
  assignByesByPriority,
  generateRound1Matches,
  linkMatchesToNextRound,
} from '../utils/bracketGenerator.js';

// ============================================
// CREATE TOURNAMENT
// ============================================
export const createTournament = async (req, res) => {
  try {
    const { eventId, name, description, startDate, endDate } = req.body;
    const userId = req.user?._id;

    if (!eventId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and tournament name are required',
      });
    }

    const tournament = await Tournament.create({
      name,
      description,
      eventId,
      startDate,
      endDate,
      teams: [],
      status: 'upcoming',
      currentRound: 1,
      totalTeams: 0,
      totalRounds: 0,
      totalByes: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament,
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create tournament',
    });
  }
};

// ============================================
// ADD TEAMS TO TOURNAMENT
// ============================================
export const addTeamsToTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teams } = req.body; // Array of team objects

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Teams array is required and must not be empty',
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    // Create team documents
    const createdTeams = [];
    for (let teamData of teams) {
      const team = await Team.create({
        name: teamData.name,
        logo: teamData.logo || null,
        description: teamData.description || '',
        tournamentId,
        previousStanding: teamData.previousStanding || 'none',
      });
      createdTeams.push(team);
    }

    // Update tournament with team references
    tournament.teams = createdTeams.map(t => t._id);
    tournament.totalTeams = createdTeams.length;
    await tournament.save();

    res.status(200).json({
      success: true,
      message: `${createdTeams.length} teams added successfully`,
      data: tournament,
    });
  } catch (error) {
    console.error('Error adding teams:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add teams',
    });
  }
};

// ============================================
// GENERATE BRACKET (CRITICAL FUNCTION)
// ============================================
export const generateBracket = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId).populate('teams');
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    if (tournament.teams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate bracket without teams',
      });
    }

    // Step 1: Calculate rounds and byes
    const totalRounds = calculateTotalRounds(tournament.teams.length);
    const totalByes = calculateByes(tournament.teams.length);

    // Step 2: Assign byes by priority
    const { teamsWithBye, teamsInRound1 } = assignByesByPriority(
      tournament.teams,
      totalByes
    );

    // Step 3: Generate Round 1 matches
    const round1Matches = generateRound1Matches(teamsInRound1);

    // Step 4: Prepare Round 2 (with bye teams + winners from R1)
    // For now, just create empty Round 2 slots that will be filled later
    const round2Count = Math.ceil(
      (teamsInRound1.length / 2 + teamsWithBye.length) / 2
    );
    const round2Matches = [];
    for (let i = 0; i < round2Count; i++) {
      round2Matches.push({
        round: 2,
        matchNumber: i + 1,
        team1: null,
        team2: null,
        winner: null,
        loser: null,
        status: 'pending',
        nextMatchId: null,
        nextMatchSlot: null,
        tournamentId,
      });
    }

    // Step 5: Link Round 1 matches to Round 2
    const linkedRound1 = linkMatchesToNextRound(round1Matches, round2Matches);
    linkedRound1.forEach(m => (m.tournamentId = tournamentId));

    // Step 6: Create Round 2 links to Round 3 (if exists)
    if (totalRounds > 2) {
      const round3Count = round2Count / 2;
      const round3Matches = [];
      for (let i = 0; i < round3Count; i++) {
        round3Matches.push({
          round: 3,
          matchNumber: i + 1,
          team1: null,
          team2: null,
          winner: null,
          loser: null,
          status: 'pending',
          nextMatchId: null,
          nextMatchSlot: null,
          tournamentId,
        });
      }
      const linkedRound2 = linkMatchesToNextRound(round2Matches, round3Matches);
      linkedRound2.forEach(m => (m.tournamentId = tournamentId));

      await Match.insertMany([...linkedRound1, ...linkedRound2, ...round3Matches]);
    } else {
      await Match.insertMany([...linkedRound1, ...round2Matches]);
    }

    // Step 7: Update tournament metadata
    tournament.totalRounds = totalRounds;
    tournament.totalByes = totalByes;
    tournament.teamsWithBye = teamsWithBye.map(t => t._id);
    tournament.status = 'ongoing';
    await tournament.save();

    // Step 8: Populate bye teams in Round 2 matches
    const round2MatchesFromDb = await Match.find({
      tournamentId,
      round: 2,
    });
    let byeIndex = 0;
    for (let match of round2MatchesFromDb) {
      if (byeIndex < teamsWithBye.length) {
        if (!match.team1) {
          match.team1 = teamsWithBye[byeIndex]._id;
          byeIndex++;
        } else if (!match.team2) {
          match.team2 = teamsWithBye[byeIndex]._id;
          byeIndex++;
        }
      }
      await match.save();
    }

    // Step 9: Create Bracket document
    const bracketStructure = {};
    for (let i = 1; i <= totalRounds; i++) {
      const matches = await Match.find({
        tournamentId,
        round: i,
      });
      bracketStructure[`round${i}`] = matches.map(m => m._id);
    }

    await Bracket.create({
      tournamentId,
      structure: bracketStructure,
      activeRound: 1,
      champion: null,
    });

    res.status(200).json({
      success: true,
      message: 'Bracket generated successfully',
      data: {
        totalRounds,
        totalByes,
        teamsWithBye: teamsWithBye.map(t => t.name),
        teamsInRound1: teamsInRound1.map(t => t.name),
      },
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate bracket',
    });
  }
};

// ============================================
// GET TOURNAMENT DETAILS
// ============================================
export const getTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId)
      .populate('teams')
      .populate('eventId', 'name year');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tournament',
    });
  }
};

// ============================================
// UPDATE TOURNAMENT STATUS
// ============================================
export const updateTournamentStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'ongoing', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const tournament = await Tournament.findByIdAndUpdate(
      tournamentId,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Tournament status updated',
      data: tournament,
    });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tournament',
    });
  }
};