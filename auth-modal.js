/**
 * Food Hill – auth-modal.js
 * ─────────────────────────────────────────────────────────────
 * Drives the auth modal that lives inside index.html.
 * Handles: open/close modal, Login, Signup, Logout,
 *          navbar state update, localStorage, password strength,
 *          card 3-D tilt, and field validation.
 */

'use strict';

/* ─── LocalStorage keys (shared with auth.js if used standalone) ─── */
const USERS_KEY   = 'fh_users';
const SESSION_KEY = 'fh_session';

/* ─── Helpers ─────────────────────────────────────────────────── */
const getUsers  = ()    => JSON.parse(localStorage.getItem(USERS_KEY)   || '[]');
const saveUsers = u     => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession= ()    => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
const setSession= user  => localStorage.setItem(SESSION_KEY, JSON.stringify(user));
const clearSess = ()    => localStorage.removeItem(SESSION_KEY);

const isValidEmail    = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPassword = v => v.length >= 8;
const delay           = ms => new Promise(r => setTimeout(r, ms));

/* ─── DOM refs ────────────────────────────────────────────────── */
// Navbar
const navGuest   = document.getElementById('navGuest');
const navUser    = document.getElementById('navUser');
const navUsername= document.getElementById('navUsername');
const navAvatar  = document.getElementById('navAvatar');
const navLoginBtn= document.getElementById('navLoginBtn');
const navSignupBtn=document.getElementById('navSignupBtn');
const navLogoutBtn=document.getElementById('navLogoutBtn');

// Hero auth row
const heroAuthBtns  = document.getElementById('heroAuthRow') && document.querySelector('.hero-auth-btns');
const heroLoggedIn  = document.getElementById('heroLoggedIn');
const heroWelcomeMsg= document.getElementById('heroWelcomeMsg');
const heroLoginBtn  = document.getElementById('heroLoginBtn');
const heroSignupBtn = document.getElementById('heroSignupBtn');

// Join section
const joinGuest      = document.getElementById('joinGuest');
const joinMember     = document.getElementById('joinMember');
const joinMemberName = document.getElementById('joinMemberName');
const joinLoginBtn   = document.getElementById('joinLoginBtn');
const joinSignupBtn  = document.getElementById('joinSignupBtn');


// Modal
const backdrop   = document.getElementById('authModalBackdrop');
const authCard   = document.getElementById('authCard');
const closeBtn   = document.getElementById('modalCloseBtn');

// Login panel
const loginPanel   = document.getElementById('modal-loginPanel');
const loginForm    = document.getElementById('modal-loginForm');
const mlgEmail     = document.getElementById('mlg-email');
const mlgPass      = document.getElementById('mlg-pass');
const mlgEmailErr  = document.getElementById('mlg-emailError');
const mlgPassErr   = document.getElementById('mlg-passError');
const mlgEyeBtn    = document.getElementById('mlg-eyeBtn');
const modalLoginBtn= document.getElementById('modalLoginBtn');
const loginToast   = document.getElementById('modalLoginToast');
const toSignupBtn  = document.getElementById('modal-toSignup');

// Signup panel
const signupPanel  = document.getElementById('modal-signupPanel');
const signupForm   = document.getElementById('modal-signupForm');
const msgName      = document.getElementById('msg-name');
const msgEmail     = document.getElementById('msg-email');
const msgPass      = document.getElementById('msg-pass');
const msgConfirm   = document.getElementById('msg-confirm');
const msgNameErr   = document.getElementById('msg-nameError');
const msgEmailErr  = document.getElementById('msg-emailError');
const msgPassErr   = document.getElementById('msg-passError');
const msgConfirmErr= document.getElementById('msg-confirmError');
const msgEyeBtn    = document.getElementById('msg-eyeBtn');
const msgEyeBtn2   = document.getElementById('msg-eyeBtn2');
const modalSignupBtn=document.getElementById('modalSignupBtn');
const signupToast  = document.getElementById('modalSignupToast');
const toLoginBtn   = document.getElementById('modal-toLogin');
const mStrBar      = document.getElementById('msg-strengthBar');
const mStrFill     = document.getElementById('msg-strengthFill');
const mStrLbl      = document.getElementById('msg-strengthLabel');


/* ═══════════════════════════════════════════════════════════════
   1. MODAL OPEN / CLOSE
   ═══════════════════════════════════════════════════════════════ */
function openModal(panel) {
  backdrop.style.display = '';          // remove inline display:none
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden'; // prevent background scroll
  showPanel(panel === 'signup' ? signupPanel : loginPanel);
}

function closeModal() {
  backdrop.classList.remove('open');
  backdrop.style.display = 'none';
  document.body.style.overflow = '';
  clearAllErrors();
  loginForm.reset();
  signupForm.reset();
  mStrBar.classList.remove('visible');
}

