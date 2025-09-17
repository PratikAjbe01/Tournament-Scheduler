import express from "express";
import { register,login, getUserInfo } from "../controllers/userController.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/getInfo").get(getUserInfo);

export default router;
