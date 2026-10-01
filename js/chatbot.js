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
  var FAQ = [
    { k: ['human', 'agent', 'person', 'representative', 'real person', 'talk to someone',
          'speak to someone', 'speak with someone', 'live agent', 'call me', 'callback',
          'call back', 'salesperson', 'speak to a', 'talk to a human'], handoff: true },

    { k: ['service', 'offer', 'what do you provide', 'help with', 'what can you help'],
      a: 'We work across three areas:\n\n• Strategy & Transformation\n• Product & Growth\n• Technology & Autonomous Systems\n\nAsk about any of them, or I can connect you with a person.',
      q: ['Strategy & Transformation', 'Product & Growth', 'Technology', 'Talk to a human'] },

    { k: ['strateg', 'transformation', 'operating plan'],
      a: 'Strategy & Transformation — you have big ideas; we turn them into an operating plan, and the metrics to prove it’s working.' },

    { k: ['product', 'growth', 'product-market', 'market fit', 'pmf'],
      a: 'Product & Growth — we evolve product ideas into real product-market fit, validated by customers, not assumptions.' },

    { k: ['technolog', 'engineering', 'software', 'app', 'agent', 'agentic', 'automation',
          'autonomous', 'cloud', 'aws', 'azure', 'gcp'],
      a: 'Technology & Autonomous Systems — we design, build, and host web, mobile & dashboard apps, AI agents, and automation pipelines, deployed on AWS, Azure & Google Cloud.' },

    { k: ['what do you do', 'who are you', 'about', 'tell me about', 'what is cg',
          'what does cg', 'company', 'consult'],
      a: 'CG Advisors LLC is a consulting firm specializing in product strategy, business transformation, and technology solutions — delivered with white-glove attention to detail. We partner with enterprises and founders to turn ambitious ideas into working software and the agentic systems that run them.',
      q: ['Our services', 'Your work', 'Talk to a human'] },

    { k: ['work', 'case stud', 'portfolio', 'project', 'client', 'example'],
      a: 'A few recent projects:\n\n• A financial analytics dashboard for an international financial institution\n• A mobile app for a dental laboratory services company\n• An eCommerce solution for a personal-services startup\n\nWant to discuss something similar?',
      q: ['Talk to a human'] },

    { k: ['stack', 'technologies', 'tools', 'languages', 'framework'],
      a: 'Our toolkit includes TypeScript, React, Next.js, Node, Python, PostgreSQL, Inngest, Vercel, GitHub, MCP, and Claude Code.' },

    { k: ['where', 'located', 'location', 'based', 'office', 'address', 'washington'],
      a: 'We’re based in Washington, DC.' },

    { k: ['contact', 'email', 'reach', 'get in touch', 'phone', 'number'],
      a: 'You can email us at info@cgadvisorsgroup.com or use the contact form on this page. I can also have someone call you — just tap below.',
      q: ['Talk to a human'] },

    { k: ['price', 'pricing', 'cost', 'rate', 'how much', 'budget', 'quote', 'fee'],
      a: 'Every engagement is scoped individually, so the best next step is a quick conversation. Want someone to reach out?',
      q: ['Talk to a human'] },

    { k: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'],
      a: 'Hi! I’m the CG Advisors assistant. I can answer quick questions about what we do, or connect you with a person. What would you like to know?',
      q: ['What do you do?', 'Our services', 'Talk to a human'] },

    { k: ['thank', 'appreciate', 'cheers'],
      a: 'You’re welcome! Anything else I can help with?',
      q: ['Our services', 'Talk to a human'] }
  ];

  var FALLBACK = {
    a: 'I’m a simple assistant, so I may not have caught that. I can tell you about CG Advisors’ services, or connect you with a person.',
    q: ['Our services', 'Talk to a human']
  };

  var GREETING = FAQ.filter(function (f) { return f.k.indexOf('hi') !== -1; })[0];

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

  function matchFAQ(text) {
    var t = norm(text);
    for (var i = 0; i < FAQ.length; i++) {
      for (var j = 0; j < FAQ[i].k.length; j++) {
        if (t.indexOf(FAQ[i].k[j]) !== -1) return FAQ[i];
      }
    }
    return null;
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

    var hit = matchFAQ(text);
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
    els.input.focus();
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
      '#cga-cb-launch{position:fixed;right:16px;bottom:20px;width:60px;height:60px;border-radius:50%;',
      'background:' + C.accent + ';color:' + C.ink + ';border:none;cursor:pointer;z-index:2147483000;',
      'box-shadow:0 8px 24px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;transition:transform .15s ease}',
      '#cga-cb-launch:hover{transform:scale(1.06)}',
      '#cga-cb-launch svg{width:28px;height:28px}',
      '#cga-cb-panel{position:fixed;right:16px;bottom:90px;z-index:2147483000;',
      'width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));',
      'background:' + C.panel + ';border:1px solid ' + C.line + ';border-radius:18px;overflow:hidden;',
      'display:none;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.55);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
      '#cga-cb-panel.cga-cb-open{display:flex}',
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
