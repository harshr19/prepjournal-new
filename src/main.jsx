import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Code2, Command, FileText, Filter, LayoutDashboard,
  LogOut, Menu, MoreHorizontal, Pencil, Plus, Search, Settings, Sparkles,
  Target, Trash2, TrendingUp, UserRound, X, Zap
} from 'lucide-react';
import './styles.css';
import { authApi, interviewApi } from './lib/api';

const StylingContext = createContext(null);
const useStyling = () => useContext(StylingContext);

const initialInterviews = [
  { id: 1, company: 'Linear', role: 'Product Engineer', date: 'Oct 24, 2024', result: 'Pending', difficulty: 'Hard', rounds: 4, score: '8.4', color: '#b6f36b', logo: 'L', topics: ['System design', 'React'] },
  { id: 2, company: 'Vercel', role: 'Frontend Engineer', date: 'Oct 18, 2024', result: 'Advanced', difficulty: 'Medium', rounds: 3, score: '9.1', color: '#ffffff', logo: '▲', topics: ['Next.js', 'Performance'] },
  { id: 3, company: 'Ramp', role: 'Software Engineer II', date: 'Oct 11, 2024', result: 'Rejected', difficulty: 'Hard', rounds: 5, score: '6.8', color: '#63e6be', logo: 'R', topics: ['Algorithms', 'Behavioral'] },
  { id: 4, company: 'Notion', role: 'Full-stack Engineer', date: 'Sep 28, 2024', result: 'Offer', difficulty: 'Medium', rounds: 4, score: '9.6', color: '#f5c98b', logo: 'N', topics: ['APIs', 'Product sense'] }
];

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AS';
}

function toInterviewCard(item) {
  const company = item.company || 'Unknown';
  const rounds = Array.isArray(item.rounds) ? item.rounds : [];
  return { ...item, id: item._id, company, role: item.role, date: item.interviewDate ? new Date(item.interviewDate).toLocaleDateString() : 'No date', result: item.result || 'Pending', difficulty: item.difficulty || 'Medium', rounds, roundCount: rounds.length, score: item.confidenceScore ?? '—', color: '#b6f36b', logo: company[0].toUpperCase(), topics: ['Interview notes'] };
}

