import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import { loadConfig } from './config.js';
import { connectDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import { errorHandler, notFound } from './middleware/error.js';

const config = loadConfig();
const app = express();
app.locals.config = config;
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'prepjournal-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use(notFound);
app.use(errorHandler);

connectDatabase(config.mongoUri)
  .then(() => app.listen(config.port, () => console.log(`PrepJournal API listening on port ${config.port}`)))
  .catch((error) => {
    console.error('Unable to start API', error);
    process.exitCode = 1;
  });
