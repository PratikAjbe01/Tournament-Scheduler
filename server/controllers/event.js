import Event from "../models/event.js";

// ============================================
// CREATE EVENT
// ============================================
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      year,
      status,
      startDate,
      endDate,
      location,
      image,
    } = req.body;

    // Assuming req.user contains the admin ID (from middleware)
   const userId = req.user?._id;

    const event = await Event.create({
      name,
      description,
      year,
      status,
      startDate,
      endDate,
      location,
      image,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create event',
    });
  }
};

// ============================================
// GET EVENT DETAILS BY ID
// ============================================
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('userId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================
// DELETE EVENT
// ============================================
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
};
