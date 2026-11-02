(function(){
"use strict";
var form=document.getElementById("contact-form");
var status=document.getElementById("contact-status");
if(!form)return;
form.addEventListener("submit",function(event){
  event.preventDefault();
  if(!form.reportValidity())return;
  var name=document.getElementById("sender-name").value.trim();
  var email=document.getElementById("sender-email").value.trim();
  var subject=document.getElementById("sender-topic").value;
  var message=document.getElementById("sender-message").value.trim();
  if(!name||!email||!message){
    if(status)status.textContent="Please complete your name, email address and message.";
    return;
  }
  var recipient="housatonic-ledger.newsdesk@gmail.com";
  var mailSubject="The Housatonic Ledger — "+subject;
  var mailBody="From: "+name+"\nReply address: "+email+"\nCategory: "+subject+"\n\n"+message;
  var draft="mailto:"+recipient+"?subject="+encodeURIComponent(mailSubject)+"&body="+encodeURIComponent(mailBody);
  if(status)status.textContent="Opening your email application to send this message.";
  window.location.href=draft;
});
})();