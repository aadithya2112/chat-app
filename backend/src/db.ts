import mongoose, { model } from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export const connectToDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI as string)
        console.log("MongoDB connected successfully!")
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error)
    }
}

const UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

export const UserModel = model("users", UserSchema)