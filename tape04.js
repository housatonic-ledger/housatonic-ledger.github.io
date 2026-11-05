(() => {
"use strict";
const trigger=document.getElementById("tape04-load");
const status=document.getElementById("tape04-status");
const audio=document.getElementById("tape04-player");
if(!trigger||!status||!audio) return;
const path="/media/parkson-72-10-12-tape04.mp3";
trigger.addEventListener("click",async()=>{
  trigger.disabled=true;
  status.textContent="Retrieving digitized transfer…";
  try{
    const response=await fetch(path,{method:"HEAD",cache:"no-store"});
    if(!response.ok) throw new Error("Transfer unavailable");
    audio.src=path;
    audio.hidden=false;
    audio.load();
    status.textContent="Listening copy · Mono · 01:40";
    trigger.hidden=true;
  }catch(e){
    status.textContent="The digitized transfer is not available in the present catalogue.";
    trigger.disabled=false;
  }
});
})();