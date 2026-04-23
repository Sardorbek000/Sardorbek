import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database("app.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    groupIds TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    teacherId TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    title TEXT,
    createdBy TEXT,
    startTime INTEGER,
    endTime INTEGER,
    durationLimit INTEGER,
    showResult INTEGER,
    showAnswers INTEGER,
    groupIds TEXT,
    createdAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    testId TEXT,
    question TEXT,
    type TEXT,
    options TEXT,
    correctAnswer TEXT,
    points INTEGER
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    testId TEXT,
    userId TEXT,
    startedAt INTEGER,
    status TEXT,
    warnings INTEGER,
    score INTEGER,
    totalQuestions INTEGER,
    finishedAt INTEGER,
    forceFailed INTEGER
  );

  CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    attemptId TEXT,
    questionId TEXT,
    answer TEXT,
    isCorrect INTEGER
  );
`);

try {
  db.exec("ALTER TABLE tests ADD COLUMN isClosed INTEGER DEFAULT 0");
} catch (e) {}

// Helper to hash passwords securely
const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
const verifyPassword = (password: string, hash: string) => bcrypt.compareSync(password, hash);

// Insert initial admin if none exists
const hasAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
if (!hasAdmin) {
  db.prepare(
    "INSERT INTO users (id, name, email, password, role, groupIds, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run('u_' + Date.now(), "System Admin", "admin@maqsad.pro", hashPassword("A1234567"), "admin", "[]", Date.now());
}

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-maqsad-key";

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Generate UUID simple function
const generateId = () => Math.random().toString(36).substring(2, 15);

// API Endpoints
app.post("/api/dev-login", (req, res) => {
  const { role } = req.body;
  let user = db.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").get(role) as any;
  if (!user) {
    const id = generateId();
    const email = `dev_${role}@test.com`;
    const name = `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    db.prepare("INSERT INTO users (id, name, email, password, role, groupIds, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, name, email, hashPassword("123"), role, "[]", Date.now()
    );
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: { ...userWithoutPassword, groupIds: JSON.parse(user.groupIds || '[]') } });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  
  if (!user || !verifyPassword(password, user.password || '')) {
    // If verifyPassword fails but plain text matches (for legacy migration local safety)
    if (user && user.password === password) {
       // Auto-upgrade plain text to hash
       const hash = hashPassword(password);
       db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, user.id);
    } else {
       return res.status(401).json({ error: "Invalid credentials" });
    }
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  // Don't send password hash to client
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: { ...userWithoutPassword, groupIds: JSON.parse(user.groupIds || '[]') } });
});

app.post("/api/register", (req, res) => {
  const { email, password, role, name } = req.body;
  try {
    const id = generateId();
    db.prepare("INSERT INTO users (id, name, email, password, role, groupIds, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, name, email, hashPassword(password), role || "student", "[]", Date.now()
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ ...userWithoutPassword, groupIds: JSON.parse(user.groupIds || '[]') });
});

app.get("/api/users", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, groupIds, createdAt FROM users").all();
  res.json(users.map((u: any) => ({ ...u, groupIds: JSON.parse(u.groupIds || '[]') })));
});

// Groups
app.get("/api/groups", authenticateToken, (req: any, res) => {
  if (req.user.role === 'teacher') {
    const groups = db.prepare("SELECT * FROM groups WHERE teacherId = ?").all(req.user.id);
    res.json(groups);
  } else {
    const groups = db.prepare("SELECT * FROM groups").all();
    res.json(groups);
  }
});

app.post("/api/groups", authenticateToken, (req: any, res) => {
  const { name, teacherId } = req.body;
  const id = generateId();
  db.prepare("INSERT INTO groups (id, name, teacherId, createdAt) VALUES (?, ?, ?, ?)").run(id, name, teacherId, Date.now());
  res.json({ id });
});

