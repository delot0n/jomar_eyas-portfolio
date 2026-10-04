// ============================================================
// PROJECT DATA  (the ONLY place you edit to add / change projects)
//
// PROJECT SPACE is generated from this list. To add Project #5,
// #20 or #50, copy one entry, change the fields, and save.
// No HTML changes are needed: it appears automatically in the
// mode that matches its "category".
//
// FIELDS
//   id           unique, lowercase, no spaces (also the folder name)
//   name         project title
//   category     must be EXACTLY one of the three modes below
//   description  short summary shown under the title
//   tech         list of technologies, e.g. ["PHP", "MySQL", "JavaScript"]
//                (leave [] until confirmed: the UI shows "TO BE ADDED")
//   status       short label shown as the status badge
//   dummy        true = shows the [ DUMMY PROJECT ] label beside the title (list + details)
//   link         URL to open for "VIEW PROJECT". Leave "" to open the
//                in-page details window instead.
//   image        >>> MAIN PREVIEW IMAGE PATH <<<  (used in the carousel; 16:10 works best)
//   screenshots  extra images shown in the details window (optional)
//   art          1-4 = built-in placeholder drawing used until the real
//                image exists. Omit it for a plain grid placeholder.
//
// If an image file is missing, the placeholder stays visible, so
// nothing ever shows as a broken image.
// ============================================================

const PROJECT_MODES = ["WEB DESIGN", "WEB DEVELOPMENT", "FULL STACK"];

// Mode shown first when the page loads (must be one of the modes above).
const PROJECT_SPACE_DEFAULT_MODE = "FULL STACK";

const PROJECTS = [
  {
    id: "apex-metrics",
    name: "Apex Metrics Dashboard",
    category: "WEB DEVELOPMENT",
    description: "Real-time analytics platform focused on subscription metrics and user retention.",
    tech: [],
    status: "DEMO BUILD",
    dummy: true,
    link: "",
    image: "assets/projects/apex-metrics/main.jpg",
    screenshots: ["assets/projects/apex-metrics/original-full.jpg"],
    art: 1
  },
  {
    id: "studio-vanguard",
    name: "Studio Vanguard",
    category: "WEB DESIGN",
    description: "Minimalist portfolio and booking platform for a creative photography studio.",
    tech: [],
    status: "DEMO BUILD",
    dummy: true,
    link: "",
    image: "assets/projects/studio-vanguard/main.jpg",
    screenshots: ["assets/projects/studio-vanguard/original-full.jpg"],
    art: 2
  },
  {
    id: "lumina-health",
    name: "Lumina Health Platform",
    category: "FULL STACK",
    description: "Responsive patient portal featuring appointment scheduling and Telehealth integration.",
    tech: [],
    status: "DEMO BUILD",
    dummy: true,
    link: "",
    image: "assets/projects/lumina-health/main.jpg",
    screenshots: ["assets/projects/lumina-health/original-full.jpg"],
    art: 3
  },
  {
    id: "voyage-travel",
    name: "Voyage Travel Agency Website",
    category: "FULL STACK",
    description: "Modern responsive website designed for booking luxury staycations and custom vacation itineraries.",
    tech: [],
    status: "DEMO BUILD",
    dummy: true,
    link: "",
    image: "assets/projects/voyage-travel/main.jpg",
    screenshots: ["assets/projects/voyage-travel/original-full.jpg"],
    art: 4
  }
];
