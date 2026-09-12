const themeToggleBtn = document.getElementById("theme-toggle");
const toggleIcon = document.getElementById("toggle-icon");

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
  toggleIcon.classList.remove("fa-moon");
  toggleIcon.classList.add("fa-sun");
} else {
  document.documentElement.classList.remove("dark");
  toggleIcon.classList.remove("fa-sun");
  toggleIcon.classList.add("fa-moon");
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");

  if (isDark) {
    localStorage.setItem("theme", "dark");

    toggleIcon.classList.remove("fa-moon");
    toggleIcon.classList.add("fa-sun");
  } else {
    localStorage.setItem("theme", "light");

    toggleIcon.classList.remove("fa-sun");
    toggleIcon.classList.add("fa-moon");
  }

  draw(performance.now());
});

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const closeMenuBtn = document.getElementById("close-menu-btn");
const mobileOverlay = document.getElementById("mobile-overlay");
const mobileLinks = document.querySelectorAll(".mobile-link");

function openMenu() {
  mobileOverlay.classList.remove(
    "pointer-events-none",
    "opacity-0",
    "translate-x-full",
  );

  mobileOverlay.classList.add(
    "pointer-events-auto",
    "opacity-100",
    "translate-x-0",
  );

  document.body.style.overflow = "hidden";
}

function closeMenu() {
  mobileOverlay.classList.remove(
    "pointer-events-auto",
    "opacity-100",
    "translate-x-0",
  );

  mobileOverlay.classList.add(
    "pointer-events-none",
    "opacity-0",
    "translate-x-full",
  );

  document.body.style.overflow = "";
}

mobileMenuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);

mobileLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// ==========================================
// KINETIC GRID BACKGROUND
// Converted from the React component
// ==========================================

const canvas = document.getElementById("kinetic-grid");
const ctx = canvas.getContext("2d");

// ------------------------------------------
// SETTINGS
// ------------------------------------------

const CELL_SIZE = 55;
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 24;
const LERP_SPEED = 0.08;

const NODE_BASE_RADIUS = 1.8;
const NODE_ACTIVE_RADIUS = 3.2;

// ------------------------------------------
// MOUSE
// ------------------------------------------

const mouse = {
  x: -9999,
  y: -9999,
};

const targetMouse = {
  x: -9999,
  y: -9999,
};

// ------------------------------------------
// RIPPLE STORAGE
// ------------------------------------------

const ripples = [];

// ------------------------------------------
// CANVAS SIZE
// ------------------------------------------

let width = 0;
let height = 0;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

// ------------------------------------------
// MOUSE MOVEMENT
// ------------------------------------------

window.addEventListener("mousemove", (event) => {
  targetMouse.x = event.clientX;
  targetMouse.y = event.clientY;
});

// ------------------------------------------
// CLICK RIPPLE
// ------------------------------------------

window.addEventListener("click", (event) => {
  ripples.push({
    x: event.clientX,
    y: event.clientY,
    radius: 0,
    opacity: 1,
    born: performance.now(),
  });
});

// ------------------------------------------
// LINE COLOR
// ------------------------------------------

