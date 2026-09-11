/* =========================================================
   CYBERNEST — APPLICATION LOGIC
   Frontend prototype. Backend persistence/validation is mocked.
========================================================= */

(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => document.querySelectorAll(selector);

  const STORAGE = {
    session: 'cybernestUser',
    account: 'cybernestRegisteredUser',
    theme: 'cybernestTheme',
    progress: 'cybernestProgress'
  };

  const defaultProgress = {
    xp: 2140,
    level: 8,
    completed: 31,
    challengeProgress: []
  };

  const savedProgress = JSON.parse(localStorage.getItem(STORAGE.progress) || 'null');

  const S = {
    user: JSON.parse(localStorage.getItem(STORAGE.session) || 'null'),
    page: 'dashboard',
    filter: 'All',
    search: '',
    xp: Number(savedProgress?.xp) || defaultProgress.xp,
    level: Number(savedProgress?.level) || defaultProgress.level,
    completed: Number(savedProgress?.completed) || defaultProgress.completed,
    challengeProgress: Array.isArray(savedProgress?.challengeProgress)
      ? savedProgress.challengeProgress
      : [],
      instructionTask: null,

    labs: [
      { id: 1, c: 'Web', t: 'Cookie Security Basics', d: 'Easy', time: '20 min', xp: 80, p: 'Explore sessions, cookies and common authentication mistakes.' },
      { id: 2, c: 'API', t: 'API Authentication', d: 'Medium', time: '35 min', xp: 120, p: 'Identify weaknesses in token-based authentication.' },
      { id: 3, c: 'Linux', t: 'Linux Privilege Basics', d: 'Medium', time: '40 min', xp: 140, p: 'Learn how permissions affect access on a Linux machine.' },
      { id: 4, c: 'Database', t: 'SQL Injection Lab', d: 'Hard', time: '45 min', xp: 180, p: 'Practice identifying unsafe database queries.' },
      { id: 5, c: 'Web', t: 'Reflected XSS', d: 'Medium', time: '25 min', xp: 150, p: 'Find and understand unsafe browser-side input handling.' },
      { id: 6, c: 'API', t: 'Broken API Access', d: 'Hard', time: '50 min', xp: 200, p: 'Investigate authorization failures in a REST API.' },
      { id: 7, c: 'Network', t: 'Packet Analysis', d: 'Easy', time: '25 min', xp: 90, p: 'Read network traffic and identify suspicious patterns.' },
      { id: 8, c: 'Linux', t: 'Linux File Permissions', d: 'Easy', time: '18 min', xp: 70, p: 'Practice users, groups and filesystem permissions.' }
    ]
  };

  function persistProgress() {
    localStorage.setItem(STORAGE.progress, JSON.stringify({
      xp: S.xp,
      level: S.level,
      completed: S.completed,
      challengeProgress: S.challengeProgress
    }));
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function ini(name) {
    return (name || 'Alex')
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function toast(message) {
    const element = $('#toast');
    if (!element) return;

    element.textContent = message;
    element.classList.add('show');

    clearTimeout(window.cyberNestToast);
    window.cyberNestToast = setTimeout(() => {
      element.classList.remove('show');
    }, 2400);
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function saveSession(user) {
    S.user = user;
    localStorage.setItem(STORAGE.session, JSON.stringify(user));
  }

  function identity() {
    const name = S.user?.name || 'Alex Carter';

    const sname = $('#sname');
    const hname = $('#hname');
    const savatar = $('#savatar');
    const havatar = $('#havatar');
    const sxp = $('#sxp');

    if (sname) sname.textContent = name;
    if (hname) hname.textContent = name.split(' ')[0];
    if (savatar) savatar.textContent = ini(name);
    if (havatar) havatar.textContent = ini(name);
    if (sxp) sxp.textContent = `Level ${S.level} · ${S.xp.toLocaleString()} XP`;
  }

  function stat(label, value, note, icon) {
    return `
      <div class="stat">
        <div class="stat-top">
          <span>${esc(label)}</span>
          <i class="stat-icon">${icon}</i>
        </div>
        <strong>${esc(value)}</strong>
        <small>${esc(note)}</small>
      </div>
    `;
  }

  function skill(name, percent) {
    return `
      <div class="skill">
        <div class="skill-info">
          <span>${esc(name)}</span>
          <span>${percent}%</span>
        </div>
        <div class="bar"><div style="width:${percent}%"></div></div>
      </div>
    `;
  }

  function labIcon(category) {
    return {
      API: '{}',
      Linux: '$_',
      Network: '◈',
      Database: 'DB',
      Web: '</>'
    }[category] || '•';
  }

  function labCard(lab) {
    return `
      <article class="lab" data-searchable="${esc(`${lab.t} ${lab.c} ${lab.d} ${lab.p}`)}">
        <div class="lab-icon">${labIcon(lab.c)}</div>

        <div class="tags">
          <span>${esc(lab.c.toUpperCase())}</span>
          <span class="difficulty">${esc(lab.d)}</span>
        </div>

        <h3>${esc(lab.t)}</h3>
        <p>${esc(lab.p)}</p>

        <div class="lab-foot">
          <span>◷ ${esc(lab.time)}</span>
          <b>+${lab.xp} XP</b>
          <button type="button" data-lab="${lab.id}">Start lab</button>
        </div>
      </article>
    `;
  }

  function pathItem(number, title, status, percent, state = '') {
    return `
      <div class="path ${state}">
        <div class="path-dot">${number}</div>
        <div>
          <strong>${esc(title)}</strong>
          <small>${esc(status)}</small>
        </div>
        <small>${esc(percent)}</small>
      </div>
    `;
  }

  function activity(icon, title, time, xp) {
    return `
      <div class="row">
        <i class="row-icon">${icon}</i>
        <div class="row-main">
          <strong>${esc(title)}</strong>
          <small>${esc(time)}</small>
        </div>
        <b>${esc(xp)}</b>
      </div>
    `;
  }

  function getFilteredLabs() {
    let labs = S.filter === 'All'
      ? [...S.labs]
      : S.labs.filter(lab => lab.c === S.filter);

    const query = S.search.trim().toLowerCase();

    if (query) {
      labs = labs.filter(lab =>
        `${lab.t} ${lab.c} ${lab.d} ${lab.p}`
          .toLowerCase()
          .includes(query)
      );
    }

    return labs;
  }

  function dashboard() {
    const filtered = getFilteredLabs();

    return `
      <div class="head">
        <div>
          <span>YOUR WORKSPACE · AUGUST 12</span>
          <h1>Keep building your security skills.</h1>
          <p>Pick up where you left off or explore something new.</p>
        </div>
        <button type="button" class="btn">🔥 9 day streak</button>
      </div>

      <div class="grid stats">
        ${stat('Labs solved', S.completed, '+5 this month', '✓')}
        ${stat('Practice time', '42.5h', '+6.5h this week', '◷')}
        ${stat('Total XP', S.xp.toLocaleString(), '360 XP to next level', '✦')}
        ${stat('Skill progress', '76%', '↑ 8% this month', '↗')}
      </div>

      <div class="grid two">
        <section class="feature">
          <span class="eyebrow">RECOMMENDED LAB · WEB SECURITY</span>
          <h2>Understanding Reflected XSS</h2>
          <p>Learn how unsanitized user input can become executable browser content and practice finding the vulnerability in a safe environment.</p>

          <div class="meta">
            <span>◷ 25 min</span>
            <span>◇ 5 tasks</span>
            <span>+150 XP</span>
          </div>

          <button type="button" class="btn primary" data-go="challenge">Start Lab <span>→</span></button>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <span>YOUR SKILLS</span>
              <h2>Security Skill Map</h2>
            </div>
          </div>
          <div class="skill-list">
            ${skill('Web Security', 84)}
            ${skill('Authentication', 72)}
            ${skill('API Security', 65)}
            ${skill('Linux', 58)}
            ${skill('Network Security', 41)}
          </div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <span>PRACTICE</span>
            <h2>Explore labs</h2>
          </div>
          <button type="button" class="btn" data-go="labs">Browse all <span>→</span></button>
        </div>

        <div class="filter-row">
          ${['All', 'Web', 'API', 'Linux', 'Network', 'Database'].map(filter => `
            <button
              type="button"
              class="filter ${S.filter === filter ? 'active' : ''}"
              data-filter="${filter}"
            >${filter}</button>
          `).join('')}
        </div>

        <div class="lab-grid">
          ${filtered.length
            ? filtered.slice(0, 4).map(labCard).join('')
            : '<p style="grid-column:1/-1;text-align:center;padding:35px;color:var(--muted);font-size:10px">No labs match your search.</p>'
          }
        </div>
      </section>

      <div class="grid three">
        <section class="card">
          <div class="card-head">
            <div>
              <span>YOUR ROADMAP</span>
              <h2>Learning journey</h2>
            </div>
          </div>

          <div class="paths">
            ${pathItem('✓', 'Security Foundations', 'Completed', '100%', 'done')}
            ${pathItem('2', 'Web Application Security', '12 of 18 labs completed', '67%', 'current')}
            ${pathItem('3', 'API & Cloud Security', 'Locked until previous path', '0%')}
            ${pathItem('4', 'Advanced Exploitation', 'Coming next', '0%')}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <span>ACTIVITY</span>
              <h2>Recent progress</h2>
            </div>
          </div>
          ${activity('✓', 'Completed Authentication Lab', '45 minutes ago', '+120 XP')}
          ${activity('★', 'Earned API Explorer badge', 'Yesterday', '+50 XP')}
          ${activity('↑', 'Reached Level 8', '2 days ago', '+200 XP')}
          ${activity('✓', 'Solved Cookie Security Lab', '3 days ago', '+80 XP')}
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <span>THIS WEEK</span>
              <h2>Practice goal</h2>
            </div>
          </div>

          <div class="skill-list">
            <span class="eyebrow">HOURS</span>
            <h1 style="font-size:25px;margin:5px 0 15px">7.5 / 10</h1>
            <div class="bar"><div style="width:75%"></div></div>
            <p style="font-size:9px;color:var(--muted);line-height:1.7;margin:15px 0 0">
              You are on track. Complete one more short lab to reach today's target.
            </p>
            <button type="button" class="btn primary" data-go="labs" style="margin-top:16px;width:100%">
              Find a lab
            </button>
          </div>
        </section>
      </div>
    `;
  }

  function labs() {
    const filtered = getFilteredLabs();

    return `
      <div class="head">
        <div>
          <span>PRACTICE LIBRARY</span>
          <h1>Explore security labs</h1>
          <p>Build practical skills through realistic, isolated practice environments.</p>
        </div>
        <button type="button" class="btn primary" data-go="challenges">View challenges <span>→</span></button>
      </div>

      <section class="card">
        <div class="filter-row">
          ${['All', 'Web', 'API', 'Linux', 'Network', 'Database'].map(filter => `
            <button
              type="button"
              class="filter ${S.filter === filter ? 'active' : ''}"
              data-filter="${filter}"
            >${filter}</button>
          `).join('')}
        </div>

        <div class="lab-grid">
          ${filtered.length
            ? filtered.map(labCard).join('')
            : '<p style="grid-column:1/-1;text-align:center;padding:35px;color:var(--muted);font-size:10px">No labs match your search.</p>'
          }
        </div>
      </section>
    `;
  }

  function challenges() {
    const list = [
      ['Authentication Bypass', 'Web Security', 'Hard', '250 XP', '30 min'],
      ['JWT Token Analysis', 'API Security', 'Medium', '150 XP', '25 min'],
      ['SQL Login Bypass', 'Database', 'Medium', '180 XP', '35 min'],
      ['Linux SUID Hunt', 'Linux', 'Hard', '220 XP', '40 min']
    ];

    return `
      <div class="head">
        <div>
          <span>CHALLENGE ARENA</span>
          <h1>Test your skills</h1>
          <p>Short, focused problems designed to turn concepts into practical ability.</p>
        </div>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <span>4 AVAILABLE</span>
            <h2>Current challenges</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Challenge</th>
                <th>Area</th>
                <th>Difficulty</th>
                <th>Reward</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map(item => `
                <tr>
                  <td><b>${esc(item[0])}</b></td>
                  <td>${esc(item[1])}</td>
                  <td>${esc(item[2])}</td>
                  <td class="rank">+${esc(item[3])}</td>
                  <td>${esc(item[4])}</td>
                  <td><button type="button" class="btn" data-go="challenge">Open</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function paths() {
    const data = [
      ['Security Foundations', 'Core concepts, terminology and safe practice.', '12 labs', '100%', 'done'],
      ['Web Application Security', 'Requests, sessions, injection and browser security.', '18 labs', '67%', 'current'],
      ['API & Cloud Security', 'Secure APIs, tokens, authorization and cloud basics.', '16 labs', '0%', ''],
      ['Linux & Network Security', 'Operating systems, networking and defensive fundamentals.', '20 labs', '0%', '']
    ];

    return `
      <div class="head">
        <div>
          <span>LEARNING PATHS</span>
          <h1>Choose your route</h1>
          <p>Follow a structured sequence instead of jumping randomly between topics.</p>
        </div>
      </div>

      <div class="grid two">
        ${data.map((item, index) => `
          <section class="card" style="padding:20px">
            <div style="display:flex;gap:13px">
              <i class="row-icon">${index + 1}</i>
              <div style="min-width:0">
                <span class="eyebrow">
                  ${item[4] === 'done' ? 'COMPLETED' : item[4] === 'current' ? 'IN PROGRESS' : 'NEXT'}
                </span>
                <h2 style="font-size:15px;margin:4px 0">${esc(item[0])}</h2>
                <p style="font-size:9px;color:var(--muted);line-height:1.7">${esc(item[1])}</p>
                <div style="display:flex;justify-content:space-between;margin-top:15px;font-size:8px;color:var(--muted)">
                  <span>${esc(item[2])}</span>
                  <b>${esc(item[3])}</b>
                </div>
              </div>
            </div>
            <div class="bar" style="margin-top:11px"><div style="width:${item[3]}"></div></div>
          </section>
        `).join('')}
      </div>
    `;
  }

  function leaderboard() {
    const data = [
      ['1', 'Maya Singh', '4,980', '14'],
      ['2', 'Daniel Kim', '4,620', '13'],
      ['3', 'Riya Shah', '4,210', '12'],
      ['4', S.user?.name || 'Alex Carter', S.xp.toLocaleString(), String(S.level)],
      ['5', 'Noah Wilson', '1,980', '7']
    ];

    return `
      <div class="head">
        <div>
          <span>COMMUNITY</span>
          <h1>Leaderboard</h1>
          <p>Compare progress with other learners.</p>
        </div>
        <button type="button" class="btn">This week ▾</button>
      </div>

      <section class="card">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Learner</th>
                <th>XP</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td class="rank">#${item[0]}</td>
                  <td><b>${esc(item[1])}</b></td>
                  <td>${esc(item[2])}</td>
                  <td>Level ${esc(item[3])}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function writeups() {
    const data = [
      ['Understanding IDOR', 'Web Security', 'Maya Singh'],
      ['JWT mistakes I found in a lab', 'API Security', 'Daniel Kim'],
      ['Linux permissions without memorizing commands', 'Linux', 'Riya Shah'],
      ['A practical guide to SQL injection', 'Database', 'Noah Wilson'],
      ['How I approached my first CTF', 'CTF', 'Alex Carter'],
      ['Reading HTTP requests effectively', 'Web Security', 'Maya Singh']
    ];

    return `
      <div class="head">
        <div>
          <span>KNOWLEDGE BASE</span>
          <h1>Technical writeups</h1>
          <p>Learn from other learners and document your own discoveries.</p>
        </div>
        <button type="button" class="btn primary" id="newWriteup">+ Write a post</button>
      </div>

      <div class="grid writeups">
        ${data.map(item => `
          <article class="card writeup">
            <span class="eyebrow">${esc(item[1])}</span>
            <h3>${esc(item[0])}</h3>
            <p>A practical explanation of the concepts, reasoning and mistakes behind solving the problem.</p>
            <footer>
              <span>${esc(item[2])}</span>
              <span>7 min read</span>
            </footer>
          </article>
        `).join('')}
      </div>
    `;
  }

  function profile() {
    const name = S.user?.name || 'Alex Carter';

    return `
      <div class="head">
        <div>
          <span>ACCOUNT</span>
          <h1>Your profile</h1>
          <p>Your public learning record and progress.</p>
        </div>
        <button type="button" class="btn" data-page="settings">Edit settings</button>
      </div>

      <div class="grid profile-grid">
        <section class="card profile-card">
          <i class="big-avatar">${ini(name)}</i>
          <h2>${esc(name)}</h2>
          <p>Security learner · Level ${S.level}</p>

          <div class="profile-stats">
            <div><strong>${S.xp.toLocaleString()}</strong><small>XP</small></div>
            <div><strong>${S.completed}</strong><small>LABS</small></div>
            <div><strong>9</strong><small>STREAK</small></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <span>PROGRESS</span>
              <h2>Learning overview</h2>
            </div>
          </div>

          <div class="skill-list">
            ${skill('Web Security', 84)}
            ${skill('Authentication', 72)}
            ${skill('API Security', 65)}
            ${skill('Linux', 58)}
            ${skill('Network Security', 41)}
          </div>
        </section>
      </div>
    `;
  }

  function settings() {
    const name = S.user?.name || 'Alex Carter';
    const email = S.user?.email || 'alex@example.com';

    return `
      <div class="head">
        <div>
          <span>ACCOUNT</span>
          <h1>Settings</h1>
          <p>Manage your profile and learning preferences.</p>
        </div>
      </div>

      <section class="card form settings">
        <div class="form-grid">
          <label>
            Display name
            <input id="setName" value="${esc(name)}" maxlength="60">
          </label>

          <label>
            Email
            <input value="${esc(email)}" disabled>
          </label>
        </div>

        <button type="button" class="btn primary" id="save" style="margin-top:17px">Save changes</button>

        <div class="setting">
          <div>
            <b>Daily reminders</b>
            <small>Remind me when my practice goal is unfinished.</small>
          </div>
          <button type="button" class="switch on" aria-label="Toggle daily reminders"><i></i></button>
        </div>

        <div class="setting">
          <div>
            <b>Public profile</b>
            <small>Allow other learners to view progress.</small>
          </div>
          <button type="button" class="switch on" aria-label="Toggle public profile"><i></i></button>
        </div>

        <div class="setting">
          <div>
            <b>Challenge hints</b>
            <small>Show optional hints when available.</small>
          </div>
          <button type="button" class="switch" aria-label="Toggle challenge hints"><i></i></button>
        </div>
      </section>
    `;
  }

//   function challenge() {
//     const tasks = [
//       {
//         id: 1,
//         title: 'Find the vulnerable parameter',
//         description: 'Inspect the sample request below. Identify which parameter is reflected without proper output encoding.',
//         terminal: `$ curl "http://lab.local/search?q=hello"

// > HTTP/1.1 200 OK
// > Content-Type: text/html

// <h2>Results for: hello</h2>

// $ _`
//       },
//       {
//         id: 2,
//         title: 'Test basic HTML injection',
//         description: 'Modify the value of the vulnerable parameter and observe whether HTML markup is reflected in the response.',
//         terminal: `$ curl "http://lab.local/search?q=<h1>Hello</h1>"

// > HTTP/1.1 200 OK
// > Content-Type: text/html

// <h2>Results for: <h1>Hello</h1></h2>

// $ _`
//       },
//       {
//         id: 3,
//         title: 'Confirm reflected XSS',
//         description: 'Determine whether the reflected input can be interpreted as executable browser content.',
//         terminal: `$ curl "http://lab.local/search?q=<script>alert(1)</script>"

// > HTTP/1.1 200 OK
// > Content-Type: text/html

// <h2>
// Results for:
// <script>alert(1)</script>
// </h2>

// $ _`
//       },
//       {
//         id: 4,
//         title: 'Analyze the root cause',
//         description: 'Identify why the application is vulnerable. Focus on how user-controlled input reaches the HTML response.',
//         terminal: `Request
//    ↓
// User input
//    ↓
// Search parameter
//    ↓
// Server
//    ↓
// HTML response
//    ↓
// Browser interprets input

// Root cause:
// Untrusted input is reflected
// without proper output encoding.`
//       },
//       {
//         id: 5,
//         title: 'Identify the correct mitigation',
//         description: 'Choose the appropriate defensive approach for preventing reflected XSS in the application.',
//         terminal: `Unsafe:
// <h2>
// Results for: USER_INPUT
// </h2>

// Safer approach:
// Encode user-controlled output
// before inserting it into HTML.

// Additional controls:
// • Context-aware output encoding
// • Input validation
// • Content Security Policy
// • Safe templating`
//       }
//     ];

function challenge() {

  const tasks = [
    {
      id: 1,
      title: 'Find the vulnerable parameter',
      description:
        'Inspect the sample request below. Identify which parameter is reflected without proper output encoding.',

      instructions: [
        'Review the request carefully before interacting with the lab.',
        'Look for parameters whose values are supplied directly by the user.',
        'Determine which parameter is reflected in the HTML response.',
        'Do not modify anything outside the scope of this task.',
        'Your goal is to identify the input location that could become dangerous when reflected into a page.'
      ],

      terminal: `$ curl "http://lab.local/search?q=hello"

> HTTP/1.1 200 OK
> Content-Type: text/html

<h2>Results for: hello</h2>

$ _`
    },

    {
      id: 2,
      title: 'Test basic HTML injection',
      description:
        'Modify the value of the vulnerable parameter and observe whether HTML markup is reflected in the response.',

      instructions: [
        'Use the vulnerable parameter identified in Task 1.',
        'Change its value to harmless HTML markup.',
        'Observe how the server places the supplied value into the response.',
        'If the HTML is reflected without encoding, the application is not safely handling the input.',
        'Focus on understanding the behavior rather than attempting to exploit anything outside this lab.'
      ],

      terminal: `$ curl "http://lab.local/search?q=<h1>Hello</h1>"

> HTTP/1.1 200 OK
> Content-Type: text/html

<h2>Results for: <h1>Hello</h1></h2>

$ _`
    },

    {
      id: 3,
      title: 'Confirm reflected XSS',
      description:
        'Determine whether the reflected input can be interpreted as executable browser content.',

      instructions: [
        'Use the vulnerable parameter discovered in the previous tasks.',
        'Determine whether browser-interpreted content can be introduced through the reflected value.',
        'Observe whether the application treats the supplied content as data or markup.',
        'The objective is to confirm the vulnerability within this isolated training environment.',
        'Do not test the technique against real websites or systems.'
      ],

      terminal: `$ curl "http://lab.local/search?q=<script>alert(1)</script>"

> HTTP/1.1 200 OK
> Content-Type: text/html

<h2>
Results for:
<script>alert(1)</script>
</h2>

$ _`
    },

    {
      id: 4,
      title: 'Analyze the root cause',
      description:
        'Identify why the application is vulnerable. Focus on how user-controlled input reaches the HTML response.',

      instructions: [
        'Trace the flow of the user-controlled input through the application.',
        'Start with the user input and follow it through the search parameter.',
        'Determine where the server places the input into the response.',
        'Identify the missing security control.',
        'The root cause is related to how untrusted data is handled before being inserted into HTML.'
      ],

      terminal: `Request
   ↓
User input
   ↓
Search parameter
   ↓
Server
   ↓
HTML response
   ↓
Browser interprets input

Root cause:
Untrusted input is reflected
without proper output encoding.`
    },

    {
      id: 5,
      title: 'Identify the correct mitigation',
      description:
        'Choose the appropriate defensive approach for preventing reflected XSS in the application.',

      instructions: [
        'Review the root cause identified in Task 4.',
        'Determine what should happen to user-controlled data before it is inserted into HTML.',
        'Use context-aware output encoding as the primary defensive control.',
        'Consider additional protections such as input validation and Content Security Policy.',
        'The goal is to understand how the vulnerability should be prevented, not merely detected.'
      ],

      terminal: `Unsafe:
<h2>
Results for: USER_INPUT
</h2>

Safer approach:
Encode user-controlled output
before inserting it into HTML.

Additional controls:
• Context-aware output encoding
• Input validation
• Content Security Policy
• Safe templating`
    }
  ];

  /*
   * Remove invalid task IDs if the task list changes.
   */
  S.challengeProgress = S.challengeProgress.filter(id =>
    tasks.some(task => task.id === id)
  );

  /*
   * ---------------------------------------------------------
   * INSTRUCTIONS PAGE
   * ---------------------------------------------------------
   *
   * When the user clicks "Complete Task", we store the
   * current task in S.instructionTask and render this page.
   */

  if (S.instructionTask !== null) {

    const instructionTask = tasks.find(
      task => task.id === S.instructionTask
    );

    if (instructionTask) {

      return `
        <div class="head">
          <div>
            <span>LAB WORKSPACE · INSTRUCTIONS</span>

            <h1>Before you complete Task ${instructionTask.id}</h1>

            <p>
              Read the instructions carefully and make sure you understand
              what you are expected to identify in this task.
            </p>
          </div>

          <button
            type="button"
            class="btn"
            data-go="challenge"
            id="backToTask"
          >
            ← Back to task
          </button>
        </div>

        <div class="challenge">

          <section class="card challenge-main">

            <span class="eyebrow">
              TASK ${instructionTask.id} · INSTRUCTIONS
            </span>

            <h1>
              ${esc(instructionTask.title)}
            </h1>

            <p>
              ${esc(instructionTask.description)}
            </p>

            <div
              class="card"
              style="
                margin-top:20px;
                padding:20px;
                background:var(--surface-2);
              "
            >

              <h2 style="font-size:15px;margin-bottom:14px;">
                What you need to do
              </h2>

              <ol
                style="
                  margin:0;
                  padding-left:20px;
                  color:var(--text-2);
                  font-size:10px;
                  line-height:1.9;
                "
              >

                ${instructionTask.instructions.map(instruction => `
                  <li style="margin-bottom:8px;">
                    ${esc(instruction)}
                  </li>
                `).join('')}

              </ol>

            </div>

            <div
              class="card"
              style="
                margin-top:15px;
                padding:18px;
                border-left:3px solid var(--p);
              "
            >

              <span class="eyebrow">
                TASK OBJECTIVE
              </span>

              <p
                style="
                  margin:7px 0 0;
                  color:var(--text-2);
                  font-size:10px;
                  line-height:1.8;
                "
              >
                ${esc(instructionTask.description)}
              </p>

            </div>

            <button
              type="button"
              class="btn primary"
              id="confirmInstruction"
              style="margin-top:20px;"
            >
              I Understand — Complete Task →
            </button>

          </section>


          <aside class="card challenge-side">

            <h3>Task information</h3>

            <div
              style="
                margin-top:15px;
                display:grid;
                gap:12px;
              "
            >

              <div>
                <span class="eyebrow">TASK</span>
                <strong
                  style="
                    display:block;
                    margin-top:3px;
                    font-size:11px;
                  "
                >
                  ${instructionTask.id} / ${tasks.length}
                </strong>
              </div>

              <div>
                <span class="eyebrow">LAB</span>
                <strong
                  style="
                    display:block;
                    margin-top:3px;
                    font-size:11px;
                  "
                >
                  Reflected XSS
                </strong>
              </div>

              <div>
                <span class="eyebrow">REWARD</span>
                <strong
                  style="
                    display:block;
                    margin-top:3px;
                    font-size:11px;
                    color:var(--p);
                  "
                >
                  +30 XP
                </strong>
              </div>

            </div>

            <div
              class="bar"
              style="margin-top:20px;"
            >
              <div
                style="
                  width:${Math.round(
                    (S.challengeProgress.length / tasks.length) * 100
                  )}%;
                "
              ></div>
            </div>

            <p
              style="
                font-size:8px;
                color:var(--muted);
                margin:7px 0 0;
              "
            >
              ${S.challengeProgress.length} / ${tasks.length}
              tasks completed
            </p>

          </aside>

        </div>
      `;

    }
  }

  /*
   * ---------------------------------------------------------
   * NORMAL CHALLENGE PAGE
   * ---------------------------------------------------------
   */

  const currentIndex = tasks.findIndex(
    task => !S.challengeProgress.includes(task.id)
  );

  const currentTask =
    currentIndex === -1
      ? tasks[tasks.length - 1]
      : tasks[currentIndex];

  const completed =
    S.challengeProgress.length === tasks.length;

  const progress =
    Math.round(
      (S.challengeProgress.length / tasks.length) * 100
    );

  return `
    <div class="head">

      <div>

        <span>
          LAB WORKSPACE · WEB SECURITY
        </span>

        <h1>
          Reflected XSS
        </h1>

        <p>
          Identify the vulnerable input and understand why output encoding matters.
        </p>

      </div>

      <button
        type="button"
        class="btn"
        data-go="labs"
      >
        ← Back
      </button>

    </div>


    <div class="challenge">

      <section class="card challenge-main">

        <span class="eyebrow">
          ${
            completed
              ? 'LAB COMPLETED'
              : `TASK ${currentTask.id} / ${tasks.length}`
          }
        </span>

        <h1>
          ${esc(currentTask.title)}
        </h1>

        <p>
          ${esc(currentTask.description)}
        </p>


        <div class="terminal">
          ${esc(currentTask.terminal)}
        </div>


        ${
          completed

            ? `
              <button
                type="button"
                class="btn"
                disabled
                style="margin-top:18px;"
              >
                Lab completed ✓
              </button>
            `

            : `
              <button
                type="button"
                class="btn primary"
                id="complete"
                style="margin-top:18px;"
              >
                Complete Task →
              </button>
            `
        }

      </section>


      <aside class="card challenge-side">

        <h3>
          Lab progress
        </h3>


        <div
          class="bar"
          style="margin-top:10px;"
        >
          <div
            style="width:${progress}%"
          ></div>
        </div>


        <p
          style="
            font-size:8px;
            color:var(--muted);
            margin:7px 0 0;
          "
        >
          ${S.challengeProgress.length} /
          ${tasks.length}
          tasks completed
        </p>


        <div class="check-list">

          ${tasks.map(task => {

            const isDone =
              S.challengeProgress.includes(task.id);

            const isCurrent =
              task.id === currentTask.id &&
              !completed;

            return `
              <label
                class="${isCurrent ? 'current' : ''}"
              >

                <input
                  type="checkbox"
                  ${isDone ? 'checked' : ''}
                  disabled
                >

                <span>
                  Task ${task.id} —
                  ${esc(task.title)}
                </span>

              </label>
            `;

          }).join('')}

        </div>


        <p
          style="
            font-size:8px;
            color:var(--muted);
            line-height:1.8;
            margin:18px 0 0;
          "
        >

          Reward:
          <b style="color:var(--p)">
            150 XP
          </b>

          <br>

          Estimated time:
          25 min

          <br>

          Difficulty:
          Medium

        </p>

      </aside>

    </div>
  `;
}

  //   S.challengeProgress = S.challengeProgress.filter(id =>
  //     tasks.some(task => task.id === id)
  //   );

  //   const currentIndex = tasks.findIndex(task => !S.challengeProgress.includes(task.id));
  //   const currentTask = tasks[currentIndex === -1 ? tasks.length - 1 : currentIndex];
  //   const completed = S.challengeProgress.length === tasks.length;
  //   const progress = Math.round((S.challengeProgress.length / tasks.length) * 100);

  //   return `
  //     <div class="head">
  //       <div>
  //         <span>LAB WORKSPACE · WEB SECURITY</span>
  //         <h1>Reflected XSS</h1>
  //         <p>Identify the vulnerable input and understand why output encoding matters.</p>
  //       </div>
  //       <button type="button" class="btn" data-go="labs">← Back</button>
  //     </div>

  //     <div class="challenge">
  //       <section class="card challenge-main">
  //         <span class="eyebrow">${completed ? 'LAB COMPLETED' : `TASK ${currentTask.id} / ${tasks.length}`}</span>
  //         <h1>${esc(currentTask.title)}</h1>
  //         <p>${esc(currentTask.description)}</p>

  //         <div class="terminal">${esc(currentTask.terminal)}</div>

  //         ${completed
  //           ? '<button type="button" class="btn" disabled style="margin-top:18px">Lab completed ✓</button>'
  //           : '<button type="button" class="btn primary" id="complete" style="margin-top:18px">Complete Task →</button>'
  //         }
  //       </section>

  //       <aside class="card challenge-side">
  //         <h3>Lab progress</h3>

  //         <div class="bar" style="margin-top:10px">
  //           <div style="width:${progress}%"></div>
  //         </div>

  //         <p style="font-size:8px;color:var(--muted);margin:7px 0 0">
  //           ${S.challengeProgress.length} / ${tasks.length} tasks completed
  //         </p>

  //         <div class="check-list">
  //           ${tasks.map(task => {
  //             const isDone = S.challengeProgress.includes(task.id);
  //             const isCurrent = task.id === currentTask.id && !completed;

  //             return `
  //               <label class="${isCurrent ? 'current' : ''}">
  //                 <input type="checkbox" ${isDone ? 'checked' : ''} disabled>
  //                 <span>Task ${task.id} — ${esc(task.title)}</span>
  //               </label>
  //             `;
  //           }).join('')}
  //         </div>

  //         <p style="font-size:8px;color:var(--muted);line-height:1.8;margin:18px 0 0">
  //           Reward: <b style="color:var(--p)">150 XP</b><br>
  //           Estimated time: 25 min<br>
  //           Difficulty: Medium
  //         </p>
  //       </aside>
  //     </div>
  //   `;
  // }

  const views = {
    dashboard,
    labs,
    challenges,
    paths,
    leaderboard,
    writeups,
    profile,
    settings,
    challenge
  };

  function render() {
    const page = $('#page');
    if (!page) return;

    const view = views[S.page] || views.dashboard;

    if (!views[S.page]) {
      S.page = 'dashboard';
      S.filter = 'All';
    }

    page.innerHTML = view();

    $$('.nav').forEach(nav => {
      const pageName = nav.dataset.page;
      const filter = nav.dataset.filter;

      const active = filter
        ? S.page === 'labs' && S.filter === filter
        : pageName === S.page && !(
            S.page === 'labs' &&
            S.filter !== 'All' &&
            pageName === 'labs'
          );

      nav.classList.toggle('active', active);
    });

    identity();

    const search = $('#search');
    if (search && search.value !== S.search) {
      search.value = S.search;
    }
  }

  /* =======================================================
     DYNAMIC APP EVENTS
  ======================================================= */

  document.addEventListener('click', event => {
    const target = event.target;

    const nav = target.closest('.nav');
    if (nav) {
      event.preventDefault();

      const pageName = nav.dataset.page;
      const filter = nav.dataset.filter;

      S.page = pageName || 'dashboard';
      S.filter = filter || (S.page === 'labs' ? S.filter : 'All');

      if (S.page !== 'labs') {
        S.filter = 'All';
      }

      closeMobileSidebar();
      render();
      return;
    }

    const pageButton = target.closest('[data-page]');
    if (pageButton && !pageButton.classList.contains('nav')) {
      const destination = pageButton.dataset.page;
      if (destination && views[destination]) {
        S.page = destination;
        S.filter = destination === 'labs' ? S.filter : 'All';
        render();
      }
      return;
    }

    const go = target.closest('[data-go]');
    if (go) {
      const destination = go.dataset.go;

      if (views[destination]) {
        S.page = destination;
        if (destination !== 'labs') S.filter = 'All';
        render();
      }
      return;
    }

    const filter = target.closest('.filter[data-filter]');
    if (filter) {
      S.page = 'labs';
      S.filter = filter.dataset.filter || 'All';
      render();
      return;
    }

    const labButton = target.closest('[data-lab]');
    if (labButton) {
      S.page = 'challenge';
      S.filter = 'All';
      render();
      return;
    }

    if (target.closest('#complete')) {
      completeCurrentTask();
      return;
    }

    if (target.closest('#confirmInstruction')) {
  confirmInstructionCompletion();
  return;
}

    if (target.closest('#save')) {
      saveSettings();
      return;
    }

    if (target.closest('.switch')) {
      target.closest('.switch').classList.toggle('on');
      return;
    }

    if (target.closest('#newWriteup')) {
      openWriteupModal();
      return;
    }

    if (target.closest('[data-close]')) {
      closeModal();
    }
  });

  // function completeCurrentTask() {
  //   const tasks = [1, 2, 3, 4, 5];
  //   const currentTask = tasks.find(id => !S.challengeProgress.includes(id));

  //   if (!currentTask) {
  //     toast('This lab is already completed.');
  //     return;
  //   }

  //   S.challengeProgress.push(currentTask);
  //   S.xp += 30;

  //   if (S.challengeProgress.length === tasks.length) {
  //     S.completed += 1;
  //     S.xp += 150;
  //     toast('Lab completed! +180 XP');
  //   } else {
  //     toast(`Task ${currentTask} completed! +30 XP`);
  //   }

  //   if (S.xp >= (S.level * 500)) {
  //     S.level += 1;
  //     toast(`Level up! You reached Level ${S.level}.`);
  //   }

  //   persistProgress();
  //   render();
  // }

  function completeCurrentTask() {

  const tasks = [1, 2, 3, 4, 5];

  const currentTask = tasks.find(
    id => !S.challengeProgress.includes(id)
  );

  if (!currentTask) {
    toast('This lab is already completed.');
    return;
  }

  /*
   * DO NOT COMPLETE THE TASK YET.
   *
   * First open the instruction page.
   */
  S.instructionTask = currentTask;

  render();
}

function confirmInstructionCompletion() {

  const tasks = [1, 2, 3, 4, 5];

  const currentTask = S.instructionTask;

  if (!currentTask) {
    return;
  }

  /*
   * Prevent duplicate completion.
   */
  if (S.challengeProgress.includes(currentTask)) {

    S.instructionTask = null;

    render();

    return;
  }

  /*
   * Actually complete the task.
   */
  S.challengeProgress.push(currentTask);

  /*
   * XP for completing an individual task.
   */
  S.xp += 30;

  /*
   * If all five tasks are complete,
   * give the additional lab reward.
   */
  if (S.challengeProgress.length === tasks.length) {

    S.completed += 1;

    S.xp += 150;

    toast('Lab completed! +180 XP');

  } else {

    toast(
      `Task ${currentTask} completed! +30 XP`
    );

  }

  /*
   * Level progression.
   */
  if (S.xp >= (S.level * 500)) {

    S.level += 1;

    toast(
      `Level up! You reached Level ${S.level}.`
    );
  }

  /*
   * Clear instruction page.
   */
  S.instructionTask = null;

  /*
   * Save progress.
   */
  persistProgress();

  /*
   * Render the next task.
   */
  render();
}

  function saveSettings() {
    const input = $('#setName');
    if (!input || !S.user) return;

    const name = input.value.trim();

    if (!name) {
      toast('Display name cannot be empty.');
      return;
    }

    S.user.name = name;
    saveSession(S.user);

    const account = JSON.parse(localStorage.getItem(STORAGE.account) || 'null');
    if (account && account.email === S.user.email) {
      account.name = name;
      localStorage.setItem(STORAGE.account, JSON.stringify(account));
    }

    identity();
    toast('Profile updated.');
  }

  /* =======================================================
     WRITEUP MODAL
  ======================================================= */

  function openWriteupModal() {
    const modal = $('#modal');
    const card = $('#modalCard');
    if (!modal || !card) return;

    card.innerHTML = `
      <button type="button" class="close" data-close aria-label="Close">×</button>
      <h2>Write a technical note</h2>
      <p>Document a security concept, lab solution or useful troubleshooting lesson.</p>

      <label style="display:grid;gap:7px;font-size:9px;font-weight:700;margin-top:17px">
        Title
        <input id="writeupTitle" placeholder="e.g. Understanding IDOR">
      </label>

      <label style="display:grid;gap:7px;font-size:9px;font-weight:700;margin-top:12px">
        Content
        <textarea id="writeupContent" placeholder="Write your explanation..."></textarea>
      </label>

      <button type="button" class="btn primary" id="saveDraft" style="margin-top:13px">Save draft</button>
    `;

    modal.classList.remove('hide');
    modal.setAttribute('aria-hidden', 'false');
  }

  document.addEventListener('click', event => {
    if (event.target.closest('#saveDraft')) {
      const title = $('#writeupTitle')?.value.trim();
      const content = $('#writeupContent')?.value.trim();

      if (!title || !content) {
        toast('Add a title and some content first.');
        return;
      }

      closeModal();
      toast('Draft saved locally.');
    }
  });

  function closeModal() {
    const modal = $('#modal');
    if (!modal) return;

    modal.classList.add('hide');
    modal.setAttribute('aria-hidden', 'true');
  }

  /* =======================================================
     AUTH TABS
  ======================================================= */

  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const login = $('#login');
      const register = $('#register');
      const isLogin = tab.dataset.auth === 'login';

      $$('.tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');

      login?.classList.toggle('hide', !isLogin);
      register?.classList.toggle('hide', isLogin);
    });
  });

  /* =======================================================
     LOGIN
  ======================================================= */

  $('#login')?.addEventListener('submit', event => {
    event.preventDefault();

    const email = $('#lemail').value.trim().toLowerCase();
    const password = $('#lpass').value;
    const remember = $('#remember')?.checked;

    if (!validEmail(email)) {
      toast('Enter a valid email address.');
      return;
    }

    if (!password) {
      toast('Enter your password.');
      return;
    }

    const account = JSON.parse(localStorage.getItem(STORAGE.account) || 'null');

    if (!account) {
      toast('No account found. Create an account first.');
      return;
    }

    if (account.email !== email) {
      toast('No account found with this email.');
      return;
    }

    if (account.password !== password) {
      toast('Incorrect password.');
      return;
    }

    saveSession({
      name: account.name,
      email: account.email
    });

    localStorage.setItem('cybernestRemember', remember ? 'true' : 'false');

    openApp();
    toast(`Welcome back, ${account.name.split(' ')[0]}!`);
  });

  /* =======================================================
     REGISTRATION
  ======================================================= */

  $('#register')?.addEventListener('submit', event => {
    event.preventDefault();

    const name = $('#rname').value.trim();
    const email = $('#remail').value.trim().toLowerCase();
    const password = $('#rpass').value;

    if (!name) {
      toast('Enter your full name.');
      return;
    }

    if (!validEmail(email)) {
      toast('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      toast('Password must contain at least 6 characters.');
      return;
    }

    const existing = JSON.parse(localStorage.getItem(STORAGE.account) || 'null');

    if (existing?.email === email) {
      toast('This email is already registered. Sign in instead.');
      return;
    }

    const account = { name, email, password };
    localStorage.setItem(STORAGE.account, JSON.stringify(account));

    saveSession({ name, email });
    localStorage.setItem('cybernestRemember', 'true');

    openApp();
    toast('Account created successfully.');
  });

  $('#forgot')?.addEventListener('click', event => {
    event.preventDefault();
    toast('Password reset will be connected to the backend.');
  });

  function openApp() {
    $('#auth')?.classList.add('hide');
    $('#app')?.classList.remove('hide');

    S.page = 'dashboard';
    S.filter = 'All';
    S.search = '';

    render();
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  $('#logout')?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE.session);
    localStorage.removeItem('cybernestRemember');

    S.user = null;
    S.page = 'dashboard';
    S.filter = 'All';
    S.search = '';

    $('#app')?.classList.add('hide');
    $('#auth')?.classList.remove('hide');
    $('#login')?.reset();

    toast('Signed out successfully.');
  });

  /* =======================================================
     THEME
  ======================================================= */

  const themeToggle = $('#themeToggle');
  const savedTheme = localStorage.getItem(STORAGE.theme);

  if (savedTheme === 'dark' || savedTheme === 'light') {
    document.documentElement.dataset.theme = savedTheme;
  }

  function updateThemeIcon() {
    if (!themeToggle) return;

    const theme = document.documentElement.dataset.theme;
    themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
  }

  updateThemeIcon();

  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE.theme, next);
    updateThemeIcon();
  });

  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  const menu = $('#menu');
  const sidebar = $('#sidebar');
  const overlay = $('#sidebarOverlay');

  function closeMobileSidebar() {
    sidebar?.classList.remove('open');
    document.body.classList.remove('sidebar-open');
    menu?.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileSidebar() {
    if (!sidebar) return;

    const open = sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', open);
    menu?.setAttribute('aria-expanded', String(open));
  }

  menu?.addEventListener('click', event => {
    event.stopPropagation();
    toggleMobileSidebar();
  });

  overlay?.addEventListener('click', closeMobileSidebar);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMobileSidebar();
      closeModal();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#search')?.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeMobileSidebar();
    }
  });

  /* =======================================================
     HEADER ACTIONS
  ======================================================= */

  $('#notify')?.addEventListener('click', () => {
    toast('No new notifications.');
  });

  $('#userBtn')?.addEventListener('click', () => {
    S.page = 'profile';
    S.filter = 'All';
    render();
  });

  /* =======================================================
     SEARCH
  ======================================================= */

  $('#search')?.addEventListener('input', event => {
    S.search = event.target.value;

    if (S.search.trim()) {
      S.page = 'labs';
    }

    render();
  });

  /* =======================================================
     INITIAL SESSION
  ======================================================= */

  const activeSession = JSON.parse(localStorage.getItem(STORAGE.session) || 'null');

  if (activeSession) {
    S.user = activeSession;
    openApp();
  } else {
    $('#auth')?.classList.remove('hide');
    $('#app')?.classList.add('hide');
  }
})();
