import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true, maxlength: 1000 },
  answer: { type: String, default: '', trim: true, maxlength: 5000 },
  notes: { type: String, default: '', trim: true, maxlength: 2000 }
}, { _id: true });

const roundSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, trim: true, maxlength: 80 },
  durationMinutes: { type: Number, min: 0, max: 1440 },
  notes: { type: String, default: '', trim: true, maxlength: 5000 },
  questions: { type: [questionSchema], default: [] }
}, { _id: true });

const interviewSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  interviewDate: { type: Date },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  result: { type: String, enum: ['Pending', 'Advanced', 'Rejected', 'Offer'], default: 'Pending' },
  confidenceScore: { type: Number, min: 0, max: 10 },
  reflection: { type: String, default: '', trim: true, maxlength: 5000 },
  rounds: { type: [roundSchema], default: [] }
}, { timestamps: true });

interviewSchema.index({ owner: 1, createdAt: -1 });
interviewSchema.index({ owner: 1, company: 'text', role: 'text', reflection: 'text', 'rounds.questions.prompt': 'text' });

export default mongoose.model('Interview', interviewSchema);
