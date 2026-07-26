/**
 * Food Hill – Authentication Script  (auth.js)
 * ------------------------------------------------
 * Pure frontend demo authentication using localStorage.
 * No real backend / database involved.
 *
 * Features:
 *  - Signup   : stores user in localStorage
 *  - Login    : validates against stored users
 *  - Logout   : clears session from localStorage
 *  - 3-D tilt : real-time card tilt on mouse move
 *  - Strength : password strength indicator
 *  - Smooth   : panel fade transitions
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. DOM REFERENCES
   ───────────────────────────────────────────────────────────── */
const card         = document.getElementById('cardContainer');
const loginPanel   = document.getElementById('loginPanel');
const signupPanel  = document.getElementById('signupPanel');
const dashPanel    = document.getElementById('dashPanel');

// Login form fields
const loginForm    = document.getElementById('loginForm');
const lgEmail      = document.getElementById('lg-email');
const lgPass       = document.getElementById('lg-pass');
const lgEmailErr   = document.getElementById('lg-emailError');
const lgPassErr    = document.getElementById('lg-passError');
const lgEyeBtn     = document.getElementById('lg-eyeBtn');
const loginBtn     = document.getElementById('loginBtn');
const loginToast   = document.getElementById('loginToast');

// Signup form fields
const signupForm   = document.getElementById('signupForm');
const sgName       = document.getElementById('sg-name');
const sgEmail      = document.getElementById('sg-email');
const sgPass       = document.getElementById('sg-pass');
const sgConfirm    = document.getElementById('sg-confirm');
const sgNameErr    = document.getElementById('sg-nameError');
const sgEmailErr   = document.getElementById('sg-emailError');
const sgPassErr    = document.getElementById('sg-passError');
const sgConfirmErr = document.getElementById('sg-confirmError');
const sgEyeBtn     = document.getElementById('sg-eyeBtn');
const sgEyeBtn2    = document.getElementById('sg-eyeBtn2');
const signupBtn    = document.getElementById('signupBtn');
const signupToast  = document.getElementById('signupToast');
const strengthBar  = document.getElementById('sg-strengthBar');
const strengthFill = document.getElementById('sg-strengthFill');
const strengthLbl  = document.getElementById('sg-strengthLabel');

// Switch buttons
const toSignupBtn  = document.getElementById('toSignup');
const toLoginBtn   = document.getElementById('toLogin');

// Dashboard
const logoutBtn    = document.getElementById('logoutBtn');
const dashGreeting = document.getElementById('dashGreeting');
const dashEmail    = document.getElementById('dashEmail');
const dashToast    = document.getElementById('dashToast');


/* ─────────────────────────────────────────────────────────────
   2. PANEL SWITCHING
   ───────────────────────────────────────────────────────────── */

/**
 * Shows a panel and hides the rest.
 * @param {HTMLElement} target - The panel to show.
 */
function showPanel(target) {
  [loginPanel, signupPanel, dashPanel].forEach(p => {
    if (p === target) {
      p.classList.remove('panel--hidden');
    } else {
      p.classList.add('panel--hidden');
    }
  });
  // Restart the animation by resetting the class
  target.style.animation = 'none';
  void target.offsetWidth; // reflow trick
  target.style.animation = '';
}

// Switch to Signup
toSignupBtn.addEventListener('click', () => {
  clearForm(loginForm);
  clearAllErrors();
  showPanel(signupPanel);
});

// Switch to Login
toLoginBtn.addEventListener('click', () => {
  clearForm(signupForm);
  clearAllErrors();
  showPanel(loginPanel);
});


/* ─────────────────────────────────────────────────────────────
   3. VALIDATION HELPERS
   ───────────────────────────────────────────────────────────── */

/** Checks if an email address format is valid. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Checks if password meets minimum requirements. */
function isValidPassword(password) {
  return password.length >= 8;
}

/**
 * Sets an error on a field group.
 * @param {HTMLElement} group   - The .field-group element.
 * @param {HTMLElement} errEl   - The .field-error span.
 * @param {string}      message - Error text.
 */
function setError(group, errEl, message) {
  group.classList.add('has-error');
  group.classList.remove('has-success');
  errEl.textContent = message;
}

/**
 * Sets a success state on a field group.
 * @param {HTMLElement} group - The .field-group element.
 * @param {HTMLElement} errEl - The .field-error span.
 */
function setSuccess(group, errEl) {
  group.classList.remove('has-error');
  group.classList.add('has-success');
  errEl.textContent = '';
}