// Navbar triggers
navLoginBtn.addEventListener('click', () => openModal('login'));
navSignupBtn.addEventListener('click', () => openModal('signup'));

// Hero auth row triggers
if (heroLoginBtn)  heroLoginBtn.addEventListener('click',  () => openModal('login'));
if (heroSignupBtn) heroSignupBtn.addEventListener('click', () => openModal('signup'));

// Join section triggers
if (joinLoginBtn)  joinLoginBtn.addEventListener('click',  () => openModal('login'));
if (joinSignupBtn) joinSignupBtn.addEventListener('click', () => openModal('signup'));

// Close on X button
closeBtn.addEventListener('click', closeModal);

// Close on backdrop click (outside the card)
backdrop.addEventListener('click', e => {
  if (e.target === backdrop) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Switch panels within modal
toSignupBtn.addEventListener('click', () => {
  clearAllErrors();
  loginForm.reset();
  showPanel(signupPanel);
});
toLoginBtn.addEventListener('click', () => {
  clearAllErrors();
  signupForm.reset();
  showPanel(loginPanel);
});


/* ═══════════════════════════════════════════════════════════════
   2. PANEL SWITCHER
   ═══════════════════════════════════════════════════════════════ */
function showPanel(target) {
  [loginPanel, signupPanel].forEach(p => {
    p.classList.toggle('panel--hidden', p !== target);
  });
  // Restart CSS animation
  target.style.animation = 'none';
  void target.offsetWidth;
  target.style.animation = '';
}


/* ═══════════════════════════════════════════════════════════════
   3. NAVBAR STATE
   ═══════════════════════════════════════════════════════════════ */
function updateNavbar() {
  const session = getSession();
  if (session) {
    // ── Navbar
    navGuest.style.display = 'none';
    navUser.style.display  = 'flex';
    const firstName = session.name.split(' ')[0];
    navUsername.textContent = firstName;
    navAvatar.title = session.name;

    // ── Hero auth row
    if (heroAuthBtns)  heroAuthBtns.style.display  = 'none';
    if (heroLoggedIn)  heroLoggedIn.style.display   = 'flex';
    if (heroWelcomeMsg) heroWelcomeMsg.textContent  = `👋 Hey, ${firstName}!`;

    // ── Join section
    if (joinGuest)      joinGuest.style.display      = 'none';
    if (joinMember)     joinMember.style.display      = 'flex';
    if (joinMemberName) joinMemberName.textContent   = firstName;

  } else {
    // ── Navbar
    navGuest.style.display = 'flex';
    navUser.style.display  = 'none';

    // ── Hero auth row
    if (heroAuthBtns)  heroAuthBtns.style.display  = 'flex';
    if (heroLoggedIn)  heroLoggedIn.style.display   = 'none';

    // ── Join section
    if (joinGuest)  joinGuest.style.display  = 'block';
    if (joinMember) joinMember.style.display = 'none';
  }
}


/* ═══════════════════════════════════════════════════════════════
   4. LOGIN LOGIC
   ═══════════════════════════════════════════════════════════════ */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;

  const emailVal = mlgEmail.value.trim();
  if (!emailVal) {
    setError(mlgEmail.closest('.field-group'), mlgEmailErr, '⚠ Email is required.');
    valid = false;
  } else if (!isValidEmail(emailVal)) {
    setError(mlgEmail.closest('.field-group'), mlgEmailErr, '⚠ Enter a valid email address.');
    valid = false;
  } else {
    setSuccess(mlgEmail.closest('.field-group'), mlgEmailErr);
  }

  const passVal = mlgPass.value;
  if (!passVal) {
    setError(mlgPass.closest('.field-group'), mlgPassErr, '⚠ Password is required.');
    valid = false;
  } else {
    setSuccess(mlgPass.closest('.field-group'), mlgPassErr);
  }

  if (!valid) return;

  setLoading(modalLoginBtn, true);
  await delay(1200);
  setLoading(modalLoginBtn, false);

  const users   = getUsers();
  const matched = users.find(
    u => u.email.toLowerCase() === emailVal.toLowerCase() && u.password === passVal
  );

  if (!matched) {
    setError(mlgPass.closest('.field-group'), mlgPassErr, '⚠ Incorrect email or password.');
    showToast(loginToast, '❌ Login failed. Check your credentials.', 'error');
    // Shake the card
    authCard.classList.add('shake');
    setTimeout(() => authCard.classList.remove('shake'), 600);
    return;
  }

  // ✅ Success
  setSession({ name: matched.name, email: matched.email });
  showToast(loginToast, `✅ Welcome back, ${matched.name}!`, 'success', 1400);
  setTimeout(() => {
    updateNavbar();
    closeModal();
  }, 1600);
});


