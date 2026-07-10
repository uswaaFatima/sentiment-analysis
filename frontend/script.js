// ===========================================================
// Sentiment Analysis — Read the Vibe
// ===========================================================

// 👉 Change this to your deployed backend URL when you go live
// e.g. "https://your-backend.onrender.com/predict"
const API_URL = "http://127.0.0.1:8000/predict";

const textInput = document.getElementById("text-input");
const charCount = document.getElementById("char-count");
const analyzeBtn = document.getElementById("analyze-btn");
const backBtn = document.getElementById("back-btn");
const errorBanner = document.getElementById("error-banner");

const screenInput = document.getElementById("screen-input");
const screenResult = document.getElementById("screen-result");

const mouthInput = document.getElementById("mouth-input");
const mouthResult = document.getElementById("mouth-result");

const verdictWord = document.getElementById("verdict-word");
const verdictSub = document.getElementById("verdict-sub");
const stamp = document.getElementById("stamp");
const confidenceFill = document.getElementById("confidence-fill");
const confidenceValue = document.getElementById("confidence-value");

const MOOD_COPY = {
  Positive: { word: "BUOYANT", sub: "This reads warm, upbeat, and full of energy." },
  Negative: { word: "AGITATED", sub: "This reads tense, upset, or frustrated." },
  Neutral: { word: "LEVEL", sub: "This reads calm and even — no strong charge either way." },
};

// -----------------------------------------------------------
// Character counter
// -----------------------------------------------------------
textInput.addEventListener("input", () => {
  charCount.textContent = textInput.value.length;
});

// -----------------------------------------------------------
// Analyze
// -----------------------------------------------------------
analyzeBtn.addEventListener("click", handleAnalyze);
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze();
});
backBtn.addEventListener("click", resetToInput);

async function handleAnalyze() {
  const text = textInput.value.trim();
  hideError();

  if (!text) {
    showError("Type something first — there's nothing to read yet.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();

    if (data.error) {
      showError(data.error);
      setLoading(false);
      return;
    }

    showResult(data);
  } catch (err) {
    showError("Couldn't reach the backend. Is it running at " + API_URL + "?");
    console.error(err);
    setLoading(false);
  }
}

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtn.classList.toggle("loading", isLoading);
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.add("visible");
}
function hideError() {
  errorBanner.classList.remove("visible");
  errorBanner.textContent = "";
}

// -----------------------------------------------------------
// Screen transition
// -----------------------------------------------------------
function switchScreen(fromEl, toEl) {
  fromEl.classList.add("leaving");
  setTimeout(() => {
    fromEl.classList.remove("active", "leaving");
    fromEl.style.display = "none";
    toEl.style.display = "flex";
    void toEl.offsetWidth; // force reflow so the entrance animation replays
    toEl.classList.add("active");
    document.body.setAttribute("data-screen", toEl === screenResult ? "result" : "input");
  }, 280);
}

function resetToInput() {
  document.body.setAttribute("data-mood", "idle");
  stamp.classList.remove("visible");
  confidenceFill.style.width = "0%";
  setLoading(false);
  switchScreen(screenResult, screenInput);
}

// -----------------------------------------------------------
// Show result on screen 2
// -----------------------------------------------------------
function showResult(data) {
  const { prediction, confidence } = data;
  const copy = MOOD_COPY[prediction] || { word: prediction.toUpperCase(), sub: "" };

  document.body.setAttribute("data-mood", prediction);
  setMouth(mouthResult, prediction);
  verdictWord.textContent = copy.word;
  verdictSub.textContent = copy.sub;

  const pct = Math.round((confidence || 0) * 100);
  confidenceValue.textContent = pct + "%";

  setLoading(false);
  switchScreen(screenInput, screenResult);

  setTimeout(() => {
    requestAnimationFrame(() => { confidenceFill.style.width = pct + "%"; });
    inkMode = prediction;
    inkIntensity = 0.5 + (confidence || 0.5) * 0.8;
  }, 300);

  setTimeout(() => stamp.classList.add("visible"), 650);
}

function setMouth(el, mood) {
  el.className = "mouth mood-" + (mood ? mood.toLowerCase() : "idle");
}

// initialize idle mouth on screen 1
setMouth(mouthInput, "idle");

// -----------------------------------------------------------
// Idle mascot random smile on screen 1 (just for personality)
// -----------------------------------------------------------
setInterval(() => {
  if (document.body.getAttribute("data-screen") !== "result") {
    mouthInput.className = "mouth mood-positive";
    setTimeout(() => { mouthInput.className = "mouth mood-idle"; }, 1200);
  }
}, 5000);

// ===========================================================
// Ink-trace strip chart (canvas) on the result screen
// ===========================================================
const canvas = document.getElementById("strip");
const ctx = canvas.getContext("2d");
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let inkMode = "Neutral";
let inkIntensity = 0.5;
let history = [];
const MAX_POINTS = 200;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

for (let i = 0; i < MAX_POINTS; i++) history.push(0);

let t = 0;

function nextValue() {
  t += 1;
  if (inkMode === "Positive") {
    return Math.sin(t * 0.09) * 0.55 * inkIntensity + Math.sin(t * 0.02) * 0.15;
  }
  if (inkMode === "Negative") {
    const spike = Math.random() < 0.12 ? (Math.random() - 0.5) * 2.2 : 0;
    return Math.sin(t * 0.35) * 0.35 * inkIntensity + spike * inkIntensity;
  }
  return Math.sin(t * 0.05) * 0.08 + (Math.random() - 0.5) * 0.05; // Neutral
}

function inkColor() {
  if (inkMode === "Positive") return "#7cffce";
  if (inkMode === "Negative") return "#ff9fb6";
  return "#a6e6ff";
}

function drawStrip() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  const midY = h / 2;

  history.push(nextValue());
  if (history.length > MAX_POINTS) history.shift();

  ctx.clearRect(0, 0, w, h);

  // faint grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();

  // ink trace with glow
  const stepX = w / (MAX_POINTS - 1);
  ctx.strokeStyle = inkColor();
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = inkColor();
  ctx.shadowBlur = 10;
  ctx.beginPath();
  history.forEach((v, i) => {
    const x = i * stepX;
    const y = midY - v * (h * 0.36);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;

  requestAnimationFrame(drawStrip);
}

drawStrip();