/** Removes error/success states from a field group. */
function clearField(group, errEl) {
  group.classList.remove('has-error', 'has-success');
  errEl.textContent = '';
}

/** Clears all validation states on both forms. */
function clearAllErrors() {
  const groups = document.querySelectorAll('.field-group');
  groups.forEach(g => g.classList.remove('has-error', 'has-success'));
  const errors = document.querySelectorAll('.field-error');
  errors.forEach(e => e.textContent = '');
}

/** Resets form inputs to blank. */
function clearForm(form) {
  form.reset();
  // Reset strength bar
  strengthBar.classList.remove('visible');
  strengthFill.style.width = '0';
  strengthLbl.textContent = '';
}


/* ─────────────────────────────────────────────────────────────
   4. TOAST NOTIFICATIONS
   ───────────────────────────────────────────────────────────── */

/**
 * Shows a toast message and hides it after a delay.
 * @param {HTMLElement} toastEl  - The toast container.
 * @param {string}      message  - Message text.
 * @param {'success'|'error'} type
 * @param {number}      [duration=3500] - Milliseconds before hiding.
 */
function showToast(toastEl, message, type, duration = 3500) {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => {
    toastEl.className = 'toast';
  }, duration);
}


/* ─────────────────────────────────────────────────────────────
   5. PASSWORD TOGGLE (show/hide)
   ───────────────────────────────────────────────────────────── */

/**
 * Toggles between password and text input type.
 * @param {HTMLButtonElement} btn   - The eye toggle button.
 * @param {HTMLInputElement}  input - The password input field.
 */
