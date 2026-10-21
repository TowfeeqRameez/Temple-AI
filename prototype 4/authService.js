/* ============================================================
   TempleVerse - Sacred Authentication & Account Service
   Full-Stack Persistent Devotee Profiles, Sign In & Sign Up
   Connects to Express / SQLite Backend with Local Fallback
   ============================================================ */

class TempleVerseAuthService {
  constructor() {
    this.USERS_KEY = 'templeverse_users';
    this.CURRENT_USER_KEY = 'templeverse_current_user';
    this.TOKEN_KEY = 'templeverse_jwt_token';
    this.initDefaultUsers();
  }

  /**
   * Initializes sample demo user in local cache if none exist
   */
  initDefaultUsers() {
    if (typeof localStorage === 'undefined') return;
    const existing = localStorage.getItem(this.USERS_KEY);
    if (!existing) {
      const defaultUsers = [
        {
          name: "Devotee Pilgrim",
          email: "pilgrim@templeverse.com",
          password: "temple108",
          state: "All India",
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  getUsers() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getToken() {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY) || null;
  }

  getCurrentUser() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const data = localStorage.getItem(this.CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Creates a new devotee account via Backend API with local fallback
   */
  async signUp(name, email, password, state = '') {
    const trimmedName = (name || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error("Please enter your full devotee name (at least 2 letters).");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error("Please provide a valid email address.");
    }
    if (!cleanPass || cleanPass.length < 4) {
      throw new Error("Password must be at least 4 characters long.");
    }

    // Try backend API first
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: cleanEmail, password: cleanPass, state })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account.');
      }

      if (typeof localStorage !== 'undefined') {
        if (data.token) localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          state: data.user.state,
          loggedInAt: new Date().toISOString()
        }));
      }

      return data.user;
    } catch (apiErr) {
      // If server error or offline, fallback to local storage
      console.warn('[TempleVerse Auth] Backend registration note:', apiErr.message);
      return this._localSignUp(trimmedName, cleanEmail, cleanPass, state);
    }
  }

  _localSignUp(name, email, password, state) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      throw new Error("An account with this email already exists. Please Sign In.");
    }

    const newUser = {
      name,
      email,
      password,
      state: state.trim() || 'All India',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        state: newUser.state,
        loggedInAt: new Date().toISOString()
      }));
    }

    return newUser;
  }

  /**
   * Signs into existing account via Backend API with local fallback
   */
  async signIn(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail) throw new Error("Please enter your registered email address.");
    if (!cleanPass) throw new Error("Please enter your password.");

    // Try backend API first
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      if (typeof localStorage !== 'undefined') {
        if (data.token) localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          state: data.user.state,
          loggedInAt: new Date().toISOString()
        }));
      }

      return data.user;
    } catch (apiErr) {
      console.warn('[TempleVerse Auth] Backend sign in note:', apiErr.message);
      return this._localSignIn(cleanEmail, cleanPass);
    }
  }

  _localSignIn(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

    if (!user) {
      const emailExists = users.some(u => u.email.toLowerCase() === email);
      if (emailExists) {
        throw new Error("Incorrect password. Please verify and try again.");
      } else {
        throw new Error("No account found with this email. Please click 'Create Account' to register.");
      }
    }

    const sessionData = {
      name: user.name,
      email: user.email,
      state: user.state || 'All India',
      loggedInAt: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sessionData));
    }

    return sessionData;
  }

  /**
   * Quick guest login for immediate darshan exploration
   */
  guestLogin() {
    const guestUser = {
      name: "Devotee Guest",
      email: "guest@templeverse.org",
      state: "Sacred Bharat",
      loggedInAt: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(guestUser));
    }

    return guestUser;
  }

  /**
   * Terminates active session
   */
  signOut() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.CURRENT_USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }
}

// Global Authentication Instance
if (typeof window !== 'undefined') {
  window.templeVerseAuth = new TempleVerseAuthService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TempleVerseAuthService;
}
