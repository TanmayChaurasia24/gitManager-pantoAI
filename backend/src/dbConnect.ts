import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config();

const mongodb_uri = process.env.MONGO_URI as string;

export const ConnectDB = async () => {
    try {
        console.log("uri is: ", mongodb_uri);
        
        const connect = await mongoose.connect(mongodb_uri);

        if(!connect) {
            console.log("error connecting database...");
            return;
        }

        console.log("Database connected... 🚀");
        return;
        
    } catch (error) {
        console.log("error connecting database: ", error);
    }
}