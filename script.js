// ============================================
// SETUP
// Grab the elements we need once, at the top.
// ============================================
const root = document.documentElement;
const site = document.getElementById("site");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");

// Must match --glitch-time in style.css (1100ms)
const GLITCH_DURATION = 1100;

// Shorter, calmer glitch for visitors who prefer reduced motion
const GLITCH_DURATION_REDUCED = 450;

// True if the visitor asked their system for less motion
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Small helper: random number between min and max
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// ============================================
// THEME TOGGLE
// Change the website theme when the toggle is clicked.
// The theme is stored as data-theme="dark" or "light" on <html>.
// ============================================

// Apply a theme and update the label text.
function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeLabel.textContent = "SYSTEM // " + theme.toUpperCase();

  // Remember the choice (wrapped in try/catch in case storage is blocked)
  try {
    localStorage.setItem("theme", theme);
  } catch (error) {
    // Ignore: the theme just won't be remembered
  }
}

// Load the saved theme when the page opens.
try {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    applyTheme(savedTheme);
  }
} catch (error) {
  // Ignore: keep the default dark theme
}

let isSwitching = false; // stops double clicks during the effect

themeToggle.addEventListener("click", function () {
  if (isSwitching) {
    return;
  }

  const current = root.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  isSwitching = true;

  // The glitch hides the theme change. Reduced motion gets a shorter, calmer version.
  runGlitch(current, next, reducedMotion.matches);
});

// ============================================
// DIGITAL GLITCH TRANSITION
// The glitch is a TEMPORARY overlay made of copies of the page.
// The real page stays untouched underneath, and everything
// created here is removed again when the effect finishes.
//
// Timeline (1100ms):
//   0-150ms    Phase 1: RGB corruption (red copy right, cyan copy left)
//   150-400ms  Phase 2: screen tearing (slices move independently)
//   300-550ms  Phase 3: artifacts (bars, pixel blocks, scanlines, flicker)
//   400-650ms  Phase 4: whole-screen distortion (CSS, see .glitch-overlay)
//   500-700ms  Phase 5: the REAL theme is switched, during the corruption
//   700-1100ms Phase 6: recovery, then everything is removed
// ============================================
function runGlitch(oldTheme, newTheme, reduced) {
  const duration = reduced ? GLITCH_DURATION_REDUCED : GLITCH_DURATION;

  const overlay = document.createElement("div");
  overlay.className = reduced ? "glitch-overlay glitch-overlay--reduced" : "glitch-overlay";
  overlay.setAttribute("aria-hidden", "true");

  // Clean up all temporary glitch elements and make sure the new theme is applied.
  // It is safe to call more than once.
  function finish() {
    overlay.remove();

    if (root.getAttribute("data-theme") !== newTheme) {
      applyTheme(newTheme);
    }

    isSwitching = false;
  }

  let slices = [];

  try {
    // Create temporary RGB layers, tearing slices and artifacts
    slices = buildSlices(overlay, oldTheme, reduced);
    buildRgbLayers(overlay, oldTheme);

    if (!reduced) {
      buildBars(overlay);
      buildScanlines(overlay);
      buildNoise(overlay);
      buildFlash(overlay);
    }

    // Stop scrolling while the effect runs, so the page copies stay lined up
    overlay.addEventListener("wheel", function (event) {
      event.preventDefault();
    }, { passive: false });
    overlay.addEventListener("touchmove", function (event) {
      event.preventDefault();
    }, { passive: false });

    document.body.appendChild(overlay);
  } catch (error) {
    // If anything goes wrong, skip the effect but still switch the theme
    finish();
    return;
  }

  // Phase 3-5 flicker: each slice randomly shows the old or the new theme
  [0.46, 0.5, 0.54, 0.58].forEach(function (point) {
    setTimeout(function () {
      slices.forEach(function (slice) {
        const theme = Math.random() < 0.5 ? oldTheme : newTheme;
        slice.querySelector(".glitch-page").setAttribute("data-theme", theme);
      });
    }, duration * point);
  });

  // Phase 5: switch the REAL theme while the screen is heavily corrupted (~53%)
  setTimeout(function () {
    applyTheme(newTheme);
  }, duration * 0.53);

  // Phase 6: every slice shows the new theme, then the effects fade out (~64%)
  setTimeout(function () {
    slices.forEach(function (slice) {
      slice.querySelector(".glitch-page").setAttribute("data-theme", newTheme);
    });
  }, duration * 0.64);

  // Remove all temporary elements: the clean new theme remains
  setTimeout(finish, duration);

  // Safety net: if the page was throttled (for example a background tab),
  // make sure the overlay can never get stuck on screen.
  setTimeout(function () {
    if (overlay.isConnected) {
      finish();
    }
  }, duration + 1000);
}

