import { Router } from 'express';
import Interview from '../models/Interview.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function ownedQuery(req, id) {
  return Interview.findOne({ _id: id, owner: req.user._id });
}

router.get('/', async (req, res) => {
  const { search, difficulty, result, limit = 50, page = 1 } = req.query;
  const query = { owner: req.user._id };
  if (difficulty) query.difficulty = difficulty;
  if (result) query.result = result;
  if (search) query.$text = { $search: search };
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    Interview.find(query).sort({ interviewDate: -1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    Interview.countDocuments(query)
  ]);
  res.json({ items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
});

router.post('/', async (req, res) => {
  const interview = await Interview.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ interview });
});

router.get('/stats/summary', async (req, res) => {
  const [total, offers, averages, recent] = await Promise.all([
    Interview.countDocuments({ owner: req.user._id }),
    Interview.countDocuments({ owner: req.user._id, result: 'Offer' }),
    Interview.aggregate([{ $match: { owner: req.user._id, confidenceScore: { $type: 'number' } } }, { $group: { _id: null, averageConfidence: { $avg: '$confidenceScore' } } }]),
    Interview.find({ owner: req.user._id }).sort({ interviewDate: -1, createdAt: -1 }).limit(5)
  ]);
  res.json({ total, offers, averageConfidence: averages[0]?.averageConfidence ?? null, recent });
});

router.get('/:id', async (req, res) => {
  const interview = await ownedQuery(req, req.params.id);
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  res.json({ interview });
});

router.patch('/:id', async (req, res) => {
  const allowed = ['company', 'role', 'interviewDate', 'difficulty', 'result', 'confidenceScore', 'reflection', 'rounds'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const interview = await Interview.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, updates, { new: true, runValidators: true });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  res.json({ interview });
});

router.delete('/:id', async (req, res) => {
  const interview = await Interview.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  res.status(204).send();
});

export default router;
