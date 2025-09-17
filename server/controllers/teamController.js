import Teams from "../models/teams.js";

// Create a new team
export const createTeam = async (req, res) => {
  try {
    const team = new Teams(req.body);
    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update an existing team
export const updateTeam = async (req, res) => {
  try {
    const team = await Teams.findById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });

    team.set(req.body);  // update fields
    await team.save();   // runs full validation including custom validators

    res.json({ message: "Team updated", team });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Delete a team
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Teams.findByIdAndDelete(id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const getTeamInfo=async(req,res)=>{
    try {
    const { id } = req.params;
    const team = await Teams.findById(id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
   res.status(200).json({ message: "Team info successfully", team });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
export const allTeams=async(req,res)=>{
  try {
     const team = await Teams.find();

    if (!team) {
      return res.status(404).json({ error: "No teams found" });
    }
   res.status(200).json({ message: "all teams ", team });
    
  } catch (error) {
     res.status(400).json({ error: error.message });
  }
}