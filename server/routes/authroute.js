import express from "express";
import {googleAuth} from '../controllers/authcontroller.js'
import {logout} from '../controllers/authcontroller.js'
const authRouter=express.Router();
authRouter.post("/google",googleAuth);
authRouter.get("/logout",logout);
export default authRouter;
