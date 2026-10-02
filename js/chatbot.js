/**
 * CG Advisors — website chat assistant (scripted FAQ + human handoff).
 *
 * - Answers common questions from the FAQ array below (no AI, no API key).
 * - "Talk to a human" collects a phone number + inquiry topic and POSTs them
 *   to the Apps Script endpoint, which emails info@cgadvisorsgroup.com.
 *
 * EDITING:
 *   - FAQ answers:        edit the FAQ array.
 *   - Inquiry topics:     edit TOPICS.
 *   - Backend endpoint:   ENDPOINT (same Apps Script web app as the contact form).
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwWooJg5atVR6rAdYu1ZKlkB5QbG5BathPE-dfS77D2x3bX8osbwZiwa8IqiC6aijH9/exec';

  var C = {
    bg: '#080b10', panel: '#13171e', fg: '#f3f5f8', muted: '#9199a5',
    line: '#414853', accent: '#53de73', ink: '#0b140d', bot: '#222a37'
  };

  // Inquiry topics offered when the visitor asks to speak with a person.
  var TOPICS = [
    'New customer looking for services',
    'Existing customer requires support',
    'Other support question'
  ];

  // Scripted FAQ. First entry whose keyword appears in the message wins.
  // `handoff:true` starts the talk-to-a-human flow. `q` = quick-reply buttons.
  // ============================================================
  //  KNOWLEDGE BASE — edit freely. Each entry:
  //    { k:[keywords/synonyms], a:'answer', q:[quick replies], handoff? }
  //  Matching is BEST-SCORE (not first-match): the entry whose keywords
  //  best match the visitor's words wins. Multi-word keywords score higher.
  //
  //  >>> TODO / GAPS — these answers are intentionally generic and route to a
  //      person so the bot never invents specifics. Replace with real info:
  //        'process'    engagement steps        'timeline'  typical timelines
  //        'industries' full list of sectors    'support'   existing-client support/SLA
  //        'security'   NDA / data handling      'remote'    remote vs on-site
  //        'careers'    hiring / how to apply    'partner'   partnership handling
  // ============================================================
  var FAQ = [
    // ---- talk to a human (handoff) ----
    { k: ['human','agent','person','representative','real person','talk to someone',
          'speak to someone','speak with someone','speak to a','live agent','call me',
          'callback','call back','salesperson','contact me','have someone call','reach out to me'],
      handoff: true },

    // ---- about / what we do ----
    { k: ['what do you do','who are you','about you','tell me about','what is cg','what does cg',
          'your company','consultancy','consulting','consultant'],
      a: 'CG Advisors LLC is a consulting firm specializing in product strategy, business transformation, and technology solutions \u2014 delivered with white-glove attention to detail. We partner with enterprises and founders to turn ambitious ideas into working software and the agentic systems that run them.',
      q: ['Our services','Your work','Talk to a human'] },

    // ---- services overview (drills down) ----
    { k: ['service','offer','offering','what do you provide','what can you help','capabilities','what do you sell'],
      a: 'We work across three areas:\n\n\u2022 Strategy & Transformation\n\u2022 Product & Growth\n\u2022 Technology & Autonomous Systems\n\nTap one for detail, or I can connect you with a person.',
      q: ['Strategy & Transformation','Product & Growth','Technology','Talk to a human'] },

    { k: ['strateg','transformation','operating plan','operating model','roadmap','advisory'],
      a: 'Strategy & Transformation \u2014 you have big ideas; we turn them into an operating plan and the metrics to prove it\u2019s working. That means clarifying goals, shaping the roadmap, and standing up the measures to track progress.',
      q: ['Product & Growth','Technology','Talk to a human'] },

    { k: ['product','growth','product market','market fit','pmf','mvp','discovery','validation','user research'],
      a: 'Product & Growth \u2014 we evolve product ideas into real product-market fit, validated by customers, not assumptions. We help you test the riskiest ideas quickly and build what earns traction.',
      q: ['Strategy & Transformation','Technology','Talk to a human'] },

    { k: ['technolog','engineering','build','software','develop','web app','mobile app','dashboard','platform','integration','api'],
      a: 'Technology & Autonomous Systems \u2014 we design, build, and host:\n\n\u2022 Web, mobile & dashboard applications\n\u2022 AI agents & automation pipelines\n\u2022 Predictive models\n\n\u2026deployed on AWS, Azure & Google Cloud.',
      q: ['AI & agentic systems','Tech stack','Talk to a human'] },

    // ---- AI / agentic explainer ----
    { k: ['ai','artificial intelligence','agent','agentic','autonomous','automation','llm',
          'machine learning','predictive','chatbot'],
      a: 'A big part of our work is agentic systems \u2014 AI agents and automation that keep processes running around the clock, plus predictive models that turn your data into decisions. We build these into your product and operations, not as bolt-ons.',
      q: ['Tech stack','Talk to a human'] },

    // ---- selected work / case studies ----
    { k: ['work','case stud','portfolio','project','client','example','proof','past work','references'],
      a: 'A few recent projects:\n\n\u2022 A financial analytics dashboard for an international financial institution\n\u2022 A mobile app for a dental laboratory services company (healthcare)\n\u2022 An eCommerce solution for a personal-services startup\n\nWant to discuss something similar?',
      q: ['Industries you serve','Talk to a human'] },

    // GAP: confirm full list of industries.
    { k: ['industr','sector','vertical','domain','fintech','finance','financial','healthcare',
          'health care','retail','ecommerce','e commerce'],
      a: 'We\u2019ve delivered across financial services, healthcare, and retail / eCommerce, among others. Tell us about your space and we can speak to relevant experience.',
      q: ['Our services','Talk to a human'] },

    // ---- who we work with ----
    { k: ['who do you work with','startup','founder','enterprise','small business','scale up','scaleup'],
      a: 'We partner with both enterprises and founders \u2014 from established organizations modernizing how they operate to startups building their first product.',
      q: ['Our services','Talk to a human'] },

    // ---- tech stack ----
    { k: ['tech stack','stack','technologies','tools','languages','framework','built with','what tech'],
      a: 'Our toolkit includes TypeScript, React, Next.js, Node, Python, PostgreSQL, Inngest, Vercel, GitHub, MCP, and Claude Code. We\u2019re pragmatic \u2014 we pick the right tools for your goals.',
      q: ['Talk to a human'] },

    // GAP: replace with your real engagement steps.
    { k: ['process','how do you work','how it works','engagement','get started','getting started',
          'next step','onboarding','work together','what happens','steps'],
      a: 'Most engagements start with a short discovery conversation to understand your goals, then we scope the work and propose a plan. The fastest way to get specifics for your situation is a quick call.',
      q: ['Talk to a human'] },

    // GAP: confirm typical timelines.
    { k: ['how long','timeline','timeframe','time frame','duration','how quickly','turnaround','when can you start'],
      a: 'Timelines depend on scope \u2014 we\u2019ll give you a realistic estimate after a short discovery call. Many efforts start with a focused first phase so you see value quickly.',
      q: ['Talk to a human'] },

    // ---- pricing ----
    { k: ['price','pricing','cost','rate','how much','budget','quote','fee','expensive','charge','afford'],
      a: 'Every engagement is scoped individually, so pricing depends on what you need. The best next step is a short conversation so we can give you an accurate picture.',
      q: ['Talk to a human'] },

    // GAP: confirm existing-client support channel / hours / SLA.
    { k: ['support','existing customer','existing client','help desk','issue','bug','broken',
          'not working','problem','maintenance','sla'],
      a: 'If you\u2019re an existing client and need support, the quickest path is to reach your CG Advisors contact directly. I can also pass your details to the team right now.',
      q: ['Talk to a human'] },

    // GAP: replace with your real stance on confidentiality / data.
    { k: ['security','confidential','nda','privacy','data protection','compliance','gdpr','hipaa'],
      a: 'We take confidentiality and data handling seriously and are happy to discuss specifics \u2014 including NDAs \u2014 on a call.',
      q: ['Talk to a human'] },

    // ---- location ----
    { k: ['where','located','location','based','office','address','washington'],
      a: 'We\u2019re based in Washington, DC.',
      q: ['Talk to a human'] },

    // GAP: confirm remote vs on-site / travel.
    { k: ['remote','onsite','on site','in person','travel','work from','where do you work'],
      a: 'We work with clients wherever they are. If location matters for your project, mention it on a call and we\u2019ll sort out the details.',
      q: ['Talk to a human'] },

    // GAP: confirm hiring / where to apply.
    { k: ['career','job','hiring','join the team','work for you','apply','resume','recruit'],
      a: 'Thanks for your interest! For career inquiries, email info@cgadvisorsgroup.com with a short note and your resume.',
      q: [] },

    // ---- contact ----
    { k: ['contact','email','reach','get in touch','phone','number'],
      a: 'You can email us at info@cgadvisorsgroup.com or use the contact form on this page. I can also have someone call you \u2014 just tap below.',
      q: ['Talk to a human'] },

    // GAP: confirm partnership/vendor handling.
    { k: ['partner','partnership','vendor','supplier','collaborate','referral','reseller'],
      a: 'For partnership or vendor inquiries, email info@cgadvisorsgroup.com and we\u2019ll route it to the right person.',
      q: ['Talk to a human'] },

    // ---- pleasantries (last: lose score ties to real topics) ----
    { k: ['hi','hello','hey','good morning','good afternoon','good evening','howdy','greetings'],
      a: 'Hi! I\u2019m the CG Advisors assistant. I can answer quick questions about what we do, or connect you with a person. What would you like to know?',
      q: ['What do you do?','Our services','Talk to a human'] },

    { k: ['thank','appreciate','cheers'],
      a: 'You\u2019re welcome! Anything else I can help with?',
      q: ['Our services','Talk to a human'] },

    { k: ['bye','goodbye','see ya','that is all','no thanks','nothing else','no thank'],
      a: 'Thanks for stopping by \u2014 reach us anytime at info@cgadvisorsgroup.com.',
      q: [] }
  ];

  var FALLBACK = {
    a: 'I didn\u2019t quite catch that. I can help with any of these \u2014 or connect you with a person:',
    q: ['Our services','Your work','Pricing','Talk to a human']
  };

  var GREETING = FAQ.filter(function (f) { return f.k.indexOf('hi') !== -1; })[0];

  // Touch devices (phones/tablets): don't auto-focus the input on open, or the
  // on-screen keyboard pops up before the user taps into the field.
  var IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;

  // ---- state ----
  var mode = 'chat';          // 'chat' | 'phone' | 'topic'
  var lead = { phone: '', topic: '' };
  var started = false;
  var els = {};

  // ---- helpers ----
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function norm(s) { return String(s || '').toLowerCase().trim(); }
  function digits(s) { return (String(s).match(/\d/g) || []).length; }

  function scoreEntry(entry, msg) {
    var s = 0;
    for (var i = 0; i < entry.k.length; i++) {
      var kw = entry.k[i];
      if (msg.indexOf(' ' + kw) !== -1) s += (kw.indexOf(' ') !== -1 ? 2 : 1);
    }
    return s;
  }

  // Best-match (not first-match): highest-scoring entry wins; 0 => fallback.
  function bestMatch(text) {
    var msg = ' ' + norm(text).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, score = 0;
    for (var i = 0; i < FAQ.length; i++) {
      var sc = scoreEntry(FAQ[i], msg);
      if (sc > score) { score = sc; best = FAQ[i]; }
    }
    return score > 0 ? best : null;
  }

  // ---- rendering ----
  function addMessage(text, who) {
    var row = document.createElement('div');
    row.className = 'cga-cb-row cga-cb-' + who;
    var bubble = document.createElement('div');
    bubble.className = 'cga-cb-bubble';
    bubble.innerHTML = esc(text).replace(/\n/g, '<br>');
    row.appendChild(bubble);
    els.msgs.appendChild(row);
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }

  function clearQuick() { els.quick.innerHTML = ''; }

  function showQuick(labels) {
    clearQuick();
    (labels || []).forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cga-cb-chip';
      b.textContent = label;
      b.addEventListener('click', function () { handleUser(label); });
      els.quick.appendChild(b);
    });
  }

  function botSay(entry) {
    addMessage(entry.a, 'bot');
    showQuick(entry.q);
  }

  // ---- conversation ----
  function handleUser(text) {
    text = String(text || '').trim();
    if (!text) return;
    addMessage(text, 'user');
    clearQuick();

    if (mode === 'phone') { return takePhone(text); }
    if (mode === 'topic') { return takeTopic(text); }

    var hit = bestMatch(text);
    if (hit && hit.handoff) { return startHandoff(); }
    setTimeout(function () { botSay(hit || FALLBACK); }, 180);
  }

  function startHandoff() {
    mode = 'phone';
    lead = { phone: '', topic: '' };
    setTimeout(function () {
      addMessage('Happy to connect you with someone on the team. What’s the best phone number to reach you?', 'bot');
    }, 180);
  }

  function takePhone(text) {
    if (digits(text) < 7) {
      setTimeout(function () {
        addMessage('That doesn’t look like a complete number — please enter your full phone number, including area code.', 'bot');
      }, 150);
      return;
    }
    lead.phone = text;
    mode = 'topic';
    setTimeout(function () {
      addMessage('Thanks. What is your inquiry about?', 'bot');
      showQuick(TOPICS);
    }, 180);
  }

  function takeTopic(text) {
    var picked = null, t = norm(text);
    TOPICS.forEach(function (opt) { if (norm(opt) === t) picked = opt; });
    if (!picked) {
      setTimeout(function () {
        addMessage('Please choose one of these options:', 'bot');
        showQuick(TOPICS);
      }, 150);
      return;
    }
    lead.topic = picked;
    mode = 'chat';
    submitLead();
  }

  function submitLead() {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ type: 'chat_handoff', phone: lead.phone, topic: lead.topic, page: location.href })
      }).catch(function () {});
    } catch (e) {}
    setTimeout(function () {
      addMessage('Thanks! Someone from CG Advisors will call you at ' + lead.phone + ' about “' + lead.topic + '”. Anything else I can help with?', 'bot');
      showQuick(['Our services', 'No, thanks']);
    }, 200);
  }

  // ---- widget build ----
  function openPanel() {
    els.panel.classList.add('cga-cb-open');
    els.launch.setAttribute('aria-expanded', 'true');
    if (!IS_TOUCH) els.input.focus();
    if (!started) { started = true; setTimeout(function () { botSay(GREETING); }, 250); }
  }
  function closePanel() {
    els.panel.classList.remove('cga-cb-open');
    els.launch.setAttribute('aria-expanded', 'false');
  }

  function ensureStyle() {
    if (document.getElementById('cga-cb-style')) return;
    var style = document.createElement('style');
    style.id = 'cga-cb-style';
    style.textContent = [
      '#cga-cb-launch{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom,0px));width:60px;height:60px;border-radius:50%;',
      'background:' + C.accent + ';color:' + C.ink + ';border:none;cursor:pointer;z-index:2147483000;',
      'box-shadow:0 8px 24px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;transition:transform .15s ease}',
      '#cga-cb-launch:hover{transform:scale(1.06)}',
      '#cga-cb-launch svg{width:28px;height:28px}',
      '#cga-cb-panel{position:fixed;right:16px;bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:2147483000;',
      'width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 130px));height:min(560px,calc(100dvh - 130px));',
      'background:' + C.panel + ';border:1px solid ' + C.line + ';border-radius:18px;overflow:hidden;',
      'display:none;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.55);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
      '#cga-cb-panel.cga-cb-open{display:flex}',
      '@media (max-width:480px){#cga-cb-panel{left:12px;right:12px;width:auto;',
      'top:8px;bottom:auto;max-height:none;',
      'height:calc(100vh - 16px);height:calc(100dvh - 16px)}}',
      '.cga-cb-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid ' + C.line + '}',
      '.cga-cb-title{display:flex;align-items:center;gap:9px;color:' + C.fg + ';font-weight:700;font-size:15px}',
      '.cga-cb-title .dot{width:8px;height:8px;border-radius:50%;background:' + C.accent + ';box-shadow:0 0 0 3px rgba(83,222,115,.2)}',
      '.cga-cb-close{background:transparent;border:none;color:' + C.muted + ';cursor:pointer;font-size:22px;line-height:1;padding:4px 8px;border-radius:8px}',
      '.cga-cb-close:hover{color:' + C.fg + '}',
      '.cga-cb-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
      '.cga-cb-row{display:flex}',
      '.cga-cb-bot{justify-content:flex-start}.cga-cb-user{justify-content:flex-end}',
      '.cga-cb-bubble{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;white-space:normal;word-wrap:break-word}',
      '.cga-cb-bot .cga-cb-bubble{background:' + C.bot + ';color:' + C.fg + ';border-bottom-left-radius:4px}',
      '.cga-cb-user .cga-cb-bubble{background:' + C.accent + ';color:' + C.ink + ';font-weight:600;border-bottom-right-radius:4px}',
      '.cga-cb-quick{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 10px 16px}',
      '.cga-cb-chip{background:transparent;color:' + C.accent + ';border:1px solid ' + C.line + ';border-radius:100px;',
      'padding:7px 13px;font-size:13px;cursor:pointer;font-family:inherit}',
      '.cga-cb-chip:hover{border-color:' + C.accent + ';background:rgba(83,222,115,.08)}',
      '.cga-cb-inputrow{display:flex;gap:8px;padding:12px;border-top:1px solid ' + C.line + '}',
      '.cga-cb-input{flex:1;min-width:0;background:' + C.bg + ';border:1px solid ' + C.line + ';color:' + C.fg + ';',
      'border-radius:10px;padding:10px 12px;font-size:15px;font-family:inherit;outline:none}',
      '.cga-cb-input:focus{border-color:' + C.accent + '}',
      '.cga-cb-send{flex:none;background:' + C.accent + ';color:' + C.ink + ';border:none;border-radius:10px;',
      'padding:0 16px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}',
      '.cga-cb-send:hover{filter:brightness(1.08)}'
    ].join('');
    document.head.appendChild(style);
  }

  function build() {
    ensureStyle();
    if (document.getElementById('cga-cb-launch')) return;

    var launch = document.createElement('button');
    launch.id = 'cga-cb-launch';
    launch.setAttribute('aria-label', 'Open chat');
    launch.setAttribute('aria-expanded', 'false');
    launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z"/></svg>';

    var panel = document.createElement('div');
    panel.id = 'cga-cb-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'CG Advisors chat');
    panel.innerHTML =
      '<div class="cga-cb-head"><div class="cga-cb-title"><span class="dot"></span>CG Advisors Assistant</div>' +
      '<button class="cga-cb-close" aria-label="Close chat">×</button></div>' +
      '<div class="cga-cb-msgs" id="cga-cb-msgs"></div>' +
      '<div class="cga-cb-quick" id="cga-cb-quick"></div>' +
      '<div class="cga-cb-inputrow">' +
      '<input class="cga-cb-input" id="cga-cb-input" type="text" autocomplete="off" placeholder="Type a message…" aria-label="Message">' +
      '<button class="cga-cb-send" id="cga-cb-send" type="button">Send</button></div>';

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    els.launch = launch;
    els.panel = panel;
    els.msgs = panel.querySelector('#cga-cb-msgs');
    els.quick = panel.querySelector('#cga-cb-quick');
    els.input = panel.querySelector('#cga-cb-input');

    launch.addEventListener('click', function () {
      panel.classList.contains('cga-cb-open') ? closePanel() : openPanel();
    });
    panel.querySelector('.cga-cb-close').addEventListener('click', closePanel);

    function send() { var v = els.input.value; els.input.value = ''; handleUser(v); }
    panel.querySelector('#cga-cb-send').addEventListener('click', send);
    els.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  }

  function boot() {
    build();
    // The site's app framework replaces <body> contents when it mounts, which
    // removes the widget. Re-add it whenever it goes missing (one-time mount).
    try {
      new MutationObserver(function () {
        if (!document.getElementById('cga-cb-launch')) build();
      }).observe(document.body, { childList: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
