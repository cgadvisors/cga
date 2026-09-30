/**
 * CG Advisors — contact form handler (Google Apps Script web app)
 *
 * Receives a JSON POST from the website contact form and emails the
 * contents to info@cgadvisorsgroup.com from your Google Workspace account.
 *
 * DEPLOY
 *   1. https://script.google.com  ->  New project
 *   2. Paste this file's contents into Code.gs (replace the default).
 *   3. Deploy  ->  New deployment  ->  type: "Web app"
 *        - Description:        CGA contact form
 *        - Execute as:         Me  (log in as the account you want mail to come FROM,
 *                                   ideally info@cgadvisorsgroup.com or a Workspace admin)
 *        - Who has access:     Anyone
 *   4. Deploy  ->  Authorize access  ->  allow the Gmail/Send-email scope.
 *   5. Copy the Web app URL that ends in /exec  and send it back to wire up the form.
 *
 * To change the code later you must create a NEW version:
 *   Deploy -> Manage deployments -> (edit) -> Version: New version -> Deploy.
 * The /exec URL stays the same across new versions.
 */

var TO_ADDRESS = 'info@cgadvisorsgroup.com';
var SUBJECT = 'New contact form submission — cgadvisorsgroup.com';

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // Honeypot: real users leave this empty; bots fill every field.
    if (data.website) {
      return _json({ ok: true }); // silently accept, send nothing
    }

    var name = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    var body = [
      'First name:  ' + (data.firstName || '—'),
      'Last name:   ' + (data.lastName  || '—'),
      'Company:     ' + (data.company   || '—'),
      'Title:       ' + (data.title     || '—'),
      'Email:       ' + (data.email     || '—'),
      'Phone:       ' + (data.phone     || '—'),
      '',
      'What are you looking for?',
      (data.lookingFor || '—'),
      '',
      '— Sent from the cgadvisorsgroup.com contact form.'
    ].join('\n');

    var options = { name: 'CGA Website' };
    if (data.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      options.replyTo = data.email; // reply goes straight to the submitter
    }

    MailApp.sendEmail(TO_ADDRESS, SUBJECT + (name ? ' — ' + name : ''), body, options);
    return _json({ ok: true });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

// Simple GET so visiting the URL in a browser confirms the deployment is live.
function doGet() {
  return _json({ ok: true, service: 'cga-contact-form' });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
