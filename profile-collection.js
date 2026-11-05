/* Photographic index decryption. The key is never stored in site source. */
(() => {
  "use strict";
  const form = document.getElementById("profile-collection-form");
  const field = document.getElementById("profile-collection-code");
  const status = document.getElementById("profile-collection-status");
  const results = document.getElementById("profile-collection-results");
  if (!form || !field || !status || !results) return;

  function decodeBase64(text) {
    const raw = atob(text.replace(/\s+/g, ""));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  }

  async function openCollection(password) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto unavailable");
    }
    const request = await fetch("/protected/collection.dat", {cache:"no-store"});
    if (!request.ok) throw new Error("Collection file unavailable");
    const encrypted = decodeBase64(await request.text());
    if (encrypted.length < 29) throw new Error("Corrupt index");
    const iv = encrypted.slice(0, 12);
    const ciphertext = encrypted.slice(12);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const key = await crypto.subtle.importKey("raw", digest, {name:"AES-GCM"}, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({name:"AES-GCM",iv},key,ciphertext);
    const family = URL.createObjectURL(new Blob([plain], {type:"image/webp"}));
    return [
      {title:"Unidentified family group", caption:"Family group portrait · Undated · Private collection",src:family},
      {title:"Uncatalogued exterior",caption:"House photograph · Date and photographer not recorded",src:"/parkson-house.jpg"},
      {title:"Foundation record",caption:"Reconstruction photograph · Reference 73-041",src:"https://parkson-archives.neocities.org/foundation-73-041.png"}
    ];
  }

  function display(photos) {
    results.replaceChildren();
    photos.slice(0,8).forEach((photo) => {
      if (!photo || !photo.title) return;
      let url = null;
      if (typeof photo.data === "string" && /^image\/(webp|jpeg|png)$/.test(photo.mime || "")) {
        url = "data:" + photo.mime + ";base64," + photo.data;
      } else if (typeof photo.src === "string" && (/^blob:https:\/\//.test(photo.src) || /^https:\/\//.test(photo.src) || /^\/(?!\/)/.test(photo.src))) {
        url = photo.src;
      }
      if (!url) return;
      const figure = document.createElement("figure");
      figure.className = "profile-collection-item";
      const picture = document.createElement("img");
      picture.src = url;
      picture.alt = String(photo.title);
      picture.loading = "lazy";
      picture.decoding = "async";
      const label = document.createElement("figcaption");
      label.textContent = String(photo.caption || photo.title);
      figure.append(picture,label);
      results.append(figure);
    });
    results.hidden = false;
    status.textContent = results.children.length + " photographic entries available.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const phrase = field.value.trim().toLowerCase().replace(/\s+/g,"");
    if (!phrase) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Retrieving index…";
    try {
      const photos = await openCollection(phrase);
      display(photos);
      field.value = "";
      form.hidden = true;
    } catch (error) {
      status.textContent = error.name === "OperationError" ? "No matching reference set was found." : "The supplementary archive is temporarily unavailable.";
    } finally {
      button.disabled = false;
    }
  });
})();
