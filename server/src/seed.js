import bcrypt from 'bcryptjs';
import { loadConfig } from './config.js';
import { connectDatabase } from './db.js';
import User from './models/User.js';
import Interview from './models/Interview.js';

const profiles = [
  { name: 'Harsh', email: 'harsh.demo@prepjournal.dev', password: 'PrepJournal123!' },
  { name: 'Priya Sharma', email: 'priya.demo@prepjournal.dev', password: 'PrepJournal123!' },
  { name: 'Jordan Lee', email: 'jordan.demo@prepjournal.dev', password: 'PrepJournal123!' }
];

const interviewTemplates = [
  {
    company: 'Google',
    role: 'Software Engineer, L4',
    difficulty: 'Hard',
    result: 'Advanced',
    confidenceScore: 8.6,
    reflection: 'Strong coding performance. I should make my complexity explanation more concise.',
    rounds: [
      { name: 'Phone screen', type: 'Algorithms', durationMinutes: 45, questions: [
        { prompt: 'Given a stream of integers, return the median after each insertion.', answer: 'Used two heaps: a max heap for the lower half and a min heap for the upper half.', notes: 'Explain the balancing invariant before coding.' }
      ] },
      { name: 'Onsite: coding', type: 'Algorithms', durationMinutes: 45, questions: [
        { prompt: 'Find the longest substring with at most K distinct characters.', answer: 'Sliding window with a frequency map. O(n) time and O(k) space.', notes: 'Mention why the left pointer only moves forward.' }
      ] },
      { name: 'Onsite: system design', type: 'System design', durationMinutes: 60, questions: [
        { prompt: 'Design a URL shortening service for 100M daily requests.', answer: 'Covered API boundaries, ID generation, cache, datastore partitioning, and read-heavy scaling.', notes: 'Quantify storage and traffic assumptions first.' }
      ] }
    ]
  },
  {
    company: 'Meta',
    role: 'Frontend Engineer, E4',
    difficulty: 'Hard',
    result: 'Offer',
    confidenceScore: 9.1,
    reflection: 'The product discussion was a highlight. I connected performance tradeoffs to user impact.',
    rounds: [
      { name: 'Technical screen', type: 'JavaScript', durationMinutes: 45, questions: [
        { prompt: 'Implement a debounce function and explain its edge cases.', answer: 'Returned a closure that resets a timer and preserves the latest arguments and this context.', notes: 'Discuss leading and trailing invocation.' },
        { prompt: 'How would you optimize a slow React page?', answer: 'Profile first, then reduce renders, split bundles, virtualize long lists, and cache data.', notes: 'Tie every optimization to a measured bottleneck.' }
      ] },
      { name: 'Product architecture', type: 'Frontend system design', durationMinutes: 60, questions: [
        { prompt: 'Design the frontend architecture for a collaborative feed.', answer: 'Proposed a normalized client store, cursor pagination, optimistic updates, and realtime invalidation.', notes: 'Clarify consistency expectations.' }
      ] }
    ]
  },
  {
    company: 'Amazon',
    role: 'Software Development Engineer II',
    difficulty: 'Hard',
    result: 'Pending',
    confidenceScore: 7.4,
    reflection: 'I need more practice structuring behavioral stories around ownership and customer obsession.',
    rounds: [
      { name: 'Online assessment', type: 'Algorithms', durationMinutes: 90, questions: [
        { prompt: 'Merge overlapping intervals and return the minimum number of rooms required.', answer: 'Sorted starts and ends separately and swept both arrays.', notes: 'State the invariant for the two pointers.' }
      ] },
      { name: 'Leadership principles', type: 'Behavioral', durationMinutes: 45, questions: [
        { prompt: 'Tell me about a time you disagreed with a teammate.', answer: 'Used a STAR story about a rollout decision and aligned on an experiment.', notes: 'Add measurable outcome.' }
      ] }
    ]
  },
  {
    company: 'Apple',
    role: 'iOS Engineer',
    difficulty: 'Medium',
    result: 'Rejected',
    confidenceScore: 6.3,
    reflection: 'The coding was fine, but I was underprepared for memory management details.',
    rounds: [
      { name: 'Coding interview', type: 'Swift', durationMinutes: 60, questions: [
        { prompt: 'Explain value types versus reference types in Swift.', answer: 'Covered structs, classes, copy-on-write, identity, and ownership implications.', notes: 'Review ARC and retain cycles.' }
      ] },
      { name: 'Mobile architecture', type: 'System design', durationMinutes: 60, questions: [
        { prompt: 'Design an offline-first notes app.', answer: 'Proposed local persistence, sync queue, conflict resolution, and retry policy.', notes: 'Discuss encryption at rest.' }
      ] }
    ]
  },
  {
    company: 'Microsoft',
    role: 'Backend Engineer, II',
    difficulty: 'Medium',
    result: 'Offer',
    confidenceScore: 8.9,
    reflection: 'Good balance of coding and architecture. My API tradeoff discussion landed well.',
    rounds: [
      { name: 'Coding', type: 'Algorithms', durationMinutes: 45, questions: [
        { prompt: 'Serialize and deserialize a binary tree.', answer: 'Used preorder traversal with null markers and a queue for reconstruction.', notes: 'Compare recursive and iterative implementations.' }
      ] },
      { name: 'Distributed systems', type: 'System design', durationMinutes: 60, questions: [
        { prompt: 'Design a rate limiter for a public API.', answer: 'Compared token bucket, leaky bucket, and distributed counters with Redis.', notes: 'Include clock skew and failure behavior.' }
      ] }
    ]
  },
  {
    company: 'Netflix',
    role: 'Senior Software Engineer',
    difficulty: 'Hard',
    result: 'Advanced',
    confidenceScore: 8.2,
    reflection: 'Strong system design round. I want to improve my observability examples.',
    rounds: [
      { name: 'Architecture', type: 'Distributed systems', durationMinutes: 75, questions: [
        { prompt: 'Design a video streaming service with adaptive bitrate.', answer: 'Covered ingestion, transcoding, manifests, CDN delivery, client adaptation, and QoE metrics.', notes: 'Discuss regional failover.' }
      ] }
    ]
  },
  {
    company: 'Uber',
    role: 'Full-stack Engineer',
    difficulty: 'Medium',
    result: 'Rejected',
    confidenceScore: 6.9,
    reflection: 'I rushed the first coding problem. Practice communicating while exploring.',
    rounds: [
      { name: 'Coding', type: 'Algorithms', durationMinutes: 45, questions: [
        { prompt: 'Find the top K frequent locations from a trip stream.', answer: 'Used a frequency map and min heap of size K.', notes: 'Clarify tie-breaking and memory constraints.' }
      ] }
    ]
  },
  {
    company: 'OpenAI',
    role: 'Product Engineer',
    difficulty: 'Hard',
    result: 'Pending',
    confidenceScore: 8.7,
    reflection: 'Interesting focus on ambiguity, evaluation, and shipping useful products.',
    rounds: [
      { name: 'Product sense', type: 'Behavioral', durationMinutes: 45, questions: [
        { prompt: 'How would you evaluate whether an AI feature is useful?', answer: 'Defined user outcome metrics, offline evals, quality rubrics, and gradual rollout monitoring.', notes: 'Separate model quality from product value.' }
      ] },
      { name: 'Technical design', type: 'AI systems', durationMinutes: 60, questions: [
        { prompt: 'Design a reliable retrieval-augmented generation workflow.', answer: 'Covered ingestion, chunking, embeddings, retrieval, reranking, citations, evals, and fallbacks.', notes: 'Include freshness and prompt-injection defenses.' }
      ] }
    ]
  }
];

async function seed() {
  const config = loadConfig();
  await connectDatabase(config.mongoUri);

  for (const profile of profiles) {
    const passwordHash = await bcrypt.hash(profile.password, 12);
    const user = await User.findOneAndUpdate(
      { email: profile.email },
      { name: profile.name, email: profile.email, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Interview.deleteMany({ owner: user._id });
    const profileOffset = profiles.indexOf(profile);
    const documents = interviewTemplates.map((template, index) => ({
      ...template,
      owner: user._id,
      interviewDate: new Date(Date.now() - ((index + 1 + profileOffset) * 9 * 86400000))
    }));
    await Interview.insertMany(documents);
    console.log(`Seeded ${profile.email}: ${documents.length} interviews`);
  }

  console.log('Demo credentials: password is PrepJournal123! for every demo profile');
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
