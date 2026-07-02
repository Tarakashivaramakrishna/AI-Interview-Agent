import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { createOrder } from "../controllers/paymentcontroller.js";
import { verifyPayment } from "../controllers/paymentcontroller.js";
const paymentRouter=express.Router();
paymentRouter.post("/create-order",isAuth,createOrder);
paymentRouter.post("/verify-payment",isAuth,verifyPayment);
export default paymentRouter;