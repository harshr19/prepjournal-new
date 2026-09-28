import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];

export function loadConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '')
  };
}