// Make a copy of the page, positioned to match the current scroll.
// This is only a visual copy: ids are removed and it is never interactive.
function clonePage(theme) {
  const clone = site.cloneNode(true);

  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(function (element) {
    element.removeAttribute("id");
  });

  clone.className = "glitch-page";
  clone.setAttribute("data-theme", theme);
  clone.style.top = -window.scrollY + "px";
  return clone;
}

// Create horizontal screen-tearing slices: the screen is split into bands
// of random height. Each region of the screen behaves differently.
function buildSlices(overlay, theme, reduced) {
  const slices = [];
  let top = 0;

  while (top < 100) {
    const height = reduced ? random(20, 30) : random(5, 12);
    const bottom = Math.max(0, 100 - top - height);

    // Movement strength depends on where the band is on the screen
    let minShift = 50; // middle: hard tearing
    let maxShift = 150;

    if (top < 30) {
      minShift = 15; // top: smaller shifts, mostly RGB
      maxShift = 45;
    } else if (top > 66) {
      minShift = 25; // bottom: medium shifts (plus noise blocks)
      maxShift = 80;
    }

    if (reduced) {
      minShift = 4;
      maxShift = 12;
    }

    const slice = document.createElement("div");
    slice.className = "glitch-slice";
    slice.style.setProperty("--top", top + "%");
    slice.style.setProperty("--bottom", bottom + "%");

    // Some bands move left, some right, some a little up or down
    const direction = Math.random() < 0.5 ? -1 : 1;
    slice.style.setProperty("--dx", direction * random(minShift, maxShift) + "px");
    slice.style.setProperty("--dy", (reduced ? 0 : random(-14, 14)) + "px");
    slice.style.setProperty("--skew", (reduced ? 0 : random(-14, 14)) + "deg");
    slice.style.setProperty("--blink", !reduced && Math.random() < 0.3 ? 0 : 1); // some bands vanish briefly
    slice.style.setProperty("--delay", random(0, 60) + "ms"); // bands start at different times

    slice.appendChild(clonePage(theme));
    overlay.appendChild(slice);
    slices.push(slice);

    top += height;
  }

  return slices;
}

// Create temporary RGB layers: a red copy and a cyan copy of the page.
// CSS moves them in opposite directions (chromatic aberration).
function buildRgbLayers(overlay, theme) {
  ["red", "cyan"].forEach(function (color) {
    const layer = document.createElement("div");
    layer.className = "glitch-rgb glitch-rgb--" + color;
    layer.appendChild(clonePage(theme));
    overlay.appendChild(layer);
  });
}

// Add temporary digital artifacts: thin full-width bars that flash
// at random heights (300-560ms).
function buildBars(overlay) {
  const colors = ["#2f6bff", "#eef0f4", "#ff2a55", "#2fe0ff"];

  for (let i = 0; i < 10; i++) {
    const bar = document.createElement("div");
    bar.className = "glitch-bar";
    bar.style.top = random(0, 98) + "%";
    bar.style.height = random(2, 12) + "px";
    bar.style.setProperty("--bar-color", colors[i % colors.length]);
    bar.style.setProperty("--bx", random(-80, 80) + "px");
    bar.style.setProperty("--delay", random(300, 560) + "ms");
    overlay.appendChild(bar);
  }
}

