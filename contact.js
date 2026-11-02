(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  var status = document.getElementById("contact-status");
  var actions = document.getElementById("contact-actions");
  var emailLink = document.getElementById("contact-mail-link");
  var gmailLink = document.getElementById("contact-gmail-link");
  if (!form || !status || !actions || !emailLink || !gmailLink) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var name = document.getElementById("sender-name").value.trim();
    var email = document.getElementById("sender-email").value.trim();
    var subject = document.getElementById("sender-topic").value;
    var message = document.getElementById("sender-message").value.trim();
    if (!name || !email || !message) {
      status.textContent = "Please complete your name, email address and message.";
      actions.hidden = true;
      return;
    }
    var to = "housatonic-ledger.newsdesk@gmail.com";
    var title = "The Housatonic Ledger — " + subject;
    var body = "From: " + name + "\nReply address: " + email +
               "\nCategory: " + subject + "\n\n" + message;
    emailLink.href = "mailto:" + to + "?subject=" + encodeURIComponent(title) +
                     "&body=" + encodeURIComponent(body);
    gmailLink.href = "https://mail.google.com/mail/?view=cm&fs=1&to=" +
                     encodeURIComponent(to) + "&su=" + encodeURIComponent(title) +
                     "&body=" + encodeURIComponent(body);
    actions.hidden = false;
    status.textContent = "Your email draft is ready. Select an email option above. No message has been sent yet.";
  });
})();