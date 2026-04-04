import mongoose from "mongoose";

const connectDB = async() => {
  try {
   let conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', ()=>{
        console.warn('MongoDB disconnected')
    })
    
    mongoose.connection.on('reconnected', ()=>{
        console.log('MongoDB reconnected')
    })
    

  } catch {
    console.error(`MongoDB connection error: ${err.message}`)
    process.exit(1);
  }
};

export default connectDB