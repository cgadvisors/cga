/**
 * CG Advisors — contact form handler (Google Apps Script web app)
 *
 * Receives a JSON POST from the website contact form and emails a styled
 * HTML notification (site dark theme + green accent + logo) to
 * info@cgadvisorsgroup.com, with reply-to set to the submitter.
 *
 * DEPLOY / REDEPLOY
 *   Editing this code requires a NEW version to go live:
 *     Deploy -> Manage deployments -> (pencil/Edit) -> Version: New version -> Deploy.
 *   The /exec URL stays the same. "Who has access" must remain "Anyone".
 */

var TO_ADDRESS   = 'info@cgadvisorsgroup.com';
var SUBJECT_TAG  = '[CGA Web Lead]';
var SENDER_NAME  = 'CGA Website';

// Brand palette (converted from the site's oklch theme to hex for email clients).
var C = {
  bg:'#080b10', bg2:'#13171e', fg:'#f3f5f8', muted:'#9199a5',
  line:'#414853', accent:'#53de73'
};

// Nav logo (PNG), embedded so it renders inline via CID without external hosting.
var LOGO_B64 = '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';

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // Honeypot: humans leave this empty; bots fill it. Accept quietly, send nothing.
    if (data.website) {
      return _json({ ok: true });
    }

    // Chatbot "talk to a human" request: phone number + inquiry topic.
    if (data.type === 'chat_handoff') {
      return _chatHandoff(data);
    }

    var name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    var subject = SUBJECT_TAG + (name ? ' ' + name : ' New submission');

    var validEmail = data.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email);

    var options = {
      name: SENDER_NAME,
      htmlBody: _html(data, name, validEmail),
      noReply: false
    };
    if (validEmail) options.replyTo = data.email;

    MailApp.sendEmail(TO_ADDRESS, subject, _plain(data), _merge(options, {
      inlineImages: { cgaLogo: Utilities.newBlob(Utilities.base64Decode(LOGO_B64), 'image/png', 'logo.png') }
    }));

    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return _json({ ok: true, service: 'cga-contact-form' });
}

/* ---------- chatbot: talk-to-a-human handoff ---------- */

function _chatHandoff(data) {
  var phone = (data.phone == null ? '' : String(data.phone)).trim();
  var topic = (data.topic == null ? '' : String(data.topic)).trim();
  if (!phone) return _json({ ok: false, error: 'missing phone' });

  var subject = SUBJECT_TAG + ' Live agent request' + (topic ? ' — ' + topic : '');
  var when = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");

  var plain = [
    'Live agent request — cgadvisorsgroup.com chat', '',
    'Phone:  ' + phone,
    'Topic:  ' + (topic || '-'),
    'Time:   ' + when,
    '', 'The visitor used the website chat to ask for a callback from a person.'
  ].join('\n');

  MailApp.sendEmail(TO_ADDRESS, subject, plain, {
    name: SENDER_NAME,
    htmlBody: _handoffHtml(phone, topic, when),
    inlineImages: { cgaLogo: Utilities.newBlob(Utilities.base64Decode(LOGO_B64), 'image/png', 'logo.png') }
  });

  return _json({ ok: true });
}