// Fine horizontal scanlines across the whole screen.
function buildScanlines(overlay) {
  const scanlines = document.createElement("div");
  scanlines.className = "glitch-scanlines";
  overlay.appendChild(scanlines);
}

// Small random rectangles that look like broken pixels.
// Most of them land in the bottom third of the screen.
function buildNoise(overlay) {
  const noise = document.createElement("div");
  noise.className = "glitch-noise";
  const colors = ["#2f6bff", "#eef0f4", "#ff2a55", "#2fe0ff"];

  for (let i = 0; i < 48; i++) {
    const block = document.createElement("div");
    block.className = "glitch-block";
    block.style.left = random(0, 95) + "%";
    block.style.top = (i < 30 ? random(66, 98) : random(0, 95)) + "%";
    block.style.width = random(10, 130) + "px";
    block.style.height = random(3, 16) + "px";
    block.style.animationDelay = random(0, 110) + "ms";
    block.style.setProperty("--block-color", colors[i % colors.length]);
    noise.appendChild(block);
  }

  overlay.appendChild(noise);
}

// A layer that briefly inverts the colors a few times (screen flicker).
function buildFlash(overlay) {
  const flash = document.createElement("div");
  flash.className = "glitch-flash";
  overlay.appendChild(flash);
}

// ============================================
// MOBILE NAVIGATION
// The MENU button shows and hides the link list on small screens.
// ============================================
const menuButton = document.getElementById("menu-button");
const navLinks = document.getElementById("nav-links");

menuButton.addEventListener("click", function () {
  const isOpen = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});

// Close the menu after choosing a link
navLinks.addEventListener("click", function () {
  navLinks.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
});

// ============================================
// ACTIVE NAVIGATION LINK
// Highlights the nav link of the section currently on screen.
// ============================================
const sections = document.querySelectorAll("main section[id]");
const navAnchors = document.querySelectorAll(".nav__links a");

// Sections without their own nav link use the nearest one
const navMap = { process: "work", experience: "skills" };

const sectionObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const id = navMap[entry.target.id] || entry.target.id;

        navAnchors.forEach(function (link) {
          link.classList.toggle("active", link.getAttribute("href") === "#" + id);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" } // only counts the middle of the screen
);

sections.forEach(function (section) {
  sectionObserver.observe(section);
});

// ============================================
// SCROLL ANIMATIONS
// Elements with .reveal fade in when they enter the screen.
// The process timeline fills when it appears.
// ============================================
const revealObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target); // only animate once
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach(function (element) {
  revealObserver.observe(element);
});

const steps = document.getElementById("steps");

const stepsObserver = new IntersectionObserver(
  function (entries) {
    if (entries[0].isIntersecting) {
      steps.classList.add("active");
    }
  },
  { threshold: 0.4 }
);

stepsObserver.observe(steps);

// ============================================
// PROJECT SPACE
// Everything here is generated from PROJECTS in projects.js.
// Adding a project = adding one object there. Nothing in this
// file (or in index.html) has to change.
//
// State: `mode` (one of PROJECT_MODES) and `index` (position inside
// the projects of that mode). render() just re-positions slides.
// ============================================
const modal = document.getElementById("modal");

const ps = {
  modes: document.getElementById("ps-modes"),
  panel: document.getElementById("ps-panel"),
  stage: document.getElementById("ps-stage"),
  track: document.getElementById("ps-track"),
  empty: document.getElementById("ps-empty"),
  controls: document.getElementById("ps-controls"),
  info: document.getElementById("ps-info"),
  prev: document.getElementById("ps-prev"),
  next: document.getElementById("ps-next"),
  counter: document.getElementById("ps-counter"),
  progress: document.getElementById("ps-progress"),
  category: document.getElementById("ps-category"),
  title: document.getElementById("ps-title"),
  desc: document.getElementById("ps-desc"),
  tech: document.getElementById("ps-tech"),
  status: document.getElementById("ps-status"),
  link: document.getElementById("ps-link"),
  open: document.getElementById("ps-open"),
  live: document.getElementById("ps-live"),
  dummy: document.getElementById("ps-dummy"),
  note: document.getElementById("ps-note")
};

