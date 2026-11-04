(async()=>{const root=document.getElementById("feed-items"),note=document.getElementById("feed-status");if(!root||!note)return;try{let res=await fetch("/feeds.json",{cache:"no-store"});if(!res.ok)throw new Error("Unavailable");let json=await res.json();if(!Array.isArray(json.items)||json.items.length===0)throw new Error("No cached headlines");root.replaceChildren();json.items.slice(0,6).forEach(item=>{if(!/^https:\/\//.test(item.url))return;let col=document.createElement("div");col.className="wireitem";let src=document.createElement("span");src.textContent=item.source;let link=document.createElement("a");link.href=item.url;link.rel="noopener noreferrer external";link.target="_blank";link.textContent=item.title;col.append(src,link);root.append(col)});note.textContent="External RSS headlines last refreshed: "+(json.updated_at?new Date(json.updated_at).toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}):"not available")+". Original sources retain editorial responsibility."}catch(e){note.textContent="Live RSS cache is unavailable. Use the links above for news from the original publishers."}})();
/* Four town-specific feeds are cached by GitHub Actions. Never inject RSS HTML. */
(async()=>{
  const nodes=[...document.querySelectorAll("[data-town-items]")];
  const status=document.getElementById("town-wire-status");
  if(!nodes.length||!status)return;
  try{
    const res=await fetch("/local-feeds.json",{cache:"no-store"});
    if(!res.ok)throw new Error("Local cache unavailable");
    const data=await res.json();
    const towns=data&&data.towns||{};
    let count=0;
    for(const root of nodes){
      const id=root.getAttribute("data-town-items");
      const entries=towns[id]&&Array.isArray(towns[id].items)?towns[id].items:[];
      const clean=entries.filter(item=>item&&typeof item.title==="string"&&typeof item.url==="string"&&/^https:\/\//i.test(item.url)).slice(0,4);
      if(!clean.length)continue; // Retain a clear publisher-link fallback.
      root.replaceChildren();
      for(const item of clean){
        const row=document.createElement("div");row.className="town-wire-item";
        const link=document.createElement("a");
        link.href=item.url;link.textContent=item.title;link.target="_blank";link.rel="noopener noreferrer external";
        const source=document.createElement("span");source.className="town-wire-source";
        let label=typeof item.source==="string"?item.source:"External reporting";
        if(item.published_at){
          const d=new Date(item.published_at);
          if(!Number.isNaN(d.getTime()))label+=" · "+d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
        }
        source.textContent=label;row.append(link,source);root.append(row);
        count++;
      }
    }
    const stamp=data.updated_at?new Date(data.updated_at):null;
    const updated=stamp&&!Number.isNaN(stamp.getTime())?stamp.toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}):"not available";
    status.textContent=count?("External local headlines refreshed: "+updated+". Titles and reporting belong to their original publishers."):("No recent local headlines are cached. Use each town's “More news” link for current external coverage.");
  }catch(error){
    status.textContent="The town RSS cache is temporarily unavailable. Each town's “More news” link opens current reporting.";
  }
})();
