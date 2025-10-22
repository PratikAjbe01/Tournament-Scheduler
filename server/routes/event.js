import express from 'express';
import {
  createEvent,
  getEventDetails,
  deleteEvent,
} from "../controllers/event.js";
import isAuthenticated from '../middlewares/authenticate.js';

const eventrouter = express.Router();

eventrouter.post('/', isAuthenticated,createEvent);
eventrouter.get('/:id', isAuthenticated,getEventDetails);
eventrouter.delete('/:id',isAuthenticated, deleteEvent);

export default eventrouter;
