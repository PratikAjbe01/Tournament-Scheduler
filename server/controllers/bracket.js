// ============================================
// BRACKET CONTROLLER (controllers/bracket.js)
// ============================================
import Match from '../models/match.js';
import Tournament from '../models/tournament.js';

// export const getBracketStructure = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     // Validate tournament exists
//     const tournament = await Tournament.findById(tournamentId);
//     if (!tournament) {
//       return res.status(404).json({
//         success: false,
//         message: 'Tournament not found',
//       });
//     }

//     // Fetch all matches grouped by round
//     const matches = await Match.find({ tournamentId })
//       .populate('team1', 'name logo')
//       .populate('team2', 'name logo')
//       .populate('winner', 'name logo')
//       .sort({ round: 1, matchNumber: 1 });

//     const structure = {};
//     matches.forEach(match => {
//       const roundKey = `round${match.round}`;
//       if (!structure[roundKey]) {
//         structure[roundKey] = [];
//       }
//       structure[roundKey].push(match);
//     });

//     res.status(200).json({
//       success: true,
//       data: structure,
//       currentRound: tournament.currentRound,
//       totalRounds: tournament.totalRounds,
//       status: tournament.status,
//       champion: tournament.champion || null,
//     });
//   } catch (error) {
//     console.error('Error fetching bracket:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to fetch bracket',
//     });
//   }
// };
async function debugR1Match(matchId) {
  const match = await Match.findById(matchId)
    .populate('team1', 'name')
    .populate('team2', 'name')
    .populate('winner', 'name');
  
  console.log('=== ROUND 1 MATCH DEBUG ===');
  console.log('Match ID:', match._id);
  console.log('Team 1:', match.team1?.name);
  console.log('Team 2:', match.team2?.name);
  console.log('Winner:', match.winner?.name);
  console.log('Status:', match.status);
  console.log('Next Match ID:', match.nextMatchId);  // Should NOT be null
  console.log('Next Match Slot:', match.nextMatchSlot);  // Should be 'team1' or 'team2'
  console.log('Next Match ID exists:', !!match.nextMatchId);
}

// Step 2: Check if R2 match has the winner populated
async function debugR2Match(matchId) {
  const match = await Match.findById(matchId)
    .populate('team1', 'name')
    .populate('team2', 'name');
  
  console.log('=== ROUND 2 MATCH DEBUG ===');
  console.log('Match ID:', match._id);
  console.log('Team 1:', match.team1?.name || 'NULL');
  console.log('Team 2:', match.team2?.name || 'NULL');
  console.log('Status:', match.status);
  console.log('Both teams populated:', !!match.team1 && !!match.team2);
}



export const getBracketStructure  = async (req, res) => {
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

    // ============================================
    // KEY FIX: Calculate how many R2 matches
    // ============================================
    // R1 winners: teamsInRound1.length / 2
    // Bye teams: teamsWithBye.length
    // Total teams advancing to R2: (teamsInRound1.length / 2) + teamsWithBye.length
    // R2 matches needed: total / 2

    const round1Winners = teamsInRound1.length / 2;
    const totalTeamsForR2 = round1Winners + teamsWithBye.length;
    const round2Count = Math.ceil(totalTeamsForR2 / 2);

    // Step 4: Create empty Round 2 matches
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

    // Step 5: Link Round 1 to Round 2
    const linkedRound1 = linkMatchesToNextRound(round1Matches, round2Matches);
    linkedRound1.forEach(m => (m.tournamentId = tournamentId));

    // Step 6: Create higher rounds if needed
    let allRoundMatches = [...linkedRound1, ...round2Matches];
    
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
      allRoundMatches = [...linkedRound1, ...linkedRound2, ...round3Matches];
    }

    // Step 7: Insert all matches into DB
    const insertedMatches = await Match.insertMany(allRoundMatches);
    
    // Create map for quick lookup
    const matchMap = {};
    insertedMatches.forEach(m => {
      matchMap[m._id.toString()] = m;
    });

    // Step 8: NOW populate bye teams in Round 2
    // IMPORTANT: Don't overwrite slots that will receive winners!
    const round2FromDb = insertedMatches.filter(m => m.round === 2);
    const round1FromDb = insertedMatches.filter(m => m.round === 1);

    // Map which R2 match slots will receive R1 winners
    // R1 Match 0,1 → R2 Match 0 (team1, team2)
    // R1 Match 2,3 → R2 Match 1 (team1, team2)
    // etc...

    const slotsReservedForWinners = {};
    for (let i = 0; i < round1FromDb.length; i++) {
      const match = round1FromDb[i];
      const r2MatchIndex = Math.floor(i / 2);
      const slotType = i % 2 === 0 ? 'team1' : 'team2';
      
      if (!slotsReservedForWinners[r2MatchIndex]) {
        slotsReservedForWinners[r2MatchIndex] = {};
      }
      slotsReservedForWinners[r2MatchIndex][slotType] = true;
    }

    // Now populate bye teams only in non-reserved slots
    let byeIndex = 0;
    for (let i = 0; i < round2FromDb.length; i++) {
      const match = round2FromDb[i];
      const reserved = slotsReservedForWinners[i] || {};

      // Try to fill team1 slot
      if (!reserved.team1 && byeIndex < teamsWithBye.length) {
        match.team1 = teamsWithBye[byeIndex]._id;
        byeIndex++;
      }

      // Try to fill team2 slot
      if (!reserved.team2 && byeIndex < teamsWithBye.length) {
        match.team2 = teamsWithBye[byeIndex]._id;
        byeIndex++;
      }

      await match.save();
    }

    // Step 9: Update tournament metadata
    tournament.totalRounds = totalRounds;
    tournament.totalByes = totalByes;
    tournament.teamsWithBye = teamsWithBye.map(t => t._id);
    tournament.status = 'ongoing';
    await tournament.save();

    // Step 10: Create Bracket document
    const bracketStructure = {};
    for (let i = 1; i <= totalRounds; i++) {
      const matches = insertedMatches.filter(m => m.round === i);
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
        round1Matches: round1Matches.length,
        round2Matches: round2Count,
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
// TEAM CONTROLLER (controllers/team.js)
// ============================================
import Team from '../models/team.js';

export const getTeamsInTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const teams = await Team.find({ tournamentId });

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

export const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate('tournamentId', 'name');

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





