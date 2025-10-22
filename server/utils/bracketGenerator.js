export function calculateTotalRounds(teamCount) {
  return Math.ceil(Math.log2(teamCount));
}

export function calculateByes(teamCount) {
  const rounds = calculateTotalRounds(teamCount);
  const nextPowerOf2 = Math.pow(2, rounds);
  return nextPowerOf2 - teamCount;
}

export function assignByesByPriority(teams, byeCount) {
  const priorityOrder = ['winner', 'runnerUp', 'semiFinalist1', 'semiFinalist2'];
  const teamsWithBye = [];
  const remainingTeams = [...teams];

  for (let priority of priorityOrder) {
    if (teamsWithBye.length >= byeCount) break;

    const teamIndex = remainingTeams.findIndex(
      t => t.previousStanding === priority
    );

    if (teamIndex !== -1) {
      teamsWithBye.push(remainingTeams[teamIndex]);
      remainingTeams.splice(teamIndex, 1);
    }
  }

  while (teamsWithBye.length < byeCount && remainingTeams.length > 0) {
    const randomIndex = Math.floor(Math.random() * remainingTeams.length);
    teamsWithBye.push(remainingTeams[randomIndex]);
    remainingTeams.splice(randomIndex, 1);
  }

  return { teamsWithBye, teamsInRound1: remainingTeams };
}

export function generateRound1Matches(teamsInRound1) {
  const matches = [];
  const matchCount = teamsInRound1.length / 2;

  for (let i = 0; i < matchCount; i++) {
    matches.push({
      round: 1,
      matchNumber: i + 1,
      team1: teamsInRound1[i * 2]._id,
      team2: teamsInRound1[i * 2 + 1]._id,
      winner: null,
      loser: null,
      status: 'pending',
      nextMatchId: null,
      nextMatchSlot: null,
    });
  }

  return matches;
}

export function linkMatchesToNextRound(currentRoundMatches, nextRoundMatches) {
  for (let i = 0; i < currentRoundMatches.length; i++) {
    const match = currentRoundMatches[i];
    const nextMatchIndex = Math.floor(i / 2);
    const nextMatchSlot = i % 2 === 0 ? 'team1' : 'team2';

    match.nextMatchId = nextRoundMatches[nextMatchIndex]._id;
    match.nextMatchSlot = nextMatchSlot;
  }

  return currentRoundMatches;
}