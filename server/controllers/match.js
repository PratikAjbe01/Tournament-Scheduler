// controllers/match.js
import Match from '../models/match.js';
import Tournament from '../models/tournament.js';

// ============================================
// GET ALL MATCHES IN TOURNAMENT
// ============================================
export const getAllMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round } = req.query;

    let query = { tournamentId };
    if (round) {
      query.round = parseInt(round);
    }

    const matches = await Match.find(query)
      .populate('team1', 'name logo')
      .populate('team2', 'name logo')
      .populate('winner', 'name logo')
      .populate('loser', 'name logo')
      .sort({ round: 1, matchNumber: 1 });

    // Group by round
    const groupedMatches = {};
    matches.forEach(match => {
      if (!groupedMatches[`round${match.round}`]) {
        groupedMatches[`round${match.round}`] = [];
      }
      groupedMatches[`round${match.round}`].push(match);
    });

    res.status(200).json({
      success: true,
      data: groupedMatches,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch matches',
    });
  }
};

// ============================================
// GET SINGLE MATCH DETAILS
// ============================================
export const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('team1', 'name logo')
      .populate('team2', 'name logo')
      .populate('winner', 'name logo')
      .populate('loser', 'name logo');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch match',
    });
  }
};

// ============================================
// MARK MATCH WINNER (CRITICAL FUNCTION)
// ============================================
export const markWinner = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerTeamId } = req.body;

    if (!winnerTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Winner team ID is required',
      });
    }

    // Step 1: Find and validate match
    const match = await Match.findById(matchId)
      .populate('team1')
      .populate('team2');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    if (match.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This match is already completed',
      });
    }

    // Validate winner is one of the teams
    if (
      match.team1._id.toString() !== winnerTeamId &&
      match.team2._id.toString() !== winnerTeamId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Winner team must be one of the competing teams',
      });
    }

    // Step 2: Update match with winner and loser
    match.winner = winnerTeamId;
    match.loser =
      match.team1._id.toString() === winnerTeamId ? match.team2._id : match.team1._id;
    match.status = 'completed';
    await match.save();

    // Step 3: Cascade winner to next round match
    if (match.nextMatchId) {
      const nextMatch = await Match.findById(match.nextMatchId);

      if (nextMatch) {
        if (match.nextMatchSlot === 'team1') {
          nextMatch.team1 = winnerTeamId;
        } else if (match.nextMatchSlot === 'team2') {
          nextMatch.team2 = winnerTeamId;
        }
        await nextMatch.save();
      }
    }

    // Step 4: Check if all matches in current round are completed
    const allMatchesInRound = await Match.find({
      tournamentId: match.tournamentId,
      round: match.round,
    });

    const allCompleted = allMatchesInRound.every(m => m.status === 'completed');
    let roundComplete = false;
    let nextRound = null;

    if (allCompleted) {
      // Update tournament current round
      const tournament = await Tournament.findById(match.tournamentId);
      tournament.currentRound = match.round + 1;
      await tournament.save();

      roundComplete = true;
      nextRound = match.round + 1;

      // Check if this was the final match
      if (allMatchesInRound.length === 1 && match.round === tournament.totalRounds) {
        // This is the final match, set champion
        tournament.champion = winnerTeamId;
        tournament.status = 'completed';
        await tournament.save();
      }
    }

    // Fetch updated match with populated data
    const updatedMatch = await Match.findById(matchId)
      .populate('team1', 'name logo')
      .populate('team2', 'name logo')
      .populate('winner', 'name logo')
      .populate('loser', 'name logo');

    res.status(200).json({
      success: true,
      message: roundComplete
        ? `Winner marked! Round ${match.round} complete. Round ${nextRound} ready.`
        : 'Winner marked successfully',
      data: updatedMatch,
      roundComplete,
      nextRound: roundComplete ? nextRound : null,
    });
  } catch (error) {
    console.error('Error marking winner:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark winner',
    });
  }
};

// ============================================
// EDIT MATCH WINNER (Allow admin to change winner)
// ============================================
export const editWinner = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { newWinnerTeamId } = req.body;

    if (!newWinnerTeamId) {
      return res.status(400).json({
        success: false,
        message: 'New winner team ID is required',
      });
    }

    // Step 1: Find match
    const match = await Match.findById(matchId)
      .populate('team1')
      .populate('team2');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Validate new winner is one of the teams
    if (
      match.team1._id.toString() !== newWinnerTeamId &&
      match.team2._id.toString() !== newWinnerTeamId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Winner team must be one of the competing teams',
      });
    }

    // Step 2: Update match
    const oldWinner = match.winner;
    match.winner = newWinnerTeamId;
    match.loser =
      match.team1._id.toString() === newWinnerTeamId
        ? match.team2._id
        : match.team1._id;
    await match.save();

    // Step 3: Update immediate next match
    if (match.nextMatchId) {
      const nextMatch = await Match.findById(match.nextMatchId);

      if (nextMatch) {
        if (match.nextMatchSlot === 'team1') {
          nextMatch.team1 = newWinnerTeamId;
        } else if (match.nextMatchSlot === 'team2') {
          nextMatch.team2 = newWinnerTeamId;
        }
        await nextMatch.save();
      }
    }

    // Note: We only update immediate next match, not cascading further
    // (as per requirement: "edit only immediate next")

    const updatedMatch = await Match.findById(matchId)
      .populate('team1', 'name logo')
      .populate('team2', 'name logo')
      .populate('winner', 'name logo')
      .populate('loser', 'name logo');

    res.status(200).json({
      success: true,
      message: `Winner changed from ${oldWinner} to ${newWinnerTeamId}`,
      data: updatedMatch,
    });
  } catch (error) {
    console.error('Error editing winner:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to edit winner',
    });
  }
};