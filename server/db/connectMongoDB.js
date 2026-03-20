import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    if (!process.env.MONGODB_URL) {
      throw new Error("Missing required env var: MONGODB_URL");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host} 🚀`);

    // Avoid adding duplicate listeners if connectMongoDB() is called multiple times.
    if (mongoose.connection.listenerCount("disconnected") === 0) {
      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected ⚠️");
      });
    }

    if (mongoose.connection.listenerCount("reconnected") === 0) {
      mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected 🔁");
      });
    }
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    throw error; // Let index.js handle exit
  }
};

export default connectMongoDB;
