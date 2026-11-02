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
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    if (data.success === true || data.success === "true") {
      status.textContent = "Your message has been submitted to the newsroom.";
      form.reset();
    } else {
      status.textContent = "The newsroom could not confirm delivery. Please try again later.";
    }
  } catch (error) {
    status.textContent = "The newsroom message service is unavailable. Please try again later.";
  } finally {
    button.disabled = false;
    button.textContent = "Send message";
  }
});
})();