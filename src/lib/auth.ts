/**
 * Authentication and User Management Library
 * Stores user accounts and exam history in localStorage
 * Enhanced with debugging and verification
 */

// Enable debug logging in production
const DEBUG = true;

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[AUTH] ${message}`, data || '');
  }
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  sessionId: string;
  startedAt: number;
  completedAt: number;
  score: number;
  percentage: number;
  mcqScore: number;
  mcqPercentage: number;
  planAttempted: number;
  passed: boolean;
  mcqPassed: boolean;
  topicBreakdown: { topic: string; correct: number; total: number; percentage: number }[];
}

export interface AuthSession {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  loginAt: number;
}

const USERS_STORAGE_KEY = 'exam_portal_users';
const AUTH_SESSION_KEY = 'exam_portal_auth';
const EXAM_ATTEMPTS_KEY = 'exam_portal_attempts';

/**
 * Hash password using Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Initialize default admin account
 */
export async function initializeDefaultAdmin(): Promise<void> {
  const users = loadUsers();
  const adminExists = users.some(u => u.username === 'Buildco_admin');

  if (!adminExists) {
    const admin: User = {
      id: generateId(),
      username: 'Buildco_admin',
      passwordHash: await hashPassword('admin'),
      role: 'admin',
      createdAt: Date.now()
    };
    users.push(admin);
    saveUsers(users);
  }
}

/**
 * Load all users from storage
 */
function loadUsers(): User[] {
  if (typeof window === 'undefined') {
    debugLog('loadUsers: window is undefined (SSR)');
    return [];
  }

  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    const users = stored ? JSON.parse(stored) : [];
    debugLog(`loadUsers: Loaded ${users.length} users`, users.map((u: User) => u.username));
    return users;
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
}

/**
 * Save users to storage
 */
function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') {
    debugLog('saveUsers: window is undefined (SSR)');
    return;
  }

  try {
    const dataToSave = JSON.stringify(users);
    localStorage.setItem(USERS_STORAGE_KEY, dataToSave);
    debugLog(`saveUsers: Saved ${users.length} users`, users.map(u => u.username));

    // Verify the save worked
    const verification = localStorage.getItem(USERS_STORAGE_KEY);
    if (verification !== dataToSave) {
      console.error('saveUsers: Verification failed! Data was not saved correctly.');
    } else {
      debugLog('saveUsers: Verification successful');
    }
  } catch (error) {
    console.error('Failed to save users:', error);
  }
}

/**
 * Register new user (admin only)
 */
export async function registerUser(username: string, password: string, role: 'user' | 'admin' = 'user'): Promise<{ success: boolean; error?: string; user?: User }> {
  debugLog(`registerUser: Attempting to register user "${username}" with role "${role}"`);

  const users = loadUsers();
  debugLog(`registerUser: Current users before registration:`, users.map(u => u.username));

  // Check if username already exists
  if (users.some(u => u.username === username)) {
    debugLog(`registerUser: Username "${username}" already exists`);
    return { success: false, error: 'Username already exists' };
  }

  const passwordHash = await hashPassword(password);
  debugLog(`registerUser: Password hashed for "${username}"`);

  const user: User = {
    id: generateId(),
    username,
    passwordHash,
    role,
    createdAt: Date.now()
  };

  users.push(user);
  debugLog(`registerUser: User "${username}" added to array, total users: ${users.length}`);

  saveUsers(users);

  // Verify the user was saved
  const verifyUsers = loadUsers();
  const userExists = verifyUsers.some(u => u.username === username);

  if (!userExists) {
    console.error(`registerUser: CRITICAL - User "${username}" was not saved!`);
    return { success: false, error: 'Failed to save user to storage' };
  }

  debugLog(`registerUser: User "${username}" successfully registered and verified`);
  return { success: true, user };
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
  debugLog(`login: Attempting login for "${username}"`);

  const users = loadUsers();
  debugLog(`login: Total users in system: ${users.length}`, users.map(u => u.username));

  const user = users.find(u => u.username === username);

  if (!user) {
    debugLog(`login: User "${username}" not found`);
    return { success: false, error: 'Invalid username or password' };
  }

  debugLog(`login: User "${username}" found, verifying password...`);
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    debugLog(`login: Password verification failed for "${username}"`);
    return { success: false, error: 'Invalid username or password' };
  }

  debugLog(`login: Password verified for "${username}"`);

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    loginAt: Date.now()
  };

  saveAuthSession(session);
  debugLog(`login: Session created for "${username}"`, session);

  return { success: true, session };
}

/**
 * Logout current user
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
}

/**
 * Get current auth session
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load auth session:', error);
    return null;
  }
}

/**
 * Save auth session
 */
function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save auth session:', error);
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  const session = getCurrentSession();
  return session?.role === 'admin';
}

/**
 * Get all users (admin only)
 */
export function getAllUsers(): User[] {
  if (!isAdmin()) return [];
  return loadUsers();
}

/**
 * Save exam attempt
 */
export function saveExamAttempt(attempt: Omit<ExamAttempt, 'id'>): void {
  if (typeof window === 'undefined') return;

  try {
    const attempts = loadExamAttempts();
    const attemptWithId: ExamAttempt = {
      ...attempt,
      id: generateId()
    };
    attempts.push(attemptWithId);
    localStorage.setItem(EXAM_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Failed to save exam attempt:', error);
  }
}

/**
 * Load exam attempts
 */
function loadExamAttempts(): ExamAttempt[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(EXAM_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load exam attempts:', error);
    return [];
  }
}

/**
 * Get user's exam attempts
 */
export function getUserExamAttempts(userId: string): ExamAttempt[] {
  const attempts = loadExamAttempts();
  return attempts.filter(a => a.userId === userId).sort((a, b) => b.completedAt - a.completedAt);
}

/**
 * Get all exam attempts (admin only)
 */
export function getAllExamAttempts(): ExamAttempt[] {
  if (!isAdmin()) return [];
  return loadExamAttempts().sort((a, b) => b.completedAt - a.completedAt);
}

/**
 * Generate random password
 */
export function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Delete user (admin only)
 */
export function deleteUser(userId: string): boolean {
  if (!isAdmin()) return false;

  const users = loadUsers();
  const filteredUsers = users.filter(u => u.id !== userId);

  if (filteredUsers.length === users.length) {
    return false; // User not found
  }

  saveUsers(filteredUsers);
  return true;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debug function - expose to window for troubleshooting
 * Call window.debugAuth() in browser console to see all auth data
 */
export function debugAuth() {
  if (typeof window === 'undefined') {
    console.log('Cannot debug - not in browser');
    return;
  }

  console.log('=== EXAM PORTAL AUTH DEBUG ===');

  const users = loadUsers();
  console.log(`\n📊 Total Users: ${users.length}`);
  users.forEach(u => {
    console.log(`  - ${u.username} (${u.role}) [ID: ${u.id}]`);
  });

  const session = getCurrentSession();
  console.log(`\n🔐 Current Session:`, session || 'Not logged in');

  const attempts = loadExamAttempts();
  console.log(`\n📝 Total Exam Attempts: ${attempts.length}`);

  console.log(`\n💾 LocalStorage Keys:`);
  console.log(`  - ${USERS_STORAGE_KEY}:`, localStorage.getItem(USERS_STORAGE_KEY)?.substring(0, 100) + '...');
  console.log(`  - ${AUTH_SESSION_KEY}:`, localStorage.getItem(AUTH_SESSION_KEY));
  console.log(`  - ${EXAM_ATTEMPTS_KEY}:`, localStorage.getItem(EXAM_ATTEMPTS_KEY)?.substring(0, 100) + '...');

  console.log('\n=== END DEBUG ===');
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