let psMode = PROJECT_MODES.indexOf(PROJECT_SPACE_DEFAULT_MODE) >= 0 ? PROJECT_SPACE_DEFAULT_MODE : PROJECT_MODES[0];
let psIndex = 0;
let psList = [];     // projects of the current mode
let psSlides = [];   // matching slide buttons

// Classification label + short disclaimer, driven by project.dummy in projects.js
const DUMMY_LABEL = "[ DUMMY PROJECT ]";
const DUMMY_NOTE = "Built for educational and portfolio purposes. No client, metrics or results are claimed.";

const pad2 = function (n) { return String(n).padStart(2, "0"); };

// Small DOM helper
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) { node.className = className; }
  if (text !== undefined) { node.textContent = text; }
  return node;
}

// ---- Mode buttons (WEB DESIGN / WEB DEVELOPMENT / FULL STACK) ----
function buildModes() {
  ps.modes.textContent = "";

  PROJECT_MODES.forEach(function (name) {
    const count = PROJECTS.filter(function (p) { return p.category === name; }).length;
    const tab = make("button", "ps__mode");
    tab.type = "button";
    tab.id = "ps-tab-" + name.toLowerCase().replace(/\s+/g, "-");
    tab.setAttribute("role", "tab");
    tab.dataset.mode = name;
    tab.appendChild(make("span", "", name));
    const small = make("small", "", pad2(count));
    small.setAttribute("aria-label", count + " projects");
    tab.appendChild(small);
    ps.modes.appendChild(tab);
  });
}

function updateModeButtons() {
  ps.modes.querySelectorAll(".ps__mode").forEach(function (tab) {
    const active = tab.dataset.mode === psMode;
    tab.setAttribute("aria-selected", active);
    tab.tabIndex = active ? 0 : -1;
    if (active) { ps.panel.setAttribute("aria-labelledby", tab.id); }
  });
}

// ---- One slide per project in the current mode ----
function buildSlide(project, i) {
  const slide = make("button", "ps-slide");
  slide.type = "button";
  slide.dataset.i = i;

  const frame = make("span", "ps-slide__frame");

  const bar = make("span", "ps-slide__bar label");
  bar.setAttribute("aria-hidden", "true");
  bar.appendChild(document.createElement("i"));
  bar.appendChild(document.createElement("i"));
  bar.appendChild(document.createElement("i"));
  bar.appendChild(make("em", "", project.id + ".edu"));
  frame.appendChild(bar);

  const view = make("span", "ps-slide__view");

  // Placeholder drawing (shown until the real image loads)
  const art = make("span", "ps-art" + (project.art ? " ps-art--" + project.art : ""));
  art.setAttribute("aria-hidden", "true");
  art.appendChild(document.createElement("span"));
  art.appendChild(document.createElement("span"));
  art.appendChild(document.createElement("span"));
  art.appendChild(document.createElement("span"));
  view.appendChild(art);

  view.appendChild(make("span", "ps-slide__pending label", "IMAGE PENDING"));
  frame.appendChild(view);
  slide.appendChild(frame);

  slide.appendChild(make("span", "ps-slide__tag label", pad2(i + 1) + " · " + project.name.toUpperCase()));

  slide._view = view;
  slide._loaded = false;
  return slide;
}

// Images load lazily, only for slides near the selection,
// so 50+ projects don't download 50 images at once.
function loadImage(slide, project) {
  if (slide._loaded || !project.image) { return; }
  slide._loaded = true;

  const img = new Image();
  img.className = "ps-slide__img";
  img.alt = project.name + " preview";
  img.decoding = "async";
  img.addEventListener("load", function () {
    slide._view.appendChild(img);
    // next frame so the fade-in transition runs
    requestAnimationFrame(function () { slide.classList.add("has-image"); });
    // the real image replaces the placeholder drawing entirely
    const art = slide._view.querySelector(".ps-art");
    if (art) { art.remove(); }
  });
  // On error nothing is added: the placeholder simply stays (no broken icon).
  img.src = project.image;
}