function _handoffHtml(phone, topic, when) {
  var F = "'Space Grotesk', Arial, Helvetica, sans-serif";
  var B = "Arial, Helvetica, sans-serif";
  var telHref = 'tel:' + phone.replace(/[^0-9+]/g, '');
  return ''
+ '<!doctype html><html><body style="margin:0; padding:0; background:' + C.bg + ';">'
+ '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '; padding:24px 12px;"><tr><td align="center">'
+   '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:' + C.bg2 + '; border:1px solid ' + C.line + '; border-radius:16px;">'
+     '<tr><td style="padding:26px 30px 6px 30px;">'
+       '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
+         '<td align="left" style="vertical-align:middle;">'
+           '<img src="cid:cgaLogo" width="32" height="32" alt="CG Advisors" style="display:inline-block; vertical-align:middle; border:0;">'
+           '<span style="font-family:' + F + '; font-size:18px; font-weight:700; color:' + C.fg + '; vertical-align:middle; padding-left:10px;">CG Advisors</span>'
+         '</td>'
+         '<td align="right" style="vertical-align:middle;">'
+           '<span style="font-family:' + F + '; font-size:11px; letter-spacing:1px; color:' + C.accent + '; border:1px solid ' + C.line + '; border-radius:100px; padding:5px 12px; white-space:nowrap;">LIVE AGENT REQUEST</span>'
+         '</td>'
+       '</tr></table>'
+     '</td></tr>'
+     '<tr><td style="padding:12px 30px 2px 30px;">'
+       '<div style="font-family:' + F + '; font-size:23px; font-weight:700; color:' + C.fg + '; line-height:1.2;">Someone wants a callback</div>'
+       '<div style="font-family:' + B + '; font-size:14px; color:' + C.muted + '; padding-top:6px;">Requested through the website chat assistant.</div>'
+     '</td></tr>'
+     '<tr><td style="padding:16px 30px 0 30px;"><div style="border-top:1px solid ' + C.line + '; font-size:0; line-height:0;">&nbsp;</div></td></tr>'
+     '<tr><td style="padding:6px 30px 10px 30px;">'
+       '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:' + B + ';">'
+         '<tr><td style="padding:7px 0; font-size:13px; color:' + C.muted + '; width:130px; vertical-align:top;">Phone</td>'
+             '<td style="padding:7px 0; font-size:16px; color:' + C.fg + '; vertical-align:top;"><a href="' + telHref + '" style="color:' + C.accent + '; text-decoration:none; font-weight:700;">' + _esc(phone) + '</a></td></tr>'
+         '<tr><td style="padding:7px 0; font-size:13px; color:' + C.muted + '; width:130px; vertical-align:top;">Inquiry</td>'
+             '<td style="padding:7px 0; font-size:14px; color:' + C.fg + '; vertical-align:top;">' + (topic ? _esc(topic) : '<span style="color:' + C.muted + ';">-</span>') + '</td></tr>'
+         '<tr><td style="padding:7px 0; font-size:13px; color:' + C.muted + '; width:130px; vertical-align:top;">Received</td>'
+             '<td style="padding:7px 0; font-size:14px; color:' + C.fg + '; vertical-align:top;">' + _esc(when) + '</td></tr>'
+       '</table>'
+     '</td></tr>'
+     '<tr><td style="padding:10px 30px 24px 30px; border-top:1px solid ' + C.line + ';">'
+       '<div style="font-family:' + B + '; font-size:12px; color:' + C.muted + '; line-height:1.6;">'
+         'Call the number above to follow up.<br>'
+         'Sent from the <span style="color:' + C.accent + ';">cgadvisorsgroup.com</span> chat assistant'
+       '</div>'
+     '</td></tr>'
+   '</table>'
+ '</td></tr></table></body></html>';
}

/* ---------- email bodies ---------- */

function _plain(d) {
  return [
    'New website lead — cgadvisorsgroup.com', '',
    'First name:  ' + (d.firstName || '-'),
    'Last name:   ' + (d.lastName  || '-'),
    'Company:     ' + (d.company   || '-'),
    'Title:       ' + (d.title     || '-'),
    'Email:       ' + (d.email     || '-'),
    'Phone:       ' + (d.phone     || '-'),
    '', 'What they are looking for:', (d.lookingFor || '-'),
    '', '- Sent from the cgadvisorsgroup.com contact form.'
  ].join('\n');
}

