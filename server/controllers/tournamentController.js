import Tournament from "../models/tournament.js";


//  Create a new tournament
export const createTournament = async (req, res) => {
  try {
    const tournament = new Tournament(req.body);
    await tournament.save();
    res.status(201).json({ message: "Tournament created successfully", tournament });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Update an existing tournament
export const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });

    tournament.set(req.body);   // update fields
    await tournament.save();    // ensures validation

    res.json({ message: "Tournament updated successfully", tournament });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Delete a tournament
export const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findByIdAndDelete(id);

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Get tournament by ID
export const getTournamentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id).populate("schedules");

    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.status(200).json({ message: "Tournament info fetched successfully", tournament });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//  Get all tournaments
export const allTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().populate("schedules");

    if (!tournaments || tournaments.length === 0) {
      return res.status(404).json({ error: "No tournaments found" });
    }

    res.status(200).json({ message: "All tournaments fetched successfully", tournaments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