/* ═══════════════════════════════════════════════════════════════
   5. SIGNUP LOGIC
   ═══════════════════════════════════════════════════════════════ */
signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  let valid = true;

  // Full Name
  const nameVal = msgName.value.trim();
  if (!nameVal || nameVal.length < 2) {
    setError(msgName.closest('.field-group'), msgNameErr,
      nameVal ? '⚠ Name must be at least 2 characters.' : '⚠ Full name is required.');
    valid = false;
  } else {
    setSuccess(msgName.closest('.field-group'), msgNameErr);
  }

  // Email
  const emailVal = msgEmail.value.trim();
  if (!emailVal) {
    setError(msgEmail.closest('.field-group'), msgEmailErr, '⚠ Email is required.');
    valid = false;
  } else if (!isValidEmail(emailVal)) {
    setError(msgEmail.closest('.field-group'), msgEmailErr, '⚠ Enter a valid email address.');
    valid = false;
  } else if (getUsers().find(u => u.email.toLowerCase() === emailVal.toLowerCase())) {
    setError(msgEmail.closest('.field-group'), msgEmailErr, '⚠ Email already registered.');
    valid = false;
  } else {
    setSuccess(msgEmail.closest('.field-group'), msgEmailErr);
  }

  // Password
  const passVal = msgPass.value;
  if (!passVal) {
    setError(msgPass.closest('.field-group'), msgPassErr, '⚠ Password is required.');
    valid = false;
  } else if (!isValidPassword(passVal)) {
    setError(msgPass.closest('.field-group'), msgPassErr, '⚠ Minimum 8 characters required.');
    valid = false;
  } else {
    setSuccess(msgPass.closest('.field-group'), msgPassErr);
  }

  // Confirm Password
  const confirmVal = msgConfirm.value;
  if (!confirmVal) {
    setError(msgConfirm.closest('.field-group'), msgConfirmErr, '⚠ Please confirm your password.');
    valid = false;
  } else if (passVal !== confirmVal) {
    setError(msgConfirm.closest('.field-group'), msgConfirmErr, '⚠ Passwords do not match.');
    valid = false;
  } else {
    setSuccess(msgConfirm.closest('.field-group'), msgConfirmErr);
  }

  if (!valid) return;

  setLoading(modalSignupBtn, true);
  await delay(1400);
  setLoading(modalSignupBtn, false);

  const users = getUsers();
  users.push({ name: nameVal, email: emailVal, password: passVal, joinedAt: new Date().toISOString() });
  saveUsers(users);
  setSession({ name: nameVal, email: emailVal });

  showToast(signupToast, `🎉 Welcome, ${nameVal}! Account created.`, 'success', 1600);
  setTimeout(() => {
    updateNavbar();
    closeModal();
  }, 1800);
});


/* ═══════════════════════════════════════════════════════════════
   6. LOGOUT
   ═══════════════════════════════════════════════════════════════ */
navLogoutBtn.addEventListener('click', async () => {
  navLogoutBtn.textContent = '…';
  navLogoutBtn.disabled = true;
  await delay(700);
  clearSess();
  updateNavbar();
  navLogoutBtn.textContent = 'Logout';
  navLogoutBtn.disabled = false;
});


/* ═══════════════════════════════════════════════════════════════
   7. PASSWORD EYE TOGGLE
   ═══════════════════════════════════════════════════════════════ */
function setupEye(btn, input) {
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.querySelector('svg').innerHTML = show
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>`;
  });
}
setupEye(mlgEyeBtn,  mlgPass);
setupEye(msgEyeBtn,  msgPass);
setupEye(msgEyeBtn2, msgConfirm);


/* ═══════════════════════════════════════════════════════════════
   8. PASSWORD STRENGTH METER
   ═══════════════════════════════════════════════════════════════ */
msgPass.addEventListener('input', () => {
  const v = msgPass.value;
  if (!v) { mStrBar.classList.remove('visible'); mStrFill.style.width = '0'; mStrLbl.textContent = ''; return; }
  mStrBar.classList.add('visible');
  let score = 0;
  if (v.length >= 8)  score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const lvls = [
    { pct:'20%', bg:'hsl(350,80%,52%)', lbl:'Very Weak',  clr:'hsl(350,85%,65%)' },
    { pct:'40%', bg:'hsl(20,90%,52%)',  lbl:'Weak',       clr:'hsl(20,90%,65%)'  },
    { pct:'60%', bg:'hsl(42,90%,52%)',  lbl:'Fair',       clr:'hsl(42,90%,68%)'  },
    { pct:'80%', bg:'hsl(145,65%,42%)', lbl:'Strong',     clr:'hsl(145,65%,60%)' },
    { pct:'100%',bg:'hsl(160,70%,40%)', lbl:'Very Strong',clr:'hsl(160,70%,60%)' },
  ];
  const l = lvls[Math.min(score, 4)];
  mStrFill.style.width      = l.pct;
  mStrFill.style.background = l.bg;
  mStrLbl.textContent       = l.lbl;
  mStrLbl.style.color       = l.clr;
});


/* ═══════════════════════════════════════════════════════════════
   9. 3-D CARD TILT (while modal is open)
   ═══════════════════════════════════════════════════════════════ */
const TILT = 10;
backdrop.addEventListener('mousemove', e => {
  if (!backdrop.classList.contains('open')) return;
  const r  = authCard.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;
  const rx = -((e.clientY - cy) / (window.innerHeight / 2)) * TILT;
  const ry =  ((e.clientX - cx) / (window.innerWidth  / 2)) * TILT;
  authCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.012)`;
});
backdrop.addEventListener('mouseleave', () => {
  authCard.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
});


