import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
     try
     {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB Database");
     }catch(error)
     {
        console.error("Error connecting to MongoDB Database:", error);
     }
}
export default connectDB;