function buildSlides() {
  ps.track.textContent = "";
  psSlides = psList.map(function (project, i) {
    const slide = buildSlide(project, i);
    ps.track.appendChild(slide);
    return slide;
  });
}

// ---- Position slides + update counter and info ----
function render(announce) {
  const total = psList.length;
  const hasProjects = total > 0;

  ps.empty.hidden = hasProjects;
  ps.controls.hidden = !hasProjects;
  ps.info.hidden = !hasProjects;
  if (!hasProjects) { return; }

  psSlides.forEach(function (slide, i) {
    const offset = i - psIndex;
    const abs = Math.abs(offset);
    const project = psList[i];

    slide.style.setProperty("--o", Math.max(-2, Math.min(2, offset)));
    slide.classList.toggle("is-current", offset === 0);
    slide.classList.toggle("is-far", abs > 1);
    slide.tabIndex = abs > 1 ? -1 : 0;
    slide.setAttribute("aria-hidden", abs > 1 ? "true" : "false");

    if (abs <= 2) { loadImage(slide, project); }

    if (offset === 0) {
      slide.setAttribute("aria-label", project.name + ", project " + (i + 1) + " of " + total + ". Open details.");
    } else if (abs === 1) {
      slide.setAttribute("aria-label", (offset < 0 ? "Previous project: " : "Next project: ") + project.name);
    }
  });

  const current = psList[psIndex];

  ps.counter.textContent = pad2(psIndex + 1) + " / " + pad2(total);
  ps.progress.style.width = ((psIndex + 1) / total * 100) + "%";
  setNavState(ps.prev, psIndex === 0);
  setNavState(ps.next, psIndex === total - 1);

  ps.category.textContent = current.category;
  ps.title.textContent = current.name;
  ps.dummy.textContent = DUMMY_LABEL;
  ps.dummy.hidden = !current.dummy;
  ps.note.textContent = DUMMY_NOTE;
  ps.note.hidden = !current.dummy;
  ps.desc.textContent = current.description;
  ps.status.textContent = current.status;
  fillTech(ps.tech, current.tech);

  if (current.link) {
    ps.link.href = current.link;
    ps.link.hidden = false;
    ps.open.hidden = true;
  } else {
    ps.link.hidden = true;
    ps.open.hidden = false;
  }

  // Replay the small fade on the info panel
  ps.info.classList.remove("is-swapping");
  void ps.info.offsetWidth;
  ps.info.classList.add("is-swapping");

  if (announce) {
    ps.live.textContent = "Project " + (psIndex + 1) + " of " + total + ": " + current.name + ", " + current.category;
  }
}

// Side controls stay visible but inactive at the ends of a mode (aria-disabled, not disabled,
// so they remain in the layout and never throw an error when clicked).
function setNavState(button, inactive) {
  button.classList.toggle("is-inactive", inactive);
  button.setAttribute("aria-disabled", inactive ? "true" : "false");
}

// Technology list, or a clearly marked placeholder when none are set yet
function fillTech(node, tech) {
  const has = tech && tech.length > 0;
  node.textContent = has ? tech.join(" / ") : "TO BE ADDED";
  node.classList.toggle("is-tba", !has);
}

// ---- Navigation ----
function goTo(i) {
  const next = Math.max(0, Math.min(psList.length - 1, i));
  if (next === psIndex) { return; }
  psIndex = next;
  render(true);
}