function buildInsights(interviews) {
  const topics = new Map();
  let questionCount = 0;
  let answeredCount = 0;
  let confidenceTotal = 0;
  let confidenceCount = 0;

  interviews.forEach((interview) => {
    if (typeof interview.confidenceScore === 'number') {
      confidenceTotal += interview.confidenceScore;
      confidenceCount += 1;
    }
    (Array.isArray(interview.rounds) ? interview.rounds : []).forEach((round) => {
      const topic = round.type?.trim() || 'General';
      const questions = round.questions || [];
      const weight = Math.max(questions.length, 1);
      topics.set(topic, (topics.get(topic) || 0) + weight);
      questions.forEach((question) => {
        questionCount += 1;
        if (question.answer?.trim()) answeredCount += 1;
      });
    });
  });

  const rankedTopics = [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxTopicCount = rankedTopics[0]?.[1] || 1;
  const topicRows = rankedTopics.map(([name, count]) => ({
    name,
    percent: Math.max(1, Math.round((count / maxTopicCount) * 100))
  }));
  const averageConfidence = confidenceCount ? confidenceTotal / confidenceCount : 0;
  const confidenceReadiness = (averageConfidence / 10) * 60;
  const answerReadiness = questionCount ? (answeredCount / questionCount) * 40 : 0;
  const readiness = Math.round(Math.min(100, confidenceReadiness + answerReadiness));
  const strongestTopic = topicRows[0]?.name || 'your core topics';
  const weakestTopic = topicRows[topicRows.length - 1]?.name || 'your next topic';

  return { topicRows, readiness, strongestTopic, weakestTopic, questionCount, answeredCount };
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [active, setActive] = useState('Overview');
  const [interviews, setInterviews] = useState(initialInterviews);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All interviews');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showAuth, setShowAuth] = useState(() => !localStorage.getItem('prepjournal_token'));
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [stats, setStats] = useState(null);
  const styling = useMemo(() => ({ theme, setTheme }), [theme]);

  useEffect(() => {
    const token = localStorage.getItem('prepjournal_token');
    if (!token) return;
    authApi.me().then(({ data }) => setUser(data.user)).catch(() => { localStorage.removeItem('prepjournal_token'); setShowAuth(true); });
    interviewApi.list().then(({ data }) => {
      if (data.items?.length) setInterviews(data.items.map(toInterviewCard));
    }).catch(() => {});
    interviewApi.stats().then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const filtered = interviews.filter((item) => {
    const matchesQuery = `${item.company} ${item.role} ${item.topics.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All interviews' || item.result === filter || item.difficulty === filter;
    return matchesQuery && matchesFilter;
  });

  const addInterview = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const company = data.get('company');
    const role = data.get('role');
    const payload = { company, role, interviewDate: data.get('date') || undefined, difficulty: data.get('difficulty'), reflection: data.get('reflection') };
    const token = localStorage.getItem('prepjournal_token');
    const save = token ? interviewApi.create(payload).then(({ data: response }) => response.interview) : Promise.resolve(null);
    save.then((saved) => {
      const item = saved ? toInterviewCard(saved) : { id: Date.now(), company, role, date: 'Just now', result: 'Pending', difficulty: 'Medium', rounds: 1, score: '—', color: '#b6f36b', logo: company[0].toUpperCase(), topics: ['New notes'] };
      setInterviews((current) => [item, ...current]);
      setShowModal(false);
      notify('Interview added to your journal');
      event.currentTarget.reset();
    }).catch(() => notify('Could not save interview. Please try again.'));
  };

  const handleAuth = (authUser, token) => {
    localStorage.setItem('prepjournal_token', token);
    setUser(authUser);
    setShowAuth(false);
    interviewApi.list().then(({ data }) => setInterviews(data.items.map(toInterviewCard))).catch(() => {});
    interviewApi.stats().then(({ data }) => setStats(data)).catch(() => {});
    notify(`Welcome back, ${authUser.name.split(' ')[0]}`);
  };

  const signOut = () => {
    localStorage.removeItem('prepjournal_token');
    setUser(null);
    setInterviews(initialInterviews);
    notify('Signed out successfully');
  };

  const saveInterviewDetails = (updated) => {
    setInterviews((current) => current.map((item) => item.id === updated.id ? toInterviewCard(updated) : item));
    setSelectedInterview(null);
    notify('Interview notes saved');
  };

  const deleteInterview = (id) => {
    if (!window.confirm('Delete this interview and all of its notes?')) return;
    interviewApi.remove(id).then(() => {
      setInterviews((current) => current.filter((item) => item.id !== id));
      setSelectedInterview(null);
      notify('Interview deleted');
    }).catch((error) => notify(error.response?.data?.message || 'Could not delete interview'));
  };

  if (!user) {
    return <StylingContext.Provider value={styling}><div className="auth-gate"><div className="auth-gate-brand"><span className="brand-mark"><Zap size={16} fill="currentColor" /></span>PrepJournal</div>    <div className="auth-gate-copy"><p className="eyebrow"><span className="pulse" /> Your private interview workspace</p><h1>Turn every interview into an advantage<span className="lime">.</span></h1><p>Sign in to capture the questions, decisions, and lessons that make your next interview stronger.</p></div>{showAuth && <AuthModal mode={authMode} setMode={setAuthMode} closable={false} onClose={() => {}} onSuccess={handleAuth} onError={notify} />}{toast && <div className="toast"><span className="toast-dot" />{toast}</div>}</div></StylingContext.Provider>;
  }

  return (
    <StylingContext.Provider value={styling}>
      <div className="app-shell">
        <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
          <div className="brand"><span className="brand-mark"><Zap size={16} fill="currentColor" /></span><span>PrepJournal</span></div>
          <div className="workspace-switcher"><div className="avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><small>{user.email}</small></div><ChevronDown size={15} /></div>
          <nav>
            <p className="nav-label">Workspace</p>
            {[
              [LayoutDashboard, 'Overview'], [BookOpen, 'My interviews'], [Target, 'Preparation'], [FileText, 'Question bank']
            ].map(([Icon, label]) => <button className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => { setActive(label); setMobileNav(false); }} key={label}><Icon size={17} />{label}{label === 'Question bank' && <span className="nav-count">24</span>}</button>)}
            <p className="nav-label nav-spacer">Manage</p>
            {[[Settings, 'Settings'], [CircleHelp, 'Help center']].map(([Icon, label]) => <button className="nav-item" key={label}><Icon size={17} />{label}</button>)}
          </nav>
          <div className="sidebar-footer"><div className="upgrade-card"><Sparkles size={18} /><strong>Make every interview count.</strong><span>Build a stronger signal with smart review prompts.</span><button onClick={() => notify('Prep plan coming soon')}>Explore Prep plan <ArrowUpRight size={14} /></button></div><button className="nav-item logout" onClick={user ? signOut : () => setShowAuth(true)}><LogOut size={17} />{user ? 'Sign out' : 'Sign in'}</button></div>
        </aside>
        <main className="main-content">
          <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{active}</strong></div><div className="top-actions"><button className="icon-button" onClick={() => notify('You are all caught up')}><Bell size={18} /><i /></button><button className="profile-button" onClick={() => notify(user.email)}><span className="avatar small">{initials(user.name)}</span><ChevronDown size={14} /></button></div></header>
          {active === 'Overview' || active === 'My interviews' ? <Dashboard {...{filtered, query, setQuery, filter, setFilter, setShowModal, notify, active, setActive, interviews, setSelectedInterview, stats, user}} /> : active === 'Preparation' ? <PreparationPage interviews={interviews} notify={notify} /> : active === 'Question bank' ? <QuestionBank interviews={interviews} setSelectedInterview={setSelectedInterview} /> : <EmptySection title={active} notify={notify} />}
        </main>
        {showModal && <AddModal onClose={() => setShowModal(false)} onSubmit={addInterview} />}
        {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setShowAuth(false)} onSuccess={handleAuth} onError={notify} />}
        {selectedInterview && <InterviewDetailModal interview={selectedInterview} onClose={() => setSelectedInterview(null)} onSave={saveInterviewDetails} onDelete={deleteInterview} onError={notify} />}
        {toast && <div className="toast"><span className="toast-dot" />{toast}</div>}
      </div>
    </StylingContext.Provider>
  );
}

function Dashboard({ filtered, query, setQuery, filter, setFilter, setShowModal, notify, active, setActive, interviews, setSelectedInterview, stats, user }) {
  const { theme } = useStyling();
  const insights = buildInsights(interviews);
  return <div className="page" data-theme={theme}>
    <section className="hero-row"><div><p className="eyebrow"><span className="pulse" /> Your interview workspace</p><h1>Good morning, {user?.name?.split(' ')[0] || 'there'}<span className="lime">.</span></h1><p className="hero-copy">Capture the signal. Improve the outcome.</p></div><button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} />Add interview</button></section>
    <section className="stat-grid">
      <StatCard icon={BriefcaseBusiness} label="Total interviews" value={stats?.total ?? interviews.length} meta="Saved experiences" positive />
      <StatCard icon={TrendingUp} label="Average confidence" value={stats?.averageConfidence ? stats.averageConfidence.toFixed(1) : '—'} meta="Across scored interviews" positive />
      <StatCard icon={Target} label="Offers received" value={stats?.offers ?? interviews.filter((item) => item.result === 'Offer').length} meta="Conversion signal" positive />
      <StatCard icon={Clock3} label="Last interview" value={interviews[0]?.date || '—'} meta={interviews[0]?.company || 'No interviews yet'} />
    </section>
    <section className="content-grid">
      <div className="panel interview-panel"><div className="panel-heading"><div><h2>{active === 'Overview' ? 'Recent interviews' : 'All interviews'}</h2><p>{active === 'Overview' ? 'Your latest interview experiences' : `${interviews.length} experiences in your journal`}</p></div><button className="ghost-button" onClick={() => setActive('My interviews')}>View all <ArrowUpRight size={15} /></button></div>
        <div className="toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, role, or topic..." /><kbd>⌘ K</kbd></div><div className="filter-wrap"><Filter size={15} /><select value={filter} onChange={(e) => setFilter(e.target.value)}><option>All interviews</option><option>Offer</option><option>Advanced</option><option>Pending</option><option>Rejected</option><option>Hard</option><option>Medium</option></select></div></div>
        <div className="interview-list">{filtered.length ? filtered.map(item => <InterviewRow key={item.id} item={item} notify={notify} onOpen={() => setSelectedInterview(item)} />) : <div className="empty-state"><Search size={24} /><strong>No interviews found</strong><span>Try a different search or filter.</span></div>}</div>
      </div>
      <div className="right-column"><section className="panel focus-panel"><div className="panel-heading"><div><h2>Keep your edge</h2><p>Based on your journal data.</p></div><Sparkles size={18} className="lime-icon" /></div><div className="progress-ring" style={{ background: `conic-gradient(var(--lime) 0 ${insights.readiness}%, #30372e ${insights.readiness}% 100%)` }}><div><strong>{insights.readiness}%</strong><span>ready for next</span></div></div><div className="focus-copy">You’re strongest on <strong>{insights.strongestTopic}</strong>. Spend 20 minutes reviewing <strong>{insights.weakestTopic}</strong> today.</div><button className="secondary-button" onClick={() => notify(`Prep session focused on ${insights.weakestTopic}`)}>Start a prep session <ArrowUpRight size={15} /></button></section><section className="panel topics-panel"><div className="panel-heading"><div><h2>Top topics</h2><p>Based on your rounds and questions</p></div><MoreHorizontal size={18} /></div>{insights.topicRows.length ? insights.topicRows.map(({ name, percent }) => <div className="topic-row" key={name}><div><span>{name}</span><small>{percent}%</small></div><div className="bar"><span style={{ width: `${percent}%` }} /></div></div>) : <div className="empty-state"><FileText size={24} /><strong>No topics yet</strong><span>Add rounds to build your topic profile.</span></div>}<button className="text-button" onClick={() => notify('Question bank opened')}>Explore question bank <ArrowUpRight size={14} /></button></section></div>
    </section>
  </div>;
}

function StatCard({ icon: Icon, label, value, meta, positive }) { return <div className="stat-card"><div className="stat-icon"><Icon size={17} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><small className={positive ? 'positive' : ''}>{positive && <TrendingUp size={12} />}{meta}</small></div>; }
function InterviewRow({ item, notify, onOpen }) { return <div className="interview-row" onClick={onOpen}><div className="company-logo" style={{ background: item.color, color: '#101110' }}>{item.logo}</div><div className="interview-main"><strong>{item.company}</strong><span>{item.role}</span></div><div className="interview-date">{item.date}</div><div className="rounds"><Code2 size={14} />{item.roundCount ?? item.rounds ?? 0} rounds</div><span className={`result ${item.result.toLowerCase()}`}>{item.result}</span><button className="row-menu" onClick={(e) => { e.stopPropagation(); onOpen(); }}><Pencil size={15} /></button></div>; }
function EmptySection({ title, notify }) { return <div className="empty-section"><div className="empty-illustration"><BookOpen size={30} /></div><h1>{title}</h1><p>This section is ready for your next preparation session.</p><button className="primary-button" onClick={() => notify('This feature is coming soon')}><Plus size={18} />Get started</button></div>; }
function PreparationPage({ interviews, notify }) {
  const hard = interviews.filter((item) => item.difficulty === 'Hard');
  return <div className="page"><section className="hero-row"><div><p className="eyebrow"><span className="pulse" /> Preparation plan</p><h1>Prepare with intent<span className="lime">.</span></h1><p className="hero-copy">Turn your interview history into your next study session.</p></div><button className="primary-button" onClick={() => notify('Prep session marked as started')}><Zap size={16} />Start session</button></section><div className="prep-grid"><section className="panel prep-card"><div className="panel-heading"><div><h2>Recommended focus</h2><p>Based on your hardest interviews</p></div><Target size={18} className="lime-icon" /></div>{hard.length ? hard.slice(0, 3).map((item) => <div className="prep-item" key={item.id}><div className="company-logo">{item.logo}</div><div><strong>{item.company} · {item.role}</strong><span>Review {item.roundCount ?? item.rounds ?? 0} rounds and revisit your answers</span></div><ChevronRight size={16} /></div>) : <div className="empty-state"><Target size={24} /><strong>No focus areas yet</strong><span>Add a hard interview to generate a plan.</span></div>}</section><section className="panel prep-card"><div className="panel-heading"><div><h2>Daily rhythm</h2><p>Small, consistent improvements</p></div><Clock3 size={18} className="lime-icon" /></div>{['Review one answer', 'Practice a system design prompt', 'Write one reflection'].map((task) => <div className="check-item" key={task}><span className="check-box" />{task}</div>)}</section></div></div>;
}
function QuestionBank({ interviews, setSelectedInterview }) {
  const questions = interviews.flatMap((interview) => (interview.rounds || []).flatMap((round) => (round.questions || []).map((question) => ({ ...question, company: interview.company, role: interview.role, interview }))));
  return <div className="page"><section className="hero-row"><div><p className="eyebrow"><span className="pulse" /> Your question bank</p><h1>Learn from the questions<span className="lime">.</span></h1><p className="hero-copy">Every question is a chance to sharpen your signal.</p></div></section><section className="panel question-bank-panel">{questions.length ? questions.map((question, index) => <button className="bank-question" key={question._id || index} onClick={() => setSelectedInterview(question.interview)}><div className="question-number">Q{index + 1}</div><div><strong>{question.prompt}</strong><span>{question.company} · {question.role}</span><small>{question.answer ? 'Answered' : 'Needs answer'}</small></div><ChevronRight size={16} /></button>) : <div className="empty-state"><FileText size={24} /><strong>Your question bank is empty</strong><span>Open an interview and add your first question.</span></div>}</section></div>;
}
function InterviewDetailModal({ interview, onClose, onSave, onDelete, onError }) {
  const [rounds, setRounds] = useState(interview.rounds?.length ? interview.rounds : [{ name: 'Round 1', type: 'Technical', notes: '', questions: [] }]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(interview.result || 'Pending');
  const [difficulty, setDifficulty] = useState(interview.difficulty || 'Medium');
  const [score, setScore] = useState(interview.confidenceScore ?? '');
  const [reflection, setReflection] = useState(interview.reflection || '');
  const updateRound = (roundIndex, changes) => setRounds((current) => current.map((round, index) => index === roundIndex ? { ...round, ...changes } : round));
  const updateQuestion = (roundIndex, questionIndex, changes) => setRounds((current) => current.map((round, index) => index === roundIndex ? { ...round, questions: round.questions.map((question, qIndex) => qIndex === questionIndex ? { ...question, ...changes } : question) } : round));
  const save = () => {
    if (rounds.some((round) => !round.name.trim() || (round.questions || []).some((question) => !question.prompt.trim()))) {
      onError('Each round and question needs a name before saving');
      return;
    }
    setSaving(true);
    interviewApi.update(interview.id, { rounds, result, difficulty, confidenceScore: score === '' ? undefined : Number(score), reflection }).then(({ data }) => onSave(data.interview)).catch((error) => onError(error.response?.data?.message || 'Could not save interview notes')).finally(() => setSaving(false));
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal detail-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">{interview.company} · {interview.role}</p><h2>Interview notes</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="detail-meta"><label>Result<select value={result} onChange={(event) => setResult(event.target.value)}><option>Pending</option><option>Advanced</option><option>Rejected</option><option>Offer</option></select></label><label>Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Confidence<input type="number" min="0" max="10" step=".1" value={score} onChange={(event) => setScore(event.target.value)} placeholder="0–10" /></label></div><label className="detail-reflection">Reflection<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} rows="3" placeholder="What did you learn?" /></label><div className="round-editor">{rounds.map((round, roundIndex) => <section className="round-card" key={round._id || roundIndex}><div className="round-title"><input value={round.name} onChange={(event) => updateRound(roundIndex, { name: event.target.value })} /><button className="text-button" onClick={() => setRounds((current) => current.filter((_, index) => index !== roundIndex))}><Trash2 size={14} />Remove</button></div><input className="round-type" value={round.type || ''} onChange={(event) => updateRound(roundIndex, { type: event.target.value })} placeholder="Round type, e.g. System design" />{(round.questions || []).map((question, questionIndex) => <div className="question-card" key={question._id || questionIndex}><div className="question-number">Q{questionIndex + 1}</div><div className="question-fields"><textarea value={question.prompt} onChange={(event) => updateQuestion(roundIndex, questionIndex, { prompt: event.target.value })} placeholder="Question asked" rows="2" /><textarea value={question.answer || ''} onChange={(event) => updateQuestion(roundIndex, questionIndex, { answer: event.target.value })} placeholder="How did you answer?" rows="2" /></div><button className="row-menu" onClick={() => updateRound(roundIndex, { questions: round.questions.filter((_, index) => index !== questionIndex) })}><Trash2 size={14} /></button></div>)}<button className="add-question" onClick={() => updateRound(roundIndex, { questions: [...(round.questions || []), { prompt: '', answer: '', notes: '' }] })}><Plus size={14} />Add question</button></section>)}<button className="secondary-button add-round" onClick={() => setRounds((current) => [...current, { name: `Round ${current.length + 1}`, type: 'Technical', notes: '', questions: [] }])}><Plus size={15} />Add interview round</button></div><div className="detail-actions"><button className="danger-button" onClick={() => onDelete(interview.id)}><Trash2 size={14} />Delete interview</button><button className="primary-button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save notes'} <ArrowUpRight size={16} /></button></div></div></div>;
}
function AddModal({ onClose, onSubmit }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">New journal entry</p><h2>Log an interview</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><form onSubmit={onSubmit}><label>Company<input name="company" required placeholder="e.g. Acme, Inc." /></label><label>Role<input name="role" required placeholder="e.g. Software Engineer" /></label><div className="form-grid"><label>Date<input type="date" name="date" /></label><label>Difficulty<select name="difficulty"><option>Medium</option><option>Easy</option><option>Hard</option></select></label></div><label>Quick reflection<textarea name="reflection" placeholder="What stood out about this interview?" rows="3" /></label><button className="primary-button full" type="submit">Save interview <ArrowUpRight size={16} /></button></form></div></div>; }

function AuthModal({ mode, setMode, closable = true, onClose, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { name: data.get('name'), email: data.get('email'), password: data.get('password') };
    setLoading(true);
    (mode === 'login' ? authApi.login(payload) : authApi.register(payload))
      .then(({ data: response }) => onSuccess(response.user, response.token))
      .catch((error) => onError(error.response?.data?.message || 'Authentication failed'))
      .finally(() => setLoading(false));
  };
  return <div className="modal-backdrop" onMouseDown={closable ? onClose : undefined}><div className="modal auth-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</p><h2>{mode === 'login' ? 'Sign in to PrepJournal' : 'Start your journal'}</h2></div>{closable && <button className="icon-button" onClick={onClose}><X size={18} /></button>}</div><form onSubmit={submit}>{mode === 'register' && <label>Your name<input name="name" required minLength="2" placeholder="Harsh" /></label>}<label>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required minLength="8" placeholder="At least 8 characters" /></label><button className="primary-button full" disabled={loading} type="submit">{loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowUpRight size={16} /></button></form><button className="auth-switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
