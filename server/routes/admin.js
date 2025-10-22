import express from "express"
import { register, login ,logout, getProfile} from "../controllers/adminAuth.js"
import isAuthenticated from "../middlewares/authenticate.js"
const adminAuthRouter=express.Router();
adminAuthRouter.route("/register").post(register);
adminAuthRouter.route("/login").post(login);
adminAuthRouter.route("/logout").post(logout);
adminAuthRouter.route("/getProfile").get(isAuthenticated,getProfile);
export default adminAuthRouter;