function setupPasswordToggle(btn, input) {
  btn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    // Swap icon between "open eye" and "closed eye"
    btn.querySelector('svg').innerHTML = isPassword
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>`;
  });
}

setupPasswordToggle(lgEyeBtn,  lgPass);
setupPasswordToggle(sgEyeBtn,  sgPass);
setupPasswordToggle(sgEyeBtn2, sgConfirm);


/* ─────────────────────────────────────────────────────────────
   6. PASSWORD STRENGTH METER
   ───────────────────────────────────────────────────────────── */

sgPass.addEventListener('input', () => {
  const val = sgPass.value;
  if (!val) {
    strengthBar.classList.remove('visible');
    strengthFill.style.width = '0';
    strengthLbl.textContent = '';
    return;
  }

  strengthBar.classList.add('visible');
  let score = 0;
  if (val.length >= 8)  score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: '20%', color: 'hsl(350,80%,52%)', label: 'Very Weak',  clr: 'hsl(350,85%,65%)' },
    { pct: '40%', color: 'hsl(20,90%,52%)',  label: 'Weak',       clr: 'hsl(20,90%,65%)'  },
    { pct: '60%', color: 'hsl(42,90%,52%)',  label: 'Fair',       clr: 'hsl(42,90%,68%)'  },
    { pct: '80%', color: 'hsl(145,65%,42%)', label: 'Strong',     clr: 'hsl(145,65%,60%)' },
    { pct: '100%',color: 'hsl(160,70%,40%)', label: 'Very Strong',clr: 'hsl(160,70%,60%)' },
  ];

  const lvl = levels[Math.min(score, 4)];
  strengthFill.style.width      = lvl.pct;
  strengthFill.style.background = lvl.color;
  strengthLbl.textContent       = lvl.label;
  strengthLbl.style.color       = lvl.clr;
});


/* ─────────────────────────────────────────────────────────────
   7. LOCAL STORAGE HELPERS
   ───────────────────────────────────────────────────────────── */
const USERS_KEY   = 'fh_users';    // array of registered users
const SESSION_KEY = 'fh_session';  // currently logged in user

/** Gets all registered users from localStorage. */
function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

/** Saves an updated users array to localStorage. */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Gets the current session object (null if not logged in). */
function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

/** Sets the current session. */
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/** Clears the current session. */
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}


/* ─────────────────────────────────────────────────────────────
   8. SIGNUP LOGIC
   ───────────────────────────────────────────────────────────── */
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  // ── Full Name
  const nameVal = sgName.value.trim();
  if (!nameVal) {
    setError(sgName.closest('.field-group'), sgNameErr, '⚠ Please enter your full name.');
    valid = false;
  } else if (nameVal.length < 2) {
    setError(sgName.closest('.field-group'), sgNameErr, '⚠ Name must be at least 2 characters.');
    valid = false;
  } else {
    setSuccess(sgName.closest('.field-group'), sgNameErr);
  }

  // ── Email
  const emailVal = sgEmail.value.trim();
  if (!emailVal) {
    setError(sgEmail.closest('.field-group'), sgEmailErr, '⚠ Email is required.');
    valid = false;
  } else if (!isValidEmail(emailVal)) {
    setError(sgEmail.closest('.field-group'), sgEmailErr, '⚠ Please enter a valid email address.');
    valid = false;
  } else {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === emailVal.toLowerCase())) {
      setError(sgEmail.closest('.field-group'), sgEmailErr, '⚠ This email is already registered.');
      valid = false;
    } else {
      setSuccess(sgEmail.closest('.field-group'), sgEmailErr);
    }
  }

  // ── Password
  const passVal = sgPass.value;
  if (!passVal) {
    setError(sgPass.closest('.field-group'), sgPassErr, '⚠ Password is required.');
    valid = false;
  } else if (!isValidPassword(passVal)) {
    setError(sgPass.closest('.field-group'), sgPassErr, '⚠ Password must be at least 8 characters.');
    valid = false;
  } else {
    setSuccess(sgPass.closest('.field-group'), sgPassErr);
  }

  // ── Confirm Password
  const confirmVal = sgConfirm.value;
  if (!confirmVal) {
    setError(sgConfirm.closest('.field-group'), sgConfirmErr, '⚠ Please confirm your password.');
    valid = false;
  } else if (passVal !== confirmVal) {
    setError(sgConfirm.closest('.field-group'), sgConfirmErr, '⚠ Passwords do not match.');
    valid = false;
  } else {
    setSuccess(sgConfirm.closest('.field-group'), sgConfirmErr);
  }

  if (!valid) return;

  // ── Simulate async (loading state)
  setLoading(signupBtn, true);
  await delay(1400);
  setLoading(signupBtn, false);

  // ── Save user
  const users = getUsers();
  const newUser = { name: nameVal, email: emailVal, password: passVal, joinedAt: new Date().toISOString() };
  users.push(newUser);
  saveUsers(users);

  // ── Auto-login
  setSession({ name: nameVal, email: emailVal });
  showToast(signupToast, `🎉 Account created! Welcome, ${nameVal}!`, 'success', 1600);

  setTimeout(() => {
    loadDashboard();
    showPanel(dashPanel);
  }, 1800);
});


/* ─────────────────────────────────────────────────────────────
   9. LOGIN LOGIC
   ───────────────────────────────────────────────────────────── */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  // ── Email
  const emailVal = lgEmail.value.trim();
  if (!emailVal) {
    setError(lgEmail.closest('.field-group'), lgEmailErr, '⚠ Email is required.');
    valid = false;
  } else if (!isValidEmail(emailVal)) {
    setError(lgEmail.closest('.field-group'), lgEmailErr, '⚠ Please enter a valid email address.');
    valid = false;
  } else {
    setSuccess(lgEmail.closest('.field-group'), lgEmailErr);
  }

  // ── Password
  const passVal = lgPass.value;
  if (!passVal) {
    setError(lgPass.closest('.field-group'), lgPassErr, '⚠ Password is required.');
    valid = false;
  } else {
    setSuccess(lgPass.closest('.field-group'), lgPassErr);
  }

  if (!valid) return;

  setLoading(loginBtn, true);
  await delay(1200);
  setLoading(loginBtn, false);

  // ── Check credentials
  const users  = getUsers();
  const matched = users.find(
    u => u.email.toLowerCase() === emailVal.toLowerCase() && u.password === passVal
  );

  if (!matched) {
    setError(lgEmail.closest('.field-group'), lgEmailErr, '');
    setError(lgPass.closest('.field-group'),  lgPassErr,  '⚠ Incorrect email or password.');
    showToast(loginToast, '❌ Login failed. Please check your credentials.', 'error');
    // Shake the card
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 600);
    return;
  }

  // ── Success
  setSession({ name: matched.name, email: matched.email });
  showToast(loginToast, `✅ Welcome back, ${matched.name}!`, 'success', 1400);

  setTimeout(() => {
    loadDashboard();
    showPanel(dashPanel);
  }, 1600);
});


/* ─────────────────────────────────────────────────────────────
   10. LOGOUT LOGIC
   ───────────────────────────────────────────────────────────── */
logoutBtn.addEventListener('click', async () => {
  setLoading(logoutBtn, true);
  await delay(900);
  setLoading(logoutBtn, false);

  clearSession();
  showToast(dashToast, "👋 You've been logged out.", 'success', 1400);

  setTimeout(() => {
    clearAllErrors();
    clearForm(loginForm);
    showPanel(loginPanel);
  }, 1600);
});


/* ─────────────────────────────────────────────────────────────
   11. DASHBOARD POPULATION
   ───────────────────────────────────────────────────────────── */
function loadDashboard() {
  const session = getSession();
  if (!session) return;
  dashGreeting.textContent = `Hello, ${session.name} 👋`;
  dashEmail.textContent    = session.email;
}


/* ─────────────────────────────────────────────────────────────
   12. AUTO-LOGIN ON PAGE LOAD
   ───────────────────────────────────────────────────────────── */
(function init() {
  const session = getSession();
  if (session) {
    loadDashboard();
    showPanel(dashPanel);
  } else {
    showPanel(loginPanel);
  }
})();


/* ─────────────────────────────────────────────────────────────
   13. 3-D CARD TILT ON MOUSE MOVE
   ───────────────────────────────────────────────────────────── */
const TILT_MAX = 12; // degrees

document.addEventListener('mousemove', (e) => {
  const rect   = card.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const dx     = (e.clientX - cx) / (window.innerWidth  / 2);
  const dy     = (e.clientY - cy) / (window.innerHeight / 2);
  const rotateX = -dy * TILT_MAX;
  const rotateY =  dx * TILT_MAX;

  card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
});

// Reset tilt when mouse leaves
document.addEventListener('mouseleave', () => {
  card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
});

// On touch devices, disable tilt for usability
if ('ontouchstart' in window) {
  card.style.transform = '';
  document.removeEventListener('mousemove', () => {});
}


/* ─────────────────────────────────────────────────────────────
   14. SHAKE ANIMATION (CSS injection)
   ───────────────────────────────────────────────────────────── */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: perspective(900px) translateX(0); }
    20%     { transform: perspective(900px) translateX(-8px); }
    40%     { transform: perspective(900px) translateX( 8px); }
    60%     { transform: perspective(900px) translateX(-5px); }
    80%     { transform: perspective(900px) translateX( 5px); }
  }
  .shake { animation: shake 0.55s ease both !important; }
`;
document.head.appendChild(shakeStyle);


/* ─────────────────────────────────────────────────────────────
   15. UTILITY FUNCTIONS
   ───────────────────────────────────────────────────────────── */

/**
 * Adds/removes loading state on a button.
 * @param {HTMLButtonElement} btn
 * @param {boolean} state
 */
function setLoading(btn, state) {
  if (state) {
    btn.classList.add('loading');
    btn.setAttribute('aria-busy', 'true');
  } else {
    btn.classList.remove('loading');
    btn.removeAttribute('aria-busy');
  }
}

/**
 * Returns a promise that resolves after `ms` milliseconds.
 * Used to simulate async network calls.
 * @param {number} ms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ─────────────────────────────────────────────────────────────
   16. REAL-TIME FIELD VALIDATION
   ───────────────────────────────────────────────────────────── */

// Login – clear errors on input
lgEmail.addEventListener('input', () => clearField(lgEmail.closest('.field-group'), lgEmailErr));
lgPass.addEventListener('input',  () => clearField(lgPass.closest('.field-group'),  lgPassErr));

// Signup – live validation feedback
sgName.addEventListener('blur', () => {
  const v = sgName.value.trim();
  if (v.length < 2 && v.length > 0) setError(sgName.closest('.field-group'), sgNameErr, '⚠ Name too short.');
  else if (v.length >= 2) setSuccess(sgName.closest('.field-group'), sgNameErr);
});
sgEmail.addEventListener('blur', () => {
  const v = sgEmail.value.trim();
  if (v && !isValidEmail(v)) setError(sgEmail.closest('.field-group'), sgEmailErr, '⚠ Invalid email format.');
  else if (isValidEmail(v)) setSuccess(sgEmail.closest('.field-group'), sgEmailErr);
});
sgPass.addEventListener('blur', () => {
  const v = sgPass.value;
  if (v && v.length < 8) setError(sgPass.closest('.field-group'), sgPassErr, '⚠ Minimum 8 characters required.');
  else if (v.length >= 8) setSuccess(sgPass.closest('.field-group'), sgPassErr);
});
sgConfirm.addEventListener('blur', () => {
  const v = sgConfirm.value;
  if (v && v !== sgPass.value) setError(sgConfirm.closest('.field-group'), sgConfirmErr, '⚠ Passwords do not match.');
  else if (v && v === sgPass.value) setSuccess(sgConfirm.closest('.field-group'), sgConfirmErr);
});
