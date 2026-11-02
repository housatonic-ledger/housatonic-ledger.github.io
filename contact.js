(function () {
"use strict";
const form = document.getElementById("contact-form");
const status = document.getElementById("contact-status");
const button = document.getElementById("contact-send");
if (!form || !status || !button) return;

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const name = document.getElementById("sender-name").value.trim();
  const email = document.getElementById("sender-email").value.trim();
  const topic = document.getElementById("sender-topic").value;
  const message = document.getElementById("sender-message").value.trim();
  const honey = document.getElementById("contact-website").value;
  if (honey) return;
  if (!name || !email || !message) {
    status.textContent = "Please complete the required fields.";
    return;
  }

  button.disabled = true;
  button.textContent = "Sending…";
  status.textContent = "Connecting to the newsroom…";

  const payload = {
    name: name,
    email: email,
    topic: topic,
    message: message,
    _subject: "The Housatonic Ledger — " + topic,
    _replyto: email,
    _url: "https://4141145n7330783w-ship-it.github.io/contact.html",
    _honey: honey
  };
  try {
    const response = await fetch(
      "https://formsubmit.co/ajax/contact.housatonicledger@gmail.com",
      {
        method: "POST",
        headers: {"Content-Type": "application/json", "Accept": "application/json"},
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json().catch(function(){return {};});
    if (response.ok && (data.success === true || data.success === "true")) {
      status.textContent = "Your message was accepted for processing by the newsroom.";
      form.reset();
    } else {
      var reason = typeof data.message === "string" ? data.message :
                   typeof data.error === "string" ? data.error : "";
      // Display a limited provider explanation if available (plain text, no markup).
      status.textContent = reason
        ? "The newsroom could not submit your message: " + reason.slice(0, 220)
        : "The newsroom could not accept your message at this time. Please try again later.";
    }
  } catch (error) {
    status.textContent = "The newsroom message service is unavailable. Please try again later.";
  } finally {
    button.disabled = false;
    button.textContent = "Send message";
  }
});
})();