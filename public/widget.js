(function () {
  if (window.__storeUpdateBannerLoaded) return;
  window.__storeUpdateBannerLoaded = true;

  function getScriptTag() {
    var script = document.currentScript;
    if (!script) {
      script = document.querySelector('script[src*="widget.js"]');
    }
    return script;
  }

  var bannerHeight = 40;

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".store-update-banner{" +
      "position:fixed;top:0;left:0;right:0;height:" +
      bannerHeight +
      "px;z-index:2147483647;background:#0f766e;color:#fff;border:none;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0 16px;font-family:'Avenir Next','Avenir','Futura','Gill Sans','Trebuchet MS',sans-serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;" +
      "}" +
      ".store-update-banner__inner{" +
      "white-space:nowrap;display:inline-block;animation:store-update-marquee 12s linear infinite;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:2px;" +
      "}" +
      ".store-update-banner--static .store-update-banner__inner{" +
      "animation:none;" +
      "}" +
      ".store-update-overlay{" +
      "position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:24px;z-index:2147483647;" +
      "}" +
      ".store-update-overlay.active{display:flex;}" +
      ".store-update-overlay__card{" +
      "background:#fff;color:#111;border-radius:24px;padding:24px;max-width:520px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.25);font-family:'Avenir Next','Avenir','Futura','Gill Sans','Trebuchet MS',sans-serif;" +
      "}" +
      ".store-update-overlay__title{" +
      "font-size:18px;font-weight:600;margin:0;" +
      "}" +
      ".store-update-overlay__message{" +
      "font-size:17px;line-height:1.6;margin-top:12px;color:#334155;" +
      "}" +
      ".store-update-overlay__close{" +
      "margin-top:16px;display:inline-flex;align-items:center;border:1px solid #e2e8f0;background:#fff;padding:6px 14px;border-radius:999px;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;color:#475569;cursor:pointer;" +
      "}" +
      "@keyframes store-update-marquee{" +
      "0%{transform:translateX(100%);}" +
      "100%{transform:translateX(-100%);}" +
      "}" +
      "@media (prefers-reduced-motion: reduce){.store-update-banner__inner{animation:none;}}";

    document.head.appendChild(style);
  }

  function ensureBodyPadding() {
    var body = document.body;
    if (!body) return;
    if (body.dataset.storeUpdatePadding) return;

    var currentPadding = 0;
    try {
      currentPadding = parseFloat(getComputedStyle(body).paddingTop) || 0;
    } catch (err) {
      currentPadding = 0;
    }

    body.dataset.storeUpdatePadding = String(currentPadding);
  }

  function setBannerVisible(banner, visible) {
    if (!banner) return;
    banner.style.display = visible ? "flex" : "none";

    var body = document.body;
    if (!body) return;
    var originalPadding = parseFloat(body.dataset.storeUpdatePadding || "0") || 0;
    body.style.paddingTop = visible ? originalPadding + bannerHeight + "px" : originalPadding + "px";
  }

  function isValidHexColor(value) {
    return /^#([0-9a-f]{3}){1,2}$/i.test(value || "");
  }

  function normalizeColor(value) {
    if (typeof value !== "string") return "#0f766e";
    var trimmed = value.trim();
    return isValidHexColor(trimmed) ? trimmed : "#0f766e";
  }

  function getReadableTextColor(hex) {
    var safe = isValidHexColor(hex) ? hex : "#0f766e";
    var normalized = safe.length === 4
      ? "#" + safe[1] + safe[1] + safe[2] + safe[2] + safe[3] + safe[3]
      : safe;

    var r = parseInt(normalized.slice(1, 3), 16) / 255;
    var g = parseInt(normalized.slice(3, 5), 16) / 255;
    var b = parseInt(normalized.slice(5, 7), 16) / 255;

    var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.6 ? "#0f172a" : "#ffffff";
  }

  function computeExpired(expiresAt) {
    if (!expiresAt) return false;
    var time = Date.parse(expiresAt);
    if (Number.isNaN(time)) return false;
    return time <= Date.now();
  }

  function createBanner() {
    var banner = document.createElement("button");
    banner.type = "button";
    banner.className = "store-update-banner";
    banner.setAttribute("aria-label", "Open announcement details");

    var inner = document.createElement("span");
    inner.className = "store-update-banner__inner";
    inner.textContent = "Loading announcement...";
    banner.appendChild(inner);

    return { banner: banner, inner: inner };
  }

  function createOverlay() {
    var overlay = document.createElement("div");
    overlay.className = "store-update-overlay";

    var card = document.createElement("div");
    card.className = "store-update-overlay__card";

    var title = document.createElement("h3");
    title.className = "store-update-overlay__title";
    title.textContent = "Store Update";

    var message = document.createElement("div");
    message.className = "store-update-overlay__message";
    message.textContent = "";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "store-update-overlay__close";
    close.textContent = "Close";

    close.addEventListener("click", function () {
      overlay.classList.remove("active");
    });

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) overlay.classList.remove("active");
    });

    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(close);
    overlay.appendChild(card);

    return { overlay: overlay, message: message };
  }

  function updateBanner(config, inner, banner, overlayMessage, overlay) {
    var message = config.message || "";
    var mode = config.mode === "static" ? "static" : "scroll";
    var color = normalizeColor(config.color);
    var expired = computeExpired(config.expiresAt);
    var hasMessage = message.trim().length > 0 && !expired;

    if (!hasMessage) {
      setBannerVisible(banner, false);
      overlay.classList.remove("active");
      return;
    }

    setBannerVisible(banner, true);
    banner.style.backgroundColor = color;
    banner.style.color = getReadableTextColor(color);
    inner.style.textDecorationColor = banner.style.color;

    inner.textContent = message;
    overlayMessage.textContent = message;

    if (mode === "static") {
      banner.classList.add("store-update-banner--static");
    } else {
      banner.classList.remove("store-update-banner--static");
    }
  }

  function readConfig() {
    var script = getScriptTag();
    if (!script) return { message: "", mode: "scroll", color: "#0f766e", expiresAt: "" };

    return {
      message: script.getAttribute("data-message") || "",
      mode: script.getAttribute("data-mode") || "scroll",
      color: script.getAttribute("data-color") || "#0f766e",
      expiresAt: script.getAttribute("data-expires") || ""
    };
  }

  function init() {
    injectStyles();
    ensureBodyPadding();

    var bannerParts = createBanner();
    var overlayParts = createOverlay();

    setBannerVisible(bannerParts.banner, false);

    bannerParts.banner.addEventListener("click", function () {
      overlayParts.overlay.classList.add("active");
    });

    document.body.appendChild(bannerParts.banner);
    document.body.appendChild(overlayParts.overlay);

    var config = readConfig();
    updateBanner(config, bannerParts.inner, bannerParts.banner, overlayParts.message, overlayParts.overlay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