function getLineColor(activeAmount) {
  const dark = document.documentElement.classList.contains("dark");

  // Your portfolio lime
  const lime = {
    r: 195,
    g: 216,
    b: 9,
  };

  // Normal grid color
  const base = dark
    ? { r: 255, g: 255, b: 255, a: 0.07 }
    : { r: 71, g: 85, b: 105, a: 0.06 };

  const active = {
    r: lime.r,
    g: lime.g,
    b: lime.b,
    a: 0.85,
  };

  const r = Math.round(base.r + (active.r - base.r) * activeAmount);

  const g = Math.round(base.g + (active.g - base.g) * activeAmount);

  const b = Math.round(base.b + (active.b - base.b) * activeAmount);

  const a = base.a + (active.a - base.a) * activeAmount;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ------------------------------------------
// NODE COLOR
// ------------------------------------------

function getNodeColor(activeAmount) {
  const dark = document.documentElement.classList.contains("dark");

  const base = dark
    ? { r: 255, g: 255, b: 255, a: 0.07 }
    : { r: 71, g: 85, b: 105, a: 0.06 };

  const active = {
    r: 195,
    g: 216,
    b: 9,
    a: 1,
  };

  const r = Math.round(base.r + (active.r - base.r) * activeAmount);

  const g = Math.round(base.g + (active.g - base.g) * activeAmount);

  const b = Math.round(base.b + (active.b - base.b) * activeAmount);

  const a = base.a + (active.a - base.a) * activeAmount;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ------------------------------------------
// WARP CALCULATION
// ------------------------------------------

function getWarpedPoint(gx, gy, col, row, mouse, ripples, cols, rows) {
  // Keep the outside edges stable
  const edgeMargin = 1.5;

  const colPin = Math.min(col / edgeMargin, (cols - 1 - col) / edgeMargin, 1);

  const rowPin = Math.min(row / edgeMargin, (rows - 1 - row) / edgeMargin, 1);

  const pinFactor = colPin * colPin * rowPin * rowPin;

  // ----------------------------------------
  // Distance from cursor
  // ----------------------------------------

  const dx = gx - mouse.x;
  const dy = gy - mouse.y;

  const dist = Math.sqrt(dx * dx + dy * dy);

  const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pinFactor;

  // ----------------------------------------
  // CLICK RIPPLE WARP
  // ----------------------------------------

  let rx = 0;
  let ry = 0;

  for (const ripple of ripples) {
    const rdx = gx - ripple.x;
    const rdy = gy - ripple.y;

    const rdist = Math.sqrt(rdx * rdx + rdy * rdy);

    const waveWidth = 55;

    const difference = rdist - ripple.radius;

    if (Math.abs(difference) < waveWidth) {
      const strength =
        (1 - Math.abs(difference) / waveWidth) *
        ripple.opacity *
        18 *
        pinFactor;

      const angle = Math.atan2(rdy, rdx);

      const sign = difference < 0 ? -1 : 1;

      rx += Math.cos(angle) * strength * sign * -1;

      ry += Math.sin(angle) * strength * sign * -1;
    }
  }

  // ----------------------------------------
  // CURSOR WARP
  // ----------------------------------------

  if (dist < INFLUENCE_RADIUS && dist > 0 && pinFactor > 0) {
    const t = dist / INFLUENCE_RADIUS;

    const eased = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);

    const warpAmount = eased * MAX_WARP * pinFactor;

    const angle = Math.atan2(dy, dx);

    return {
      x: gx - Math.cos(angle) * warpAmount + rx,

      y: gy - Math.sin(angle) * warpAmount + ry,

      proximity,
    };
  }

  return {
    x: gx + rx,
    y: gy + ry,
    proximity,
  };
}

// ------------------------------------------
// DRAW GRID
// ------------------------------------------
function draw(now) {
  const dark = document.documentElement.classList.contains("dark");

  ctx.fillStyle = dark ? "#161618" : "#ffffff";
  ctx.fillRect(0, 0, width, height);
  // ----------------------------------------
  // UPDATE RIPPLE
  // ----------------------------------------

  for (let i = ripples.length - 1; i >= 0; i--) {
    const ripple = ripples[i];

    const age = (now - ripple.born) / 1000;

    ripple.radius = Math.max(0, age * 400);

    ripple.opacity = Math.max(0, 1 - age * 1.2);

    if (ripple.opacity <= 0) {
      ripples.splice(i, 1);
    }
  }

  // ----------------------------------------
  // GRID SIZE
  // ----------------------------------------

  const cols = Math.max(2, Math.ceil(width / CELL_SIZE)) + 1;

  const rows = Math.max(2, Math.ceil(height / CELL_SIZE)) + 1;

  const cellW = width / (cols - 1);

  const cellH = height / (rows - 1);

  // ----------------------------------------
  // GRID POINTS
  // ----------------------------------------

  const points = [];
  const proximity = [];

  for (let row = 0; row < rows; row++) {
    points[row] = [];
    proximity[row] = [];

    for (let col = 0; col < cols; col++) {
      const point = getWarpedPoint(
        col * cellW,
        row * cellH,
        col,
        row,
        mouse,
        ripples,
        cols,
        rows,
      );

      points[row][col] = {
        x: point.x,
        y: point.y,
      };

      proximity[row][col] = point.proximity;
    }
  }

  // ----------------------------------------
  // GRID LINES
  // ----------------------------------------

  function drawSegment(p1, p2, proximity1, proximity2) {
    const average = (proximity1 + proximity2) / 2;

    // Smoothstep
    const t = average * average * (3 - 2 * average);

    ctx.beginPath();

    ctx.moveTo(p1.x, p1.y);

    ctx.lineTo(p2.x, p2.y);

    ctx.strokeStyle = getLineColor(t);

    ctx.lineWidth = 0.8 + (1.5 - 0.8) * t;

    ctx.stroke();
  }

  ctx.lineCap = "butt";

  // Horizontal lines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      drawSegment(
        points[row][col],
        points[row][col + 1],
        proximity[row][col],
        proximity[row][col + 1],
      );
    }
  }

  // Vertical lines
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      drawSegment(
        points[row][col],
        points[row + 1][col],
        proximity[row][col],
        proximity[row + 1][col],
      );
    }
  }

  // ----------------------------------------
  // INTERSECTION NODES
  // ----------------------------------------

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const point = points[row][col];

      const prox = proximity[row][col];

      const t = prox * prox * (3 - 2 * prox);

      const radius =
        NODE_BASE_RADIUS + (NODE_ACTIVE_RADIUS - NODE_BASE_RADIUS) * t;

      // ------------------------------------
      // LIME GLOW
      // ------------------------------------

      if (t > 0.3) {
        const glowRadius = radius + 6 * ((t - 0.3) / 0.7);

        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          radius * 0.5,
          point.x,
          point.y,
          glowRadius,
        );

        gradient.addColorStop(0, `rgba(195,216,9,${(t * 0.3).toFixed(3)})`);

        gradient.addColorStop(1, "rgba(195,216,9,0)");

        ctx.beginPath();

        ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);

        ctx.fillStyle = gradient;

        ctx.fill();
      }

      // ------------------------------------
      // NODE
      // ------------------------------------

      ctx.beginPath();

      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

      ctx.fillStyle = getNodeColor(t);

      ctx.fill();
    }
  }

  // ----------------------------------------
  // RIPPLE RINGS
  // ----------------------------------------

  for (const ripple of ripples) {
    const radius = Math.max(0, ripple.radius);

    ctx.beginPath();

    ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);

    ctx.strokeStyle = `rgba(195,216,9,${(ripple.opacity * 0.28).toFixed(3)})`;

    ctx.lineWidth = 1.5;

    ctx.stroke();
  }
}

