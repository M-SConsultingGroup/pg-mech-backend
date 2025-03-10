// src/database/connection.ts
import mongoose from 'mongoose';

export async function connectToDatabase() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb+srv://msingh:kulwinder10@mongo-db-demo-cluster.he271.mongodb.net/?retryWrites=true&w=majority&appName=mongo-db-demo-cluster';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Could not connect to MongoDB', error);
    process.exit(1);
  }
}