// User Group Binding
app.post("/api/users/me/groups", authenticateToken, (req: any, res) => {
  const { groupId } = req.body;
  const user = db.prepare("SELECT groupIds FROM users WHERE id = ?").get(req.user.id) as any;
  const groups = JSON.parse(user.groupIds || '[]');
  if (!groups.includes(groupId)) {
    groups.push(groupId);
    db.prepare("UPDATE users SET groupIds = ? WHERE id = ?").run(JSON.stringify(groups), req.user.id);
  }
  res.json({ success: true });
});

// Dashboard Summary
app.get("/api/teacher/summary", authenticateToken, (req: any, res) => {
  const totalGroups = (db.prepare("SELECT COUNT(*) as count FROM groups WHERE teacherId = ?").get(req.user.id) as any).count;
  const totalTests = (db.prepare("SELECT COUNT(*) as count FROM tests WHERE createdBy = ?").get(req.user.id) as any).count;
  const totalAttempts = (db.prepare(`
    SELECT COUNT(*) as count FROM attempts a JOIN tests t ON a.testId = t.id WHERE t.createdBy = ?
  `).get(req.user.id) as any).count;

  const recentAttempts = db.prepare(`
    SELECT a.id, a.score, a.finishedAt, a.status, u.name as studentName, t.title as testTitle 
    FROM attempts a 
    JOIN tests t ON a.testId = t.id 
    JOIN users u ON a.userId = u.id 
    WHERE t.createdBy = ? AND a.status = 'completed'
    ORDER BY a.finishedAt DESC 
    LIMIT 10
  `).all(req.user.id);

  res.json({ totalGroups, totalTests, totalAttempts, recentAttempts });
});

// Tests
app.get("/api/tests", authenticateToken, (req: any, res) => {
  const tests = db.prepare("SELECT * FROM tests WHERE createdBy = ?").all(req.user.id);
  res.json(tests.map((t: any) => ({ ...t, groupIds: JSON.parse(t.groupIds || '[]'), showResult: t.showResult === 1, showAnswers: t.showAnswers === 1, isClosed: t.isClosed === 1 })));
});

app.get("/api/student/tests", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT groupIds FROM users WHERE id = ?").get(req.user.id) as any;
  const userGroupIds = JSON.parse(user.groupIds || '[]');
  if (userGroupIds.length === 0) return res.json([]);
  
  // Create IN clause for groupIds natively with param array
  const allTests = db.prepare("SELECT * FROM tests WHERE isClosed = 0").all() as any[];
  
  // Omit tests already completed by this user
  const myAttempts = db.prepare("SELECT testId FROM attempts WHERE userId = ? AND status = 'completed'").all(req.user.id) as any[];
  const compIds = myAttempts.map(a => a.testId);

  const assignedTests = allTests.filter(t => {
     if (compIds.includes(t.id)) return false;
     const tGroups = JSON.parse(t.groupIds || '[]');
     return tGroups.some((id: string) => userGroupIds.includes(id));
  });
  
  res.json(assignedTests.map((t: any) => ({ ...t, groupIds: JSON.parse(t.groupIds || '[]'), showResult: t.showResult === 1, showAnswers: t.showAnswers === 1, isClosed: false })));
});

