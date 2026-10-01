/**
 * auth.js — fake authentication backed by localStorage.
 *
 * FOR TESTING ONLY: users (including passwords) are stored in plain text
 * in this browser's localStorage. Never use a real password here.
 *
 * A demo account is seeded on first load (and after "Reset demo data"):
 *   demo@example.com / demo1234
 *
 * Login and logout fire an "auth:change" event on document.
 */
const Auth = (() => {
  const USERS_KEY = 'users';
  const SESSION_KEY = 'session';
  const DEMO_USER = { name: 'Demo User', email: 'demo@example.com', password: 'demo1234' };

  const normalizeEmail = email => String(email).trim().toLowerCase();

  function users() {
    return AppStorage.read(USERS_KEY, []);
  }

  function seedDemoUser() {
    if (AppStorage.read(USERS_KEY, null) === null) {
      AppStorage.write(USERS_KEY, [DEMO_USER]);
    }
  }

  function notify() {
    document.dispatchEvent(new CustomEvent('auth:change', { detail: { user: current() } }));
  }

  function startSession(user) {
    AppStorage.write(SESSION_KEY, { name: user.name, email: user.email });
    notify();
  }

  /** The logged-in user ({ name, email }) or null. */
  function current() {
    return AppStorage.read(SESSION_KEY, null);
  }

  function register({ name, email, password }) {
    const cleanEmail = normalizeEmail(email);
    const list = users();
    if (list.some(user => user.email === cleanEmail)) {
      return { ok: false, field: 'email', error: 'An account with this email already exists. Try logging in instead.' };
    }
    const user = { name: String(name).trim(), email: cleanEmail, password };
    list.push(user);
    AppStorage.write(USERS_KEY, list);
    startSession(user);
    return { ok: true, user };
  }

  function login({ email, password }) {
    const user = users().find(candidate => candidate.email === normalizeEmail(email));
    if (!user || user.password !== password) {
      return { ok: false, error: 'That email and password combination is incorrect.' };
    }
    startSession(user);
    return { ok: true, user };
  }

  function logout() {
    AppStorage.remove(SESSION_KEY);
    notify();
  }

  seedDemoUser();

  return { current, register, login, logout, DEMO_EMAIL: DEMO_USER.email };
})();