function setMode(name, moveFocus) {
  if (name === psMode && psSlides.length) { return; }
  psMode = name;
  updateModeButtons();

  function swap() {
    psList = PROJECTS.filter(function (p) { return p.category === psMode; });
    psIndex = 0;
    buildSlides();
    render(true);
    ps.stage.classList.remove("is-switching");
  }

  if (reducedMotion.matches) {
    swap();
  } else {
    ps.stage.classList.add("is-switching");
    setTimeout(swap, 160);
  }

  if (moveFocus) {
    ps.modes.querySelector('[aria-selected="true"]').focus();
  }
}

// Mode tabs: click, plus Left / Right / Home / End
ps.modes.addEventListener("click", function (event) {
  const tab = event.target.closest(".ps__mode");
  if (tab) { setMode(tab.dataset.mode); }
});

ps.modes.addEventListener("keydown", function (event) {
  const tabs = Array.from(ps.modes.querySelectorAll(".ps__mode"));
  const at = tabs.findIndex(function (t) { return t.dataset.mode === psMode; });
  let to = -1;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") { to = (at + 1) % tabs.length; }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") { to = (at - 1 + tabs.length) % tabs.length; }
  if (event.key === "Home") { to = 0; }
  if (event.key === "End") { to = tabs.length - 1; }

  if (to >= 0) {
    event.preventDefault();
    setMode(tabs[to].dataset.mode, true);
  }
});

ps.prev.addEventListener("click", function () {
  if (swipeHandled || ps.prev.classList.contains("is-inactive")) { return; }
  goTo(psIndex - 1);
});
ps.next.addEventListener("click", function () {
  if (swipeHandled || ps.next.classList.contains("is-inactive")) { return; }
  goTo(psIndex + 1);
});

// Clicking a slide: neighbour -> select it, current -> open details
ps.track.addEventListener("click", function (event) {
  if (swipeHandled) { return; }
  const slide = event.target.closest(".ps-slide");
  if (!slide) { return; }
  const i = Number(slide.dataset.i);
  if (i === psIndex) { openProject(psList[i], i); } else { goTo(i); }
});

ps.open.addEventListener("click", function () {
  openProject(psList[psIndex], psIndex);
});

// Keyboard on the carousel (only while focus is inside it)
ps.stage.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") { event.preventDefault(); goTo(psIndex - 1); }
  if (event.key === "ArrowRight") { event.preventDefault(); goTo(psIndex + 1); }
  if (event.key === "Home") { event.preventDefault(); goTo(0); }
  if (event.key === "End") { event.preventDefault(); goTo(psList.length - 1); }
});

const psViewport = ps.stage.parentElement;

// Swipe (touch, pen or mouse drag). Vertical scrolling is left to the browser.
let swipeStart = null;
let swipeHandled = false;

psViewport.addEventListener("pointerdown", function (event) {
  if (event.pointerType === "mouse" && event.button !== 0) { return; }
  swipeStart = { x: event.clientX, y: event.clientY };
  swipeHandled = false;
});

psViewport.addEventListener("pointerup", function (event) {
  if (!swipeStart) { return; }
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;

  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    swipeHandled = true; // stops the click that follows a drag
    goTo(psIndex + (dx < 0 ? 1 : -1));
    setTimeout(function () { swipeHandled = false; }, 60);
  }
});

psViewport.addEventListener("pointercancel", function () { swipeStart = null; });

// Reveal zone: while a mouse is inside the outer third of the preview area, mark which
// side is "near" (CSS fades that control in). Only fires on mouse, only writes on change.
let psNear = "";

function setNear(side) {
  if (side === psNear) { return; }
  psNear = side;
  psViewport.dataset.near = side;
}

psViewport.addEventListener("pointermove", function (event) {
  if (event.pointerType !== "mouse") { return; }
  const box = psViewport.getBoundingClientRect();
  const ratio = (event.clientX - box.left) / box.width;
  setNear(ratio < 0.34 ? "left" : ratio > 0.66 ? "right" : "");
});

psViewport.addEventListener("pointerleave", function () { setNear(""); });