function _html(d, name, validEmail) {
  var rows = ''
    + _row('First name', _esc(d.firstName))
    + _row('Last name',  _esc(d.lastName))
    + _row('Company',    _esc(d.company))
    + _row('Title',      _esc(d.title))
    + _row('Email', validEmail
        ? '<a href="mailto:' + _esc(d.email) + '" style="color:' + C.accent + '; text-decoration:none;">' + _esc(d.email) + '</a>'
        : _esc(d.email))
    + _row('Phone', d.phone
        ? '<a href="tel:' + _esc(String(d.phone).replace(/[^0-9+]/g, '')) + '" style="color:' + C.fg + '; text-decoration:none;">' + _esc(d.phone) + '</a>'
        : '<span style="color:' + C.muted + ';">-</span>');

  var message = d.lookingFor ? _esc(d.lookingFor).replace(/\n/g, '<br>') : '-';
  var when = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
  var replyName = name || (validEmail ? d.email : 'the sender');

  var F = "'Space Grotesk', Arial, Helvetica, sans-serif";
  var B = "Arial, Helvetica, sans-serif";

  return ''
+ '<!doctype html><html><body style="margin:0; padding:0; background:' + C.bg + ';">'
+ '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + '; padding:24px 12px;"><tr><td align="center">'
+   '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:' + C.bg2 + '; border:1px solid ' + C.line + '; border-radius:16px;">'
+     '<tr><td style="padding:26px 30px 6px 30px;">'
+       '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
+         '<td align="left" style="vertical-align:middle;">'
+           '<img src="cid:cgaLogo" width="32" height="32" alt="CG Advisors" style="display:inline-block; vertical-align:middle; border:0;">'
+           '<span style="font-family:' + F + '; font-size:18px; font-weight:700; color:' + C.fg + '; vertical-align:middle; padding-left:10px;">CG Advisors</span>'
+         '</td>'
+         '<td align="right" style="vertical-align:middle;">'
+           '<span style="font-family:' + F + '; font-size:11px; letter-spacing:1px; color:' + C.accent + '; border:1px solid ' + C.line + '; border-radius:100px; padding:5px 12px; white-space:nowrap;">CGA WEB LEAD</span>'
+         '</td>'
+       '</tr></table>'
+     '</td></tr>'
+     '<tr><td style="padding:12px 30px 2px 30px;">'
+       '<div style="font-family:' + F + '; font-size:23px; font-weight:700; color:' + C.fg + '; line-height:1.2;">New website lead</div>'
+       '<div style="font-family:' + B + '; font-size:14px; color:' + C.muted + '; padding-top:6px;">Someone reached out through the contact form.</div>'
+     '</td></tr>'
+     '<tr><td style="padding:16px 30px 0 30px;"><div style="border-top:1px solid ' + C.line + '; font-size:0; line-height:0;">&nbsp;</div></td></tr>'
+     '<tr><td style="padding:6px 30px 6px 30px;">'
+       '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:' + B + ';">' + rows + '</table>'
+     '</td></tr>'
+     '<tr><td style="padding:10px 30px 22px 30px;">'
+       '<div style="font-family:' + B + '; font-size:12px; letter-spacing:.5px; text-transform:uppercase; color:' + C.muted + '; padding-bottom:8px;">What they\'re looking for</div>'
+       '<div style="font-family:' + B + '; font-size:15px; color:' + C.fg + '; line-height:1.55; background:' + C.bg + '; border:1px solid ' + C.line + '; border-radius:12px; padding:14px 16px;">' + message + '</div>'
+     '</td></tr>'
+     '<tr><td style="padding:16px 30px 24px 30px; border-top:1px solid ' + C.line + ';">'
+       '<div style="font-family:' + B + '; font-size:12px; color:' + C.muted + '; line-height:1.6;">'
+         'Reply directly to this email to respond to ' + _esc(replyName) + '.<br>'
+         'Sent from the <span style="color:' + C.accent + ';">cgadvisorsgroup.com</span> contact form &middot; ' + when
+       '</div>'
+     '</td></tr>'
+   '</table>'
+ '</td></tr></table></body></html>';
}

function _row(label, valueHtml) {
  return '<tr>'
    + '<td style="padding:7px 0; font-size:13px; color:' + C.muted + '; width:130px; vertical-align:top;">' + label + '</td>'
    + '<td style="padding:7px 0; font-size:14px; color:' + C.fg + '; vertical-align:top;">' + (valueHtml || '<span style="color:' + C.muted + ';">-</span>') + '</td>'
    + '</tr>';
}

/* ---------- helpers ---------- */

function _esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _merge(a, b) { for (var k in b) a[k] = b[k]; return a; }

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