/* ═══════════════════════════════════════════════════════════════
   10. VALIDATION UTILITIES
   ═══════════════════════════════════════════════════════════════ */
function setError(group, errEl, msg) {
  group.classList.add('has-error');
  group.classList.remove('has-success');
  errEl.textContent = msg;
}
function setSuccess(group, errEl) {
  group.classList.remove('has-error');
  group.classList.add('has-success');
  errEl.textContent = '';
}
function clearField(group, errEl) {
  group.classList.remove('has-error','has-success');
  errEl.textContent = '';
}
function clearAllErrors() {
  document.querySelectorAll('.field-group').forEach(g => g.classList.remove('has-error','has-success'));
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
}


/* ═══════════════════════════════════════════════════════════════
   11. TOAST
   ═══════════════════════════════════════════════════════════════ */
function showToast(el, msg, type, dur = 3500) {
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => { el.className = 'toast'; }, dur);
}


/* ═══════════════════════════════════════════════════════════════
   12. BUTTON LOADING STATE
   ═══════════════════════════════════════════════════════════════ */
function setLoading(btn, on) {
  btn.classList.toggle('loading', on);
  btn.setAttribute('aria-busy', String(on));
}


/* ═══════════════════════════════════════════════════════════════
   13. SHAKE ANIMATION (CSS injection)
   ═══════════════════════════════════════════════════════════════ */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes cardShake {
    0%,100% { transform: perspective(900px) translateX(0); }
    20%     { transform: perspective(900px) translateX(-8px); }
    40%     { transform: perspective(900px) translateX( 8px); }
    60%     { transform: perspective(900px) translateX(-5px); }
    80%     { transform: perspective(900px) translateX( 5px); }
  }
  .shake { animation: cardShake 0.55s ease both !important; }
`;
document.head.appendChild(shakeStyle);


/* ═══════════════════════════════════════════════════════════════
   14. REAL-TIME BLUR VALIDATION (Signup)
   ═══════════════════════════════════════════════════════════════ */
msgName.addEventListener('blur', () => {
  const v = msgName.value.trim();
  if (v && v.length < 2) setError(msgName.closest('.field-group'), msgNameErr, '⚠ Name too short.');
  else if (v.length >= 2) setSuccess(msgName.closest('.field-group'), msgNameErr);
});
msgEmail.addEventListener('blur', () => {
  const v = msgEmail.value.trim();
  if (v && !isValidEmail(v)) setError(msgEmail.closest('.field-group'), msgEmailErr, '⚠ Invalid email format.');
  else if (isValidEmail(v)) setSuccess(msgEmail.closest('.field-group'), msgEmailErr);
});
msgPass.addEventListener('blur', () => {
  const v = msgPass.value;
  if (v && v.length < 8) setError(msgPass.closest('.field-group'), msgPassErr, '⚠ Minimum 8 characters required.');
  else if (v.length >= 8) setSuccess(msgPass.closest('.field-group'), msgPassErr);
});
msgConfirm.addEventListener('blur', () => {
  const v = msgConfirm.value;
  if (v && v !== msgPass.value) setError(msgConfirm.closest('.field-group'), msgConfirmErr, '⚠ Passwords do not match.');
  else if (v && v === msgPass.value) setSuccess(msgConfirm.closest('.field-group'), msgConfirmErr);
});

// Login clear on input
mlgEmail.addEventListener('input', () => clearField(mlgEmail.closest('.field-group'), mlgEmailErr));
mlgPass.addEventListener('input',  () => clearField(mlgPass.closest('.field-group'),  mlgPassErr));


/* ═══════════════════════════════════════════════════════════════
   15. INIT — restore navbar state on page load
   ═══════════════════════════════════════════════════════════════ */
updateNavbar();
