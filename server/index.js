import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import authRouter from "./routes/authroute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userroute.js";
import interviewRouter from "./routes/interviewroute.js";
import paymentRouter from "./routes/paymentroute.js";
dotenv.config();
const PORT = process.env.PORT || 6000;
const app = express();
app.use(cors({
    origin:"https://ai-interview-agent-1client-ua93.onrender.com",
    credentials:true
    }
));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/interview",interviewRouter);
app.use("/api/payment",paymentRouter);
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