// ------------------------------------------
// ANIMATION LOOP
// ------------------------------------------

function animate(now) {
  mouse.x = mouse.x + (targetMouse.x - mouse.x) * LERP_SPEED;

  mouse.y = mouse.y + (targetMouse.y - mouse.y) * LERP_SPEED;

  draw(now);

  requestAnimationFrame(animate);
}

// Start
requestAnimationFrame(animate);

// ================================
// SOLAR SYSTEM ELLIPTICAL ANIMATION
// ================================

const solarSystem = document.querySelector(".solar-system");

const planets = [
  {
    selector: ".skill-html",
    orbit: ".orbit-1",
    speed: 0.0015,
    angle: 0,
  },

  {
    selector: ".skill-css",
    orbit: ".orbit-1",
    speed: 0.0015,
    angle: Math.PI,
  },

  {
    selector: ".skill-js",
    orbit: ".orbit-2",
    speed: 0.001,
    angle: 0,
  },

  {
    selector: ".skill-tailwind",
    orbit: ".orbit-2",
    speed: 0.001,
    angle: (Math.PI * 2) / 3,
  },

  {
    selector: ".skill-node",
    orbit: ".orbit-2",
    speed: 0.001,
    angle: (Math.PI * 4) / 3,
  },

  {
    selector: ".skill-git",
    orbit: ".orbit-3",
    speed: 0.0007,
    angle: 0,
  },

  {
    selector: ".skill-github",
    orbit: ".orbit-3",
    speed: 0.0007,
    angle: (Math.PI * 2) / 5,
  },

  {
    selector: ".skill-react",
    orbit: ".orbit-3",
    speed: 0.0007,
    angle: (Math.PI * 4) / 5,
  },

  {
    selector: ".skill-bootstrap",
    orbit: ".orbit-3",
    speed: 0.0007,
    angle: (Math.PI * 6) / 5,
  },

  {
    selector: ".skill-php",
    orbit: ".orbit-3",
    speed: 0.0007,
    angle: (Math.PI * 8) / 5,
  },
];