app.post("/api/tests", authenticateToken, (req: any, res) => {
  const { title, startTime, endTime, durationLimit, showResult, showAnswers, groupIds } = req.body;
  const id = generateId();
  try {
    db.prepare("INSERT INTO tests (id, title, createdBy, startTime, endTime, durationLimit, showResult, showAnswers, groupIds, isClosed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)").run(
      id, 
      title || 'Untitled Test', 
      req.user.id, 
      startTime || Date.now(), 
      endTime || Date.now() + 86400000, 
      durationLimit || 60, 
      showResult ? 1 : 0, 
      showAnswers ? 1 : 0, 
      JSON.stringify(groupIds || []), 
      Date.now()
    );
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/tests/:testId", authenticateToken, (req, res) => {
  const { title, durationLimit, groupIds, isClosed, startTime, endTime } = req.body;
  // Dynamic update for simplicitiy
  let u = [];
  let p = [];
  if (title !== undefined) { u.push("title = ?"); p.push(title); }
  if (durationLimit !== undefined) { u.push("durationLimit = ?"); p.push(durationLimit); }
  if (isClosed !== undefined) { u.push("isClosed = ?"); p.push(isClosed ? 1 : 0); }
  if (startTime !== undefined) { u.push("startTime = ?"); p.push(startTime); }
  if (endTime !== undefined) { u.push("endTime = ?"); p.push(endTime); }
  if (groupIds !== undefined) { u.push("groupIds = ?"); p.push(JSON.stringify(groupIds)); }
  if (u.length > 0) {
    db.prepare(`UPDATE tests SET ${u.join(', ')} WHERE id = ?`).run(...p, req.params.testId);
  }
  res.json({ success: true });
});

app.get("/api/tests/:testId", authenticateToken, (req, res) => {
  const test = db.prepare("SELECT * FROM tests WHERE id = ?").get(req.params.testId) as any;
  if (!test) return res.status(404).json({ error: "Not found" });
  res.json({ ...test, groupIds: JSON.parse(test.groupIds || '[]'), showResult: test.showResult === 1, showAnswers: test.showAnswers === 1, isClosed: test.isClosed === 1 });
});

app.delete("/api/tests/:testId", authenticateToken, (req, res) => {
  const tId = req.params.testId;
  db.transaction(() => {
    db.prepare("DELETE FROM tests WHERE id = ?").run(tId);
    db.prepare("DELETE FROM questions WHERE testId = ?").run(tId);
    
    // Get attempts to delete answers
    const attempts = db.prepare("SELECT id FROM attempts WHERE testId = ?").all(tId) as {id: string}[];
    attempts.forEach(a => {
      db.prepare("DELETE FROM answers WHERE attemptId = ?").run(a.id);
    });
    
    db.prepare("DELETE FROM attempts WHERE testId = ?").run(tId);
  })();
  res.json({ success: true });
});

app.get("/api/tests/:testId/results", authenticateToken, (req, res) => {
  const tId = req.params.testId;
  const rawAttempts = db.prepare(`
    SELECT a.*, u.name as studentName, u.email as studentEmail 
    FROM attempts a 
    JOIN users u ON a.userId = u.id 
    WHERE a.testId = ? 
    ORDER BY a.finishedAt DESC
  `).all(tId);
  res.json(rawAttempts);
});

// Reset Attempt (Allow Retake)
app.post("/api/teacher/tests/:testId/retake", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied." });
  }
  
  const { userId } = req.body;
  const testId = req.params.testId;
  
  try {
    if (userId) {
      db.prepare("UPDATE attempts SET status = 'archived' WHERE testId = ? AND userId = ? AND status = 'completed'").run(testId, userId);
    } else {
      db.prepare("UPDATE attempts SET status = 'archived' WHERE testId = ? AND status = 'completed'").run(testId);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/teacher/attempts/:attemptId/review", authenticateToken, (req: any, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Access denied." });
  }
  const attempt = db.prepare(`
    SELECT a.*, u.name as studentName, u.email as studentEmail, t.isClosed 
    FROM attempts a 
    JOIN tests t ON a.testId = t.id 
    JOIN users u ON a.userId = u.id
    WHERE a.id = ? AND t.createdBy = ?
  `).get(req.params.attemptId, req.user.id) as any;

  if (!attempt) return res.status(404).json({ error: "Attempt not found or access denied." });

  const questions = db.prepare("SELECT id, question, type, options, correctAnswer, points FROM questions WHERE testId = ?").all(attempt.testId);
  const answers = db.prepare("SELECT questionId, answer, isCorrect FROM answers WHERE attemptId = ?").all(attempt.id);
  res.json({ 
    attempt, 
    questions: questions.map((q: any) => ({ ...q, options: JSON.parse(q.options || '[]') })), 
    answers 
  });
});