// ---- Project details window (the original <dialog>) ----
function openProject(project, i) {
  document.getElementById("modal-number").textContent = pad2(i + 1) + " / " + pad2(psList.length);
  document.getElementById("modal-category").textContent = project.category;
  document.getElementById("modal-title").textContent = project.name;
  document.getElementById("modal-description").textContent = project.description;
  document.getElementById("modal-status").textContent = project.status;
  const modalDummy = document.getElementById("modal-dummy");
  modalDummy.textContent = DUMMY_LABEL;
  modalDummy.hidden = !project.dummy;
  fillTech(document.getElementById("modal-tech"), project.tech);

  const modalLink = document.getElementById("modal-link");
  modalLink.hidden = !project.link;
  if (project.link) { modalLink.href = project.link; }

  // Main image + screenshots: only the ones that really load are shown
  const shots = document.getElementById("modal-shots");
  shots.textContent = "";
  [project.image].concat(project.screenshots || []).forEach(function (src, n) {
    if (!src) { return; }
    const img = new Image();
    img.alt = project.name + (n === 0 ? " preview" : " screenshot " + n);
    img.addEventListener("load", function () { shots.appendChild(img); });
    img.src = src;
  });

  modal.showModal();
}

document.getElementById("modal-close").addEventListener("click", function () {
  modal.close();
});

// Clicking the dark backdrop also closes the modal
modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.close();
  }
});

// Start
buildModes();
updateModeButtons();
psList = PROJECTS.filter(function (p) { return p.category === psMode; });
buildSlides();
render(false);

// ============================================
// HERO: AVATAR + COORDINATES
// The avatar image (assets/avatar/avatar.png) replaces the SVG
// placeholder only once it has actually loaded.
// The coordinate readout and slight window parallax are the
// original hero effects. The normal browser cursor is used everywhere.
// ============================================
const avatarImg = document.getElementById("avatar-img");

avatarImg.addEventListener("load", function () {
  avatarImg.hidden = false;
  document.getElementById("avatar-slot").classList.add("has-image");
});

if (avatarImg.complete && avatarImg.naturalWidth > 0) {
  avatarImg.dispatchEvent(new Event("load"));
}

const heroVisual = document.getElementById("hero-visual");
const heroWindow = document.getElementById("window");
const coords = document.getElementById("coords");

document.addEventListener("pointermove", function (event) {
  // Technical X/Y readout in the hero (padded to 3 digits)
  coords.textContent =
    "X:" + String(Math.round(event.clientX)).padStart(3, "0") +
    " Y:" + String(Math.round(event.clientY)).padStart(3, "0");

  // Hero parallax (desktop only)
  if (window.innerWidth > 900) {
    const box = heroVisual.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) / box.width;
    const y = (event.clientY - box.top - box.height / 2) / box.height;
    heroWindow.style.setProperty("--move-x", x * -14 + "px");
    heroWindow.style.setProperty("--move-y", y * -14 + "px");
  }
});

// Hero headline glitch: replay the small text glitch on hover
const heroTitle = document.getElementById("hero-title");

heroTitle.addEventListener("mouseenter", function () {
  heroTitle.style.animation = "none";
  void heroTitle.offsetWidth; // forces the browser to restart the animation
  heroTitle.style.animation = "text-glitch 0.35s steps(2) 1";
});

// ============================================
// CONTACT FORM
// There is no server, so the form opens the visitor's email app
// with the message filled in. Replace with a form service later if you like.
// ============================================
const form = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const data = new FormData(form);

  const subject = "Portfolio inquiry: " + data.get("type") + " (from " + data.get("name") + ")";
  const body =
    "Name: " + data.get("name") +
    "\nEmail: " + data.get("email") +
    "\nProject type: " + data.get("type") +
    "\n\nProject details:\n" + data.get("details");

  window.location.href =
    "mailto:eyasjomar1@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

  // Honest status: nothing is sent from the page itself, the visitor sends it from their email app.
  formMessage.textContent = "OPENING EMAIL CLIENT... If nothing opens, email eyasjomar1@gmail.com directly.";
});