function animateSolarSystem() {
  if (!solarSystem) return;

  planets.forEach((planet) => {
    const element = document.querySelector(planet.selector);
    const orbit = document.querySelector(planet.orbit);

    if (!element || !orbit) return;

    // Get the actual orbit size
    const radiusX = orbit.offsetWidth / 2;
    const radiusY = orbit.offsetHeight / 2;

    // Move planet
    planet.angle += planet.speed * 16;

    const x = Math.cos(planet.angle) * radiusX;
    const y = Math.sin(planet.angle) * radiusY;

    element.style.transform = `translate(${x}px, ${y}px)`;
  });

  requestAnimationFrame(animateSolarSystem);
}

animateSolarSystem();

// ABOUT CAROUSEL

const aboutCarousel = document.querySelector("#about-carousel");
const aboutNext = document.querySelector("#about-next");
const aboutPrev = document.querySelector("#about-prev");
const aboutDots = document.querySelectorAll(".about-dot");

let aboutIndex = 0;

function updateAboutCarousel() {
  aboutCarousel.style.transform = `translateX(-${aboutIndex * 100}%)`;

  aboutDots.forEach((dot, index) => {
    if (index === aboutIndex) {
      dot.classList.remove("bg-zinc-300", "dark:bg-zinc-700");
      dot.classList.add("bg-[#c3d809]");
    } else {
      dot.classList.remove("bg-[#c3d809]");
      dot.classList.add("bg-zinc-300", "dark:bg-zinc-700");
    }
  });
}

aboutNext.addEventListener("click", function () {
  aboutIndex++;

  if (aboutIndex >= aboutDots.length) {
    aboutIndex = 0;
  }

  updateAboutCarousel();
});

aboutPrev.addEventListener("click", function () {
  aboutIndex--;

  if (aboutIndex < 0) {
    aboutIndex = aboutDots.length - 1;
  }

  updateAboutCarousel();
});

aboutDots.forEach(function (dot, index) {
  dot.addEventListener("click", function () {
    aboutIndex = index;

    updateAboutCarousel();
  });
});

updateAboutCarousel();

const openContactFormBtns = document.querySelectorAll(".open-contact-form");

const contactModal = document.querySelector(".contact-modal");
const contactModalBox = document.querySelector(".contact-modal-box");

const closeContactFormBtns = document.querySelectorAll(".close-contact-form");

function openContactForm() {
  contactModal.classList.remove("opacity-0", "invisible");

  setTimeout(() => {
    contactModalBox.classList.remove("scale-95", "translate-y-6");
    contactModalBox.classList.add("scale-100", "translate-y-0");
  }, 10);

  document.body.style.overflow = "hidden";
}

function closeContactForm() {
  contactModalBox.classList.remove("scale-100", "translate-y-0");
  contactModalBox.classList.add("scale-95", "translate-y-6");

  setTimeout(() => {
    contactModal.classList.add("opacity-0", "invisible");
  }, 300);

  document.body.style.overflow = "";
}

openContactFormBtns.forEach((button) => {
  button.addEventListener("click", openContactForm);
});

closeContactFormBtns.forEach((button) => {
  button.addEventListener("click", closeContactForm);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeContactForm();
  }
});

// =================================
// Intro Typing Animation
// =================================

const introScreen = document.querySelector(".intro-screen");
const introText = document.querySelector(".intro-text");
const hero = document.querySelector("#home");

const text = "Hello";
let index = 0;

function typeIntro() {
  if (index < text.length) {
    introText.textContent += text[index];
    index++;

    setTimeout(typeIntro, 150);
  } else {
    setTimeout(() => {
      introScreen.classList.add("hide");
      hero.classList.add("hero-start");
    }, 700);
  }
}

typeIntro();