// Questions
app.get("/api/tests/:testId/questions", authenticateToken, (req, res) => {
  const questions = db.prepare("SELECT * FROM questions WHERE testId = ?").all(req.params.testId);
  res.json(questions.map((q: any) => ({ ...q, options: JSON.parse(q.options || '[]') })));
});

app.post("/api/tests/:testId/questions", authenticateToken, (req, res) => {
  const { question, type, options, correctAnswer, points } = req.body;
  const id = generateId();
  try {
    db.prepare("INSERT INTO questions (id, testId, question, type, options, correctAnswer, points) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, req.params.testId, question || 'New Question', type || 'mcq', JSON.stringify(options || []), correctAnswer || '', points || 1
    );
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/questions/:qId", authenticateToken, (req, res) => {
  const { question, type, options, correctAnswer, points } = req.body;
  try {
    db.prepare("UPDATE questions SET question = ?, type = ?, options = ?, correctAnswer = ?, points = ? WHERE id = ?").run(
      question || 'Question', type || 'mcq', JSON.stringify(options || []), correctAnswer || '', points || 1, req.params.qId
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/questions/:qId", authenticateToken, (req, res) => {
  db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.qId);
  res.json({ success: true });
});

// Attempts
app.get("/api/student/results", authenticateToken, (req: any, res) => {
  const attempts = db.prepare(`
    SELECT a.*, t.title as testTitle, t.isClosed 
    FROM attempts a 
    JOIN tests t ON a.testId = t.id 
    WHERE a.userId = ? 
    ORDER BY a.finishedAt DESC
  `).all(req.user.id);
  res.json(attempts);
});

app.get("/api/student/attempts/:attemptId/review", authenticateToken, (req: any, res) => {
  const attempt = db.prepare(`
    SELECT a.*, t.isClosed, t.showAnswers 
    FROM attempts a 
    JOIN tests t ON a.testId = t.id 
    WHERE a.id = ? AND a.userId = ?
  `).get(req.params.attemptId, req.user.id) as any;

  if (!attempt) return res.status(404).json({ error: "Not found" });
  if (attempt.isClosed !== 1) {
    return res.status(403).json({ error: "Answers strictly locked. Waiting for teacher to close the global session." });
  }

  const questions = db.prepare("SELECT id, question, type, options, correctAnswer, points FROM questions WHERE testId = ?").all(attempt.testId);
  const answers = db.prepare("SELECT questionId, answer, isCorrect FROM answers WHERE attemptId = ?").all(attempt.id);
  res.json({ questions: questions.map((q: any) => ({ ...q, options: JSON.parse(q.options || '[]') })), answers });
});

app.post("/api/attempts", authenticateToken, (req, res) => {
  const { testId, userId, startedAt, status, warnings } = req.body;
  const id = generateId();
  try {
    db.prepare("INSERT INTO attempts (id, testId, userId, startedAt, status, warnings, score, totalQuestions, finishedAt, forceFailed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      id, testId, userId, startedAt || Date.now(), status || 'started', warnings || 0, 0, 0, 0, 0
    );
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/attempts/:attemptId", authenticateToken, (req, res) => {
  const { status, finishedAt, score, totalQuestions, warnings, forceFailed } = req.body;
  try {
    db.prepare("UPDATE attempts SET status = ?, finishedAt = ?, score = ?, totalQuestions = ?, warnings = ?, forceFailed = ? WHERE id = ?").run(
      status || 'completed', finishedAt || Date.now(), score || 0, totalQuestions || 0, warnings || 0, forceFailed ? 1 : 0, req.params.attemptId
    );
    res.json({ success: true });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/attempts/:attemptId/answers", authenticateToken, (req, res) => {
  const { questionId, answer, isCorrect } = req.body;
  const id = generateId();
  try {
    db.prepare("INSERT INTO answers (id, attemptId, questionId, answer, isCorrect) VALUES (?, ?, ?, ?, ?)").run(
      id, req.params.attemptId, questionId, answer || '', isCorrect ? 1 : 0
    );
    res.json({ id });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
