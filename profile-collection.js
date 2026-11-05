/* Supplementary photographic index. No access phrase or original photo URLs in page source. */
(() => {
  "use strict";
  const form = document.getElementById("profile-collection-form");
  const field = document.getElementById("profile-collection-code");
  const status = document.getElementById("profile-collection-status");
  const results = document.getElementById("profile-collection-results");
  if (!form || !field || !status || !results) return;

  function decodeBase64(text) {
    const binary = atob(text.replace(/\s+/g, ""));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }

  async function decryptAsset(path, key) {
    const response = await fetch(path, {cache:"no-store"});
    if (!response.ok) throw new Error("Collection unavailable");
    const bytes = decodeBase64(await response.text());
    if (bytes.length < 29) throw new Error("Invalid archive data");
    return crypto.subtle.decrypt(
      {name:"AES-GCM",iv:bytes.slice(0,12)},
      key,
      bytes.slice(12)
    );
  }

  async function openCollection(phrase) {
    if (!window.crypto || !window.crypto.subtle) throw new Error("Web Crypto unavailable");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(phrase));
    const key = await crypto.subtle.importKey("raw", digest, {name:"AES-GCM"}, false, ["decrypt"]);

    const plain = await decryptAsset("/protected/photo-index.dat", key);
    const manifest = JSON.parse(new TextDecoder().decode(plain));
    if (!manifest || !Array.isArray(manifest.photos) || manifest.photos.length !== 9) {
      throw new Error("Invalid index");
    }
    const photos = manifest.photos.filter(photo =>
      photo && typeof photo.title === "string" &&
      typeof photo.caption === "string" &&
      typeof photo.src === "string" &&
      /^https:\/\/d2ol7oe51mr4n9\.cloudfront\.net\//.test(photo.src)
    );
    if (photos.length !== 9) throw new Error("Invalid index");
    // The earliest family scan was stored as encrypted image bytes, not an external link.
    try {
      const oldImage = await decryptAsset("/protected/collection.dat", key);
      const objectUrl = URL.createObjectURL(new Blob([oldImage], {type:"image/webp"}));
      photos.push({
        title:"Unidentified family portrait",
        caption:"Family collection · Undated scan",
        src:objectUrl
      });
    } catch (_) {
      // An earlier record may be missing or incompatible; other scans remain accessible.
    }
    return photos;
  }

  function makeElement(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.textContent = textContent;
    return el;
  }

  function createScan(photo, index) {
    const id = "profile-scan-" + index;
    const figure = makeElement("figure", "profile-collection-item");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = id;
    toggle.className = "profile-scan-toggle";
    toggle.setAttribute("aria-label", "Enlarge " + photo.title);

    const trigger = makeElement("label", "profile-scan-trigger");
    trigger.htmlFor = id;
    trigger.tabIndex = 0;
    trigger.setAttribute("role", "button");
    trigger.setAttribute("aria-label", "View " + photo.title + " at full size");
    const small = document.createElement("img");
    small.src = photo.src;
    small.alt = photo.title;
    small.loading = "lazy";
    small.decoding = "async";
    small.draggable = false;
    trigger.append(small);

    const caption = makeElement("figcaption", null, photo.caption);
    const overlay = makeElement("div", "profile-scan-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", photo.title);
    const panel = makeElement("div", "profile-scan-panel");
    const header = makeElement("div", "profile-scan-heading");
    header.append(makeElement("span", null, "Photographic archive / Enlarged scan"));
    const close = makeElement("label", "profile-scan-close", "Close ×");
    close.htmlFor = id;
    close.tabIndex = 0;
    close.setAttribute("role", "button");
    close.setAttribute("aria-label", "Close enlarged photograph");
    header.append(close);

    const large = document.createElement("img");
    large.src = photo.src;
    large.alt = photo.title;
    large.loading = "lazy";
    large.decoding = "async";
    large.draggable = false;
    panel.append(header, large, makeElement("p", "profile-scan-caption", photo.caption));
    overlay.append(panel);

    for (const label of [trigger, close]) {
      label.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle.checked = !toggle.checked;
        }
      });
    }
    figure.append(toggle, trigger, caption, overlay);
    return figure;
  }

  function display(photos) {
    results.replaceChildren(...photos.map(createScan));
    results.hidden = false;
    status.textContent = photos.length + " photographic records available.";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const phrase = field.value.trim().toLowerCase().replace(/\s+/g, "");
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
      status.textContent = error.name === "OperationError"
        ? "No matching reference set was found."
        : "The supplementary archive is temporarily unavailable.";
    } finally {
      button.disabled = false;
    }
  });
})();
