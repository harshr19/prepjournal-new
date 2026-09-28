import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
