import { useState, useMemo, useCallback, useEffect } from "react";
import lshunImg from "./assets/lshun.jpg";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── Constants ───────────────────────────────────────────────
const DEG_TO_RAD = Math.PI / 180;
const BASE_TAN_35 = Math.tan(35 * DEG_TO_RAD);
const YAW = 0.022;
const SCOPE_KEYS = ["1x","2x","3x","4x","6x","8x","10x"];
const DEFAULT_CURRENT = { "1x":"1.0","2x":"1.0","3x":"1.0","4x":"1.0","6x":"1.0","8x":"1.0","10x":"1.0" };

// ─── Scope Data ──────────────────────────────────────────────
const SCOPES = [
  { name: "1x", label: "1x Optic", scalarIndex: 0, fovMulti: 6 / 7 },
  { name: "2x", label: "2x HCOG Bruiser", scalarIndex: 1 },
  { name: "3x", label: "3x HCOG Ranger", scalarIndex: 2 },
  { name: "4x", label: "4x Optic", scalarIndex: 3 },
  { name: "6x", label: "6x Sniper", scalarIndex: 4 },
  { name: "8x", label: "8x Sniper", scalarIndex: 5 },
  { name: "10x", label: "10x Digi Sniper", scalarIndex: 6 },
];
SCOPES.forEach((s) => {
  if (!s.fovMulti) {
    const mag = parseInt(s.name);
    s.fovMulti = ((2 * Math.atan(BASE_TAN_35 / mag)) / DEG_TO_RAD) / 70;
  }
});

// ─── Presets ─────────────────────────────────────────────────
function makeRatios(raw) {
  const base = raw["1x"];
  const ratios = {};
  Object.keys(raw).forEach((k) => { ratios[k] = raw[k] / base; });
  return ratios;
}

const PRESET_DATA = {
  lshun: { raw: { "1x": 1.536745, "2x": 1.239769, "3x": 1.444829, "4x": 1.684433, "6x": 1.482260, "8x": 1.711567, "10x": 1.913590 }, iron: 1.536745 },
  aruta: { raw: { "1x": 3.0, "2x": 4.4, "3x": 4.7, "4x": 5.2, "6x": 6.6, "8x": 6.6, "10x": 6.8 }, iron: 6.8 },
  satuki: { raw: { "1x": 2.65, "2x": 2.87, "3x": 2.87, "4x": 2.87, "6x": 3.4, "8x": 3.4, "10x": 3.5 }, iron: 2.65 },
  curihara: { raw: { "1x": 1.0, "2x": 1.0, "3x": 1.1, "4x": 1.1, "6x": 1.1, "8x": 1.1, "10x": 1.1 }, iron: 1.0 },
  lykq: { raw: { "1x": 2.7, "2x": 2.6, "3x": 2.6, "4x": 2.6, "6x": 4.0, "8x": 4.0, "10x": 4.0 }, iron: 2.7 },
  kentoboss: { raw: { "1x": 4.33, "2x": 4.28, "3x": 4.45, "4x": 4.47, "6x": 4.1, "8x": 4.4, "10x": 4.6 }, iron: 4.33 },
};

const PRESET_RATIOS = {};
Object.keys(PRESET_DATA).forEach((id) => { PRESET_RATIOS[id] = makeRatios(PRESET_DATA[id].raw); });

const PRESETS = [
  { id: "unified", name: "リニア", desc: "1倍基準で感度補正 — PAD↔マウスの強度調整可能", tag: "計算" },
  { id: "aruta", name: "あるた", desc: "1x〜4xフラット型 — 高感度バランス", tag: "配信者" },
  { id: "satuki", name: "satuki", desc: "ZETA — 1x〜4x統一＋6x以上ジャンプ型", tag: "プロ" },
  { id: "lykq", name: "Lykq", desc: "4-1リニア — 中距離統一＋遠距離別枠型", tag: "プロ" },
  { id: "lshun", name: "Lスターしゅんしゅん", desc: "4-4クラシック — cfg精密調整型", tag: "配信者" },
  { id: "kentoboss", name: "kentoboss", desc: "4.3フラット — リニア入力・デッドゾーン無し", tag: "配信者" },
  { id: "curihara", name: "Curihara", desc: "4-3リニア — 微調整ミニマル型", tag: "プロ" },
  { id: "default", name: "デフォルト", desc: "APEX初期値 — 全スコープ 1.0", tag: "参考" },
];

// ─── Profiles ────────────────────────────────────────────────
const PROFILES = {
  lshun: {
    image: lshunImg,
    twitter: "shunshun_Games",
    gear: [
      { icon: "🎮", label: "デバイス", value: "DualSense Edge", url: "https://www.amazon.co.jp/dp/B0BJTJNQFD" },
      { icon: "🕹️", label: "フリーク", value: "ProFreak V2 凸型", url: "https://www.amazon.co.jp/dp/B0BQM45DCH" },
    ],
  },
  kentoboss: {
    image: null,
    twitter: "kentoboss",
    gear: [
      { icon: "🎮", label: "デバイス", value: "DualSense Edge", url: "https://www.amazon.co.jp/dp/B0BJTJNQFD" },
      { icon: "🖥️", label: "モニター", value: "INZONE M10S", url: "https://www.amazon.co.jp/dp/B0DHRTWZFC" },
    ],
  },
};

// Iron sight (scalar_7) ratios per preset
const IRON_RATIOS = {};
Object.keys(PRESET_DATA).forEach((id) => {
  IRON_RATIOS[id] = PRESET_DATA[id].iron / PRESET_DATA[id].raw["1x"];
});
IRON_RATIOS.unified = 1.0;
IRON_RATIOS.default = 1.0;
function fovToScale(fov) { return 1 + (fov - 70) * 0.01375; }

function calcResults(inGameFov, sens1x, presetId, power = 1.0) {
  const hipFov = 70 * fovToScale(inGameFov);
  const fov1x = SCOPES[0].fovMulti * hipFov;
  const zs1x = Math.tan((hipFov / 2) * DEG_TO_RAD) / Math.tan((fov1x / 2) * DEG_TO_RAD);
  return SCOPES.map((scope) => {
    const scopeFov = scope.fovMulti * hipFov;
    const zs = Math.tan((hipFov / 2) * DEG_TO_RAD) / Math.tan((scopeFov / 2) * DEG_TO_RAD);
    const fullRatio = Math.tan((fov1x / 2) * DEG_TO_RAD) / Math.tan((scopeFov / 2) * DEG_TO_RAD);
    const zoomFrom1x = zs / zs1x;
    let ratio;
    if (presetId === "unified") ratio = Math.pow(fullRatio, power);
    else if (PRESET_RATIOS[presetId]) ratio = PRESET_RATIOS[presetId][scope.name];
    else ratio = 1.0;
    const scalar = sens1x * ratio;
    return { name: scope.name, label: scope.label, idx: scope.scalarIndex, scopeFov, zoomFrom1x, ratio, scalar };
  });
}

function calcCm360(dpi, baseSens, scalar, zoomScalar) {
  const eSens = baseSens * scalar / zoomScalar;
  return (360 / (dpi * eSens * YAW)) * 2.54;
}

// ─── Validation ──────────────────────────────────────────────
function getWarning(field, value) {
  const num = parseFloat(value);
  if (value === "" || isNaN(num)) return null;
  if (field === "fov") {
    if (num < 70) return "FOVの最小値は70です";
    if (num > 120) return "FOVの最大値は120です（裏設定含む）";
    if (!Number.isInteger(num)) return "FOVは整数で入力してください";
  }
  if (field === "sens") {
    if (num <= 0) return "0より大きい値を入力してください";
    if (num > 10) return "scalar値の一般的な範囲は0.5〜3.0です";
  }
  if (field === "dpi") {
    if (num < 100) return "DPIが低すぎます";
    if (num > 32000) return "DPIが高すぎます";
  }
  if (field === "baseSens") {
    if (num <= 0) return "0より大きい値を入力してください";
    if (num > 10) return "一般的な範囲は0.5〜5.0です";
  }
  return null;
}

// ─── Storage ─────────────────────────────────────────────────
const STORAGE_KEY = "apex-sens-data";
async function loadSaved() {
  try { const v = localStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
async function saveCurrent(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

// ─── Styles ──────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  :root {
    --apex-red: #e8413c; --apex-blue: #4a8fd4;
    --bg-deep: #06060b; --bg-card: #0d0d14; --bg-input: #12121c;
    --border: #1a1a2e; --text-primary: #e8e8ef; --text-secondary: #7a7a90; --text-dim: #4a4a5e;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg-deep); }
  .apex-app {
    font-family: 'Chakra Petch', sans-serif; background: var(--bg-deep);
    min-height: 100vh; color: var(--text-primary);
  }
  .apex-app::before {
    content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at 20% 0%, rgba(232,65,60,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(232,65,60,0.04) 0%, transparent 50%);
    pointer-events: none; z-index: 0;
  }
  .apex-container { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 32px 20px 64px; }
  .apex-header { text-align: center; margin-bottom: 40px; padding-top: 12px; }
  .apex-header h1 {
    font-size: 28px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px;
    background: linear-gradient(135deg, #fff 0%, #e8413c 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .apex-header p { color: var(--text-secondary); font-size: 13px; margin: 0; }
  .section-label {
    font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
    color: var(--apex-red); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .section-label::before { content: ''; width: 12px; height: 2px; background: var(--apex-red); }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 24px; margin-bottom: 20px; }
  .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 600px) { .input-row { grid-template-columns: 1fr; } }
  .input-group label { display: block; font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; }
  .input-group input {
    width: 100%; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
    color: var(--text-primary); font-family: 'Share Tech Mono', monospace; font-size: 16px;
    padding: 10px 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-group input:focus { border-color: var(--apex-red); box-shadow: 0 0 0 3px rgba(232,65,60,0.15); }
  select option { background: var(--bg-input); color: var(--text-primary); }
  .preset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 700px) { .preset-grid { grid-template-columns: repeat(2, 1fr); } }
  .preset-btn {
    background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
    padding: 10px; cursor: pointer; text-align: left; transition: all 0.2s;
  }
  .preset-btn:hover { border-color: #353550; }
  .preset-btn.active { border-color: var(--apex-red); background: rgba(232,65,60,0.08); box-shadow: 0 0 0 1px var(--apex-red); }
  .preset-tag { font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
  .preset-tag[data-tag="計算"] { color: var(--apex-red); }
  .preset-tag[data-tag="プロ"] { color: #4ad480; }
  .preset-tag[data-tag="配信者"] { color: #e8a83c; }
  .preset-tag[data-tag="研究者"] { color: var(--apex-blue); }
  .preset-tag[data-tag="参考"] { color: var(--text-dim); }
  .preset-name { font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
  .preset-desc { font-size: 10px; color: var(--text-dim); line-height: 1.3; }
  .result-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .result-table th {
    font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    color: var(--text-dim); padding: 8px 10px; text-align: right; border-bottom: 1px solid var(--border);
  }
  .result-table th:first-child { text-align: left; }
  .result-table td {
    padding: 10px 10px; text-align: right; border-bottom: 1px solid rgba(26,26,46,0.5);
    font-family: 'Share Tech Mono', monospace; font-size: 14px; color: var(--text-secondary);
  }
  .result-table td:first-child { text-align: left; font-family: 'Chakra Petch', sans-serif; font-weight: 600; color: var(--text-primary); }
  .result-table tr:hover td { background: rgba(232,65,60,0.03); }
  .hl-red { color: var(--apex-red); font-weight: 500; }
  .hl-blue { color: var(--apex-blue); }
  .cfg-tabs { display: flex; gap: 2px; }
  .cfg-tab {
    font-family: 'Chakra Petch', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; padding: 8px 16px; background: var(--bg-input); border: 1px solid var(--border);
    border-bottom: none; border-radius: 6px 6px 0 0; color: var(--text-dim); cursor: pointer;
  }
  .cfg-tab.active { background: #161622; color: var(--apex-red); }
  .cfg-block { background: #161622; border: 1px solid var(--border); border-radius: 0 6px 6px 6px; padding: 16px; position: relative; }
  .cfg-code { font-family: 'Share Tech Mono', monospace; font-size: 12px; line-height: 1.8; color: #8888a0; white-space: pre; overflow-x: auto; }
  .cfg-code .val { color: var(--apex-red); }
  .cfg-code .key { color: #6688aa; }
  .btn {
    font-family: 'Chakra Petch', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
    padding: 6px 14px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-input);
    color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
  }
  .btn:hover { border-color: var(--apex-red); color: var(--apex-red); }
  .btn-active { background: var(--apex-red); border-color: var(--apex-red); color: #fff; }
  .warning-box {
    display: flex; gap: 10px; align-items: flex-start; background: rgba(232,65,60,0.06);
    border: 1px solid rgba(232,65,60,0.15); border-radius: 6px; padding: 12px 14px;
    margin-top: 12px; font-size: 11px; line-height: 1.5; color: var(--text-secondary);
  }
  .fov-info { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: var(--text-dim); font-family: 'Share Tech Mono', monospace; }
  .toggle-btn {
    font-family: 'Chakra Petch', sans-serif; font-size: 12px; font-weight: 600; color: var(--text-dim);
    background: none; border: none; cursor: pointer; padding: 4px 0; transition: color 0.2s;
  }
  .toggle-btn:hover { color: var(--text-secondary); }
  .current-panel {
    margin-top: 16px; padding: 16px; background: rgba(74,143,212,0.04);
    border: 1px solid rgba(74,143,212,0.15); border-radius: 6px;
  }
  .current-panel .input-group input { font-size: 14px; padding: 8px 10px; }
  .current-panel .input-group input:focus { border-color: var(--apex-blue); box-shadow: 0 0 0 3px rgba(74,143,212,0.15); }
  .current-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  @media (max-width: 600px) { .current-grid { grid-template-columns: repeat(2, 1fr); } }
  .save-row { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
  .save-msg { font-size: 11px; color: #4ad480; animation: fadeMsg 2.5s forwards; }
  @keyframes fadeMsg { 0%,70% { opacity:1; } 100% { opacity:0; } }
  .mouse-extra { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .profile-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  @media (max-width: 600px) { .profile-cards { grid-template-columns: 1fr; } }
  .profile-card {
    display: flex; align-items: center; gap: 12px;
    background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; padding: 12px;
  }
  .profile-avatar {
    width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
    border: 2px solid var(--border);
  }
  .profile-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .profile-label { font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); }
  .profile-value { font-size: 12px; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-twitter { font-size: 11px; color: var(--apex-blue); text-decoration: none; }
  .profile-twitter:hover { text-decoration: underline; }
  .power-slider-wrap {
    margin-top: 14px; padding: 16px; background: rgba(232,65,60,0.04);
    border: 1px solid rgba(232,65,60,0.12); border-radius: 6px;
  }
  .power-slider-label {
    display: flex; justify-content: space-between; font-size: 10px;
    color: var(--text-dim); margin-top: 6px; letter-spacing: 0.3px;
  }
  .power-slider {
    width: 100%; height: 6px; -webkit-appearance: none; appearance: none;
    background: var(--bg-input); border-radius: 3px; outline: none; margin: 10px 0 4px;
  }
  .power-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
    background: var(--apex-red); cursor: pointer; border: 2px solid #fff;
    box-shadow: 0 0 8px rgba(232,65,60,0.4);
  }
  .power-slider::-moz-range-thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--apex-red); cursor: pointer; border: 2px solid #fff;
  }
  .power-val {
    font-family: 'Share Tech Mono', monospace; font-size: 14px;
    color: var(--apex-red); font-weight: 600;
  }
`;
document.head.appendChild(style);

// ─── Chart Tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d0d14", border: "1px solid #1a1a2e", borderRadius: 6, padding: "10px 14px", fontSize: 12, fontFamily: "'Chakra Petch', sans-serif" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#e8e8ef" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {p.value.toFixed(2)}x</div>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function ApexSensCalc() {
  const [fovStr, setFovStr] = useState("104");
  const [sensStr, setSensStr] = useState("1.0");
  const [preset, setPreset] = useState("unified");
  const [cfgTab, setCfgTab] = useState("pad");
  const [copied, setCopied] = useState(false);
  const [showMouse, setShowMouse] = useState(false);
  const [dpiStr, setDpiStr] = useState("800");
  const [baseSensStr, setBaseSensStr] = useState("2.0");
  const [showCurrent, setShowCurrent] = useState(false);
  const [currentSens, setCurrentSens] = useState({ ...DEFAULT_CURRENT });
  const [saveMsg, setSaveMsg] = useState("");
  const [linearPower, setLinearPower] = useState(0.2);
  const [comparePreset, setComparePreset] = useState("none");

  // Load saved data
  useEffect(() => {
    loadSaved().then((d) => {
      if (d) {
        if (d.current) setCurrentSens(d.current);
        if (d.fov) setFovStr(d.fov);
        if (d.sens) setSensStr(d.sens);
        if (d.linearPower !== undefined) setLinearPower(d.linearPower);
        if (d.current && Object.values(d.current).some((v) => v !== "1.0")) setShowCurrent(true);
      }
    });
  }, []);

  // Parse numbers
  const fov = (() => { const n = parseFloat(fovStr); return isNaN(n) ? 104 : Math.max(70, Math.min(120, n)); })();
  const sens1x = (() => { const n = parseFloat(sensStr); return isNaN(n) ? 1.0 : Math.max(0.01, n); })();
  const dpi = (() => { const n = parseFloat(dpiStr); return isNaN(n) ? 800 : Math.max(100, n); })();
  const baseSens = (() => { const n = parseFloat(baseSensStr); return isNaN(n) ? 2.0 : Math.max(0.1, n); })();

  const fovWarn = getWarning("fov", fovStr);
  const sensWarn = getWarning("sens", sensStr);
  const dpiWarn = getWarning("dpi", dpiStr);
  const baseSensWarn = getWarning("baseSens", baseSensStr);

  const results = useMemo(() => calcResults(fov, sens1x, preset, linearPower), [fov, sens1x, preset, linearPower]);
  const compareResults = useMemo(() => comparePreset !== "none" ? calcResults(fov, sens1x, comparePreset, linearPower) : null, [fov, sens1x, comparePreset, linearPower]);
  const hipFov = 70 * fovToScale(fov);

  const currentParsed = useMemo(() => {
    const out = {};
    SCOPE_KEYS.forEach((k) => { const n = parseFloat(currentSens[k]); out[k] = isNaN(n) ? 1.0 : n; });
    return out;
  }, [currentSens]);

  const hasCurrent = showCurrent && Object.values(currentSens).some((v) => v !== "1.0" && v !== "");
  const hasCompare = comparePreset !== "none" && compareResults;
  const compareName = hasCompare ? PRESETS.find((p) => p.id === comparePreset)?.name || "" : "";
  const mainName = PRESETS.find((p) => p.id === preset)?.name || "";

  // Chart
  const chartData = useMemo(() => results.map((r, i) => {
    const d = { name: r.name };
    d[mainName] = parseFloat(r.ratio.toFixed(3));
    if (hasCompare) d[compareName] = parseFloat(compareResults[i].ratio.toFixed(3));
    if (hasCurrent) d["現在の感度"] = parseFloat((currentParsed[r.name] / sens1x).toFixed(3));
    return d;
  }), [results, compareResults, hasCurrent, currentParsed, sens1x, hasCompare, mainName, compareName]);

  const chartMax = useMemo(() => {
    let mx = Math.max(...chartData.map((d) => d[mainName] || 0));
    if (hasCompare) mx = Math.max(mx, ...chartData.map((d) => d[compareName] || 0));
    if (hasCurrent) mx = Math.max(mx, ...chartData.map((d) => d["現在の感度"] || 0));
    return Math.max(2, Math.ceil(mx * 1.15));
  }, [chartData, hasCurrent, hasCompare, mainName, compareName]);

  // Config
  const buildCfg = useCallback((type) => {
    const pfx = type === "pad" ? "gamepad_ads_advanced_sensitivity_scalar" : "mouse_zoomed_sensitivity_scalar";
    let lines = results.map((r) => `${pfx}_${r.idx} "${r.scalar.toFixed(6)}"`);
    if (type === "pad") {
      const ironScalar = sens1x * (IRON_RATIOS[preset] || 1.0);
      lines.push(`${pfx}_7 "${ironScalar.toFixed(6)}"`);
      lines.push(""); lines.push(`gamepad_use_per_scope_sensitivity_scalars "1"`);
    }
    return lines.join("\n");
  }, [results, sens1x, preset]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildCfg(cfgTab));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [buildCfg, cfgTab]);

  const handleSave = useCallback(async () => {
    const ok = await saveCurrent({ current: currentSens, fov: fovStr, sens: sensStr, linearPower });
    setSaveMsg(ok ? "✓ 保存しました" : "保存に失敗しました");
    setTimeout(() => setSaveMsg(""), 2500);
  }, [currentSens, fovStr, sensStr, linearPower]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildCfg(cfgTab)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cfgTab === "pad" ? "apex_pad_sensitivity.cfg" : "apex_mouse_sensitivity.cfg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildCfg, cfgTab]);

  return (
    <div className="apex-app">
      <div className="apex-container">
        <div className="apex-header">
          <h1>APEX SENS CALIBRATOR</h1>
          <p>スコープ間感度統一ツール — 1倍を基準に全スコープの角速度を計算</p>
        </div>

        {/* ─── Input ─── */}
        <div className="section-label">入力</div>
        <div className="card">
          <div className="input-row">
            <div className="input-group">
              <label>ゲーム内FOV設定</label>
              <input type="number" inputMode="numeric" value={fovStr}
                onChange={(e) => setFovStr(e.target.value)}
                onBlur={() => { if (!fovStr || isNaN(parseFloat(fovStr))) setFovStr("104"); }}
                style={fovWarn ? { borderColor: "#e8413c" } : {}} />
              {fovWarn && <div style={{ color: "#e8413c", fontSize: 11, marginTop: 4 }}>⚠ {fovWarn}</div>}
            </div>
            <div className="input-group">
              <label>1倍スコープ感度（scalar値）</label>
              <input type="number" inputMode="decimal" step="any" value={sensStr}
                onChange={(e) => setSensStr(e.target.value)}
                onBlur={() => { if (!sensStr || isNaN(parseFloat(sensStr))) setSensStr("1.0"); }}
                style={sensWarn ? { borderColor: "#e8413c" } : {}} />
              {sensWarn && <div style={{ color: "#e8413c", fontSize: 11, marginTop: 4 }}>⚠ {sensWarn}</div>}
            </div>
          </div>
          <div className="fov-info">
            <span>cl_fovScale: {fovToScale(fov).toFixed(6)}</span>
            <span>実FOV(4:3): {hipFov.toFixed(1)}°</span>
          </div>

          {/* Current Sensitivity */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <button className="toggle-btn" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? "▾" : "▸"} 現在の感度を入力して比較する
            </button>
            {showCurrent && (
              <div className="current-panel">
                <div style={{ fontSize: 11, color: "var(--apex-blue)", marginBottom: 10, fontWeight: 600 }}>
                  現在のスコープ別scalar値を入力（グラフ・テーブルで比較表示されます）
                </div>
                <div className="current-grid">
                  {SCOPE_KEYS.map((k) => (
                    <div className="input-group" key={k}>
                      <label style={{ color: "var(--apex-blue)" }}>{k}</label>
                      <input type="number" inputMode="decimal" step="any"
                        value={currentSens[k]}
                        onChange={(e) => setCurrentSens((p) => ({ ...p, [k]: e.target.value }))}
                        onBlur={() => { if (!currentSens[k] || isNaN(parseFloat(currentSens[k]))) setCurrentSens((p) => ({ ...p, [k]: "1.0" })); }}
                      />
                    </div>
                  ))}
                </div>
                <div className="save-row">
                  <button className="btn" onClick={handleSave}>💾 設定を保存</button>
                  <button className="btn" onClick={() => setCurrentSens({ ...DEFAULT_CURRENT })}>リセット</button>
                  {saveMsg && <span className="save-msg" key={Date.now()}>{saveMsg}</span>}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8 }}>
                  保存すると次回アクセス時に自動で読み込まれます
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Presets ─── */}
        <div className="section-label">プリセット</div>
        <div className="card">
          <div className="preset-grid">
            {PRESETS.map((p) => (
              <button key={p.id} className={`preset-btn${preset === p.id ? " active" : ""}`} onClick={() => { setPreset(p.id); if (comparePreset === p.id) setComparePreset("none"); }}>
                <div className="preset-tag" data-tag={p.tag}>{p.tag}</div>
                <div className="preset-name">{p.name}</div>
                <div className="preset-desc">{p.desc}</div>
              </button>
            ))}
          </div>
          {PROFILES[preset] && (() => {
            const p = PROFILES[preset];
            return (
              <div className="profile-cards">
                <div className="profile-card">
                  {p.image
                    ? <img src={p.image} alt={preset} className="profile-avatar" />
                    : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-card)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, color: "var(--text-dim)", fontWeight: 700 }}>
                        {p.twitter[0].toUpperCase()}
                      </div>
                  }
                  <div className="profile-info">
                    <span className="profile-label">X (Twitter)</span>
                    <a className="profile-twitter" href={`https://x.com/${p.twitter}`} target="_blank" rel="noopener noreferrer">@{p.twitter}</a>
                  </div>
                </div>
                {p.gear.map((g) => (
                  <a key={g.label} className="profile-card" href={g.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-card)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>{g.icon}</div>
                    <div className="profile-info">
                      <span className="profile-label">{g.label}</span>
                      <span className="profile-value">{g.value}</span>
                      <span style={{ fontSize: 9, color: "var(--text-dim)" }}>Amazonで見る →</span>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}
          {preset === "unified" && (
            <div className="power-slider-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  補正強度
                </span>
                <span className="power-val">{Math.round(linearPower * 100)}%</span>
              </div>
              <input
                type="range" className="power-slider"
                min={0} max={100} step={5}
                value={Math.round(linearPower * 100)}
                onChange={(e) => setLinearPower(Number(e.target.value) / 100)}
              />
              <div className="power-slider-label">
                <span>🎮 PAD向き（エイムアシスト考慮）</span>
                <span>🖱️ マウス向き（完全統一）</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8, lineHeight: 1.5 }}>
                {linearPower <= 0.3
                  ? "PAD推奨：エイムアシストのスローダウン効果を維持しつつ緩やかに補正。プロ選手の設定に近い値です。"
                  : linearPower <= 0.6
                  ? "中間：PADとマウスの間くらいの補正。アシストは少し薄くなりますが操作感の統一性は高まります。"
                  : linearPower <= 0.85
                  ? "マウス寄り：高倍率スコープの感度がかなり上がります。PADだとアシストの恩恵が薄れる可能性があります。"
                  : "フル補正：全スコープで1倍と同じ角速度。マウス向けの設定です。PADではアシストがほぼ機能しなくなる可能性があります。"}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>比較対象</span>
              <select
                value={comparePreset}
                onChange={(e) => setComparePreset(e.target.value)}
                style={{
                  flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
                  borderRadius: 6, color: "var(--text-primary)", fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: 13, padding: "8px 12px", outline: "none", cursor: "pointer",
                }}
              >
                <option value="none">なし</option>
                {PRESETS.filter((p) => p.id !== preset).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {hasCompare && (
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 6 }}>
                グラフとテーブルに「{compareName}」を追加表示します
              </div>
            )}
          </div>
        </div>

        {/* ─── Results ─── */}
        <div className="section-label">算出結果</div>
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="result-table">
            <thead>
              <tr>
                <th>スコープ</th>
                <th>1x基準倍率</th>
                <th>比率</th>
                <th>ゲーム内設定</th>
                <th>cfg値</th>
                {hasCompare && <th style={{ color: "#e8a83c" }}>{compareName}</th>}
                {hasCurrent && <th style={{ color: "var(--apex-blue)" }}>現在値</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.zoomFrom1x.toFixed(2)}x</td>
                  <td>{r.ratio.toFixed(4)}</td>
                  <td className="hl-red">{r.scalar.toFixed(2)}</td>
                  <td style={{ fontSize: 12 }}>{r.scalar.toFixed(6)}</td>
                  {hasCompare && <td style={{ color: "#e8a83c" }}>{compareResults[i].scalar.toFixed(2)}</td>}
                  {hasCurrent && <td className="hl-blue">{currentParsed[r.name].toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mouse-extra">
            <button className="toggle-btn" onClick={() => setShowMouse(!showMouse)}>
              {showMouse ? "▾" : "▸"} マウス用 cm/360 を表示
            </button>
            {showMouse && (
              <div style={{ marginTop: 12 }}>
                <div className="input-row" style={{ marginBottom: 12 }}>
                  <div className="input-group">
                    <label>マウスDPI</label>
                    <input type="number" inputMode="numeric" value={dpiStr}
                      onChange={(e) => setDpiStr(e.target.value)}
                      onBlur={() => { if (!dpiStr || isNaN(parseFloat(dpiStr))) setDpiStr("800"); }}
                      style={dpiWarn ? { borderColor: "#e8413c" } : {}} />
                    {dpiWarn && <div style={{ color: "#e8413c", fontSize: 11, marginTop: 4 }}>⚠ {dpiWarn}</div>}
                  </div>
                  <div className="input-group">
                    <label>ゲーム内ベース感度</label>
                    <input type="number" inputMode="decimal" step="any" value={baseSensStr}
                      onChange={(e) => setBaseSensStr(e.target.value)}
                      onBlur={() => { if (!baseSensStr || isNaN(parseFloat(baseSensStr))) setBaseSensStr("2.0"); }}
                      style={baseSensWarn ? { borderColor: "#e8413c" } : {}} />
                    {baseSensWarn && <div style={{ color: "#e8413c", fontSize: 11, marginTop: 4 }}>⚠ {baseSensWarn}</div>}
                  </div>
                </div>
                <table className="result-table">
                  <thead><tr><th>スコープ</th><th>cm/360</th></tr></thead>
                  <tbody>
                    {results.map((r) => {
                      const zs = Math.tan((hipFov / 2) * DEG_TO_RAD) / Math.tan((r.scopeFov / 2) * DEG_TO_RAD);
                      return <tr key={r.name}><td>{r.name}</td><td>{calcCm360(dpi, baseSens, r.scalar, zs).toFixed(2)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── Chart ─── */}
        <div className="section-label">ビジュアル比較</div>
        <div className="card">
          <div style={{ fontSize: 12, color: "#7a7a90", marginBottom: 12 }}>
            per-optic 倍率の比較（1倍基準の比率）
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="20%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis dataKey="name" tick={{ fill: "#7a7a90", fontSize: 12, fontFamily: "'Chakra Petch', sans-serif" }}
                axisLine={{ stroke: "#1a1a2e" }} tickLine={false} />
              <YAxis tick={{ fill: "#4a4a5e", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}
                axisLine={false} tickLine={false} domain={[0, chartMax]} tickFormatter={(v) => `${v.toFixed(1)}x`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey={mainName} radius={[3, 3, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? "#e8413c" : "#c43530"} />)}
              </Bar>
              {hasCompare && <Bar dataKey={compareName} fill="#e8a83c" radius={[3, 3, 0, 0]} />}
              {hasCurrent && <Bar dataKey="現在の感度" fill="#4a8fd4" radius={[3, 3, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#4a4a5e", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#e8413c" }} />{mainName}
            </span>
            {hasCompare && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#e8a83c" }} />{compareName}
              </span>
            )}
            {hasCurrent && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#4a8fd4" }} />現在の感度
              </span>
            )}
          </div>
        </div>

        {/* ─── Config Output ─── */}
        <div className="section-label">コンフィグ出力</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="cfg-tabs" style={{ padding: "12px 16px 0" }}>
            <button className={`cfg-tab${cfgTab === "pad" ? " active" : ""}`} onClick={() => { setCfgTab("pad"); setCopied(false); }}>PAD用</button>
            <button className={`cfg-tab${cfgTab === "mouse" ? " active" : ""}`} onClick={() => { setCfgTab("mouse"); setCopied(false); }}>マウス用</button>
          </div>
          <div className="cfg-block" style={{ margin: "0 16px 16px", borderRadius: "0 6px 6px 6px" }}>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
              <button className={`btn${copied ? " btn-active" : ""}`} onClick={handleCopy}>
                {copied ? "✓ コピー済み" : "コピー"}
              </button>
            </div>
            <div className="cfg-code">
              {buildCfg(cfgTab).split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i}>&nbsp;</div>;
                const [key, ...rest] = line.split(" ");
                return <div key={i}><span className="key">{key}</span> <span className="val">{rest.join(" ")}</span></div>;
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={handleDownload}>📥 cfgファイルをダウンロード</button>
            </div>
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <div className="warning-box">
              <span style={{ color: "var(--apex-red)", fontSize: 14, flexShrink: 0 }}>⚠</span>
              <div>
                <strong>profile.cfg を読み取り専用に設定してください。</strong><br />
                設定しないとゲーム起動時に値が上書きされます。ファイル右クリック → プロパティ → 読み取り専用にチェック。<br />
                <span style={{ color: "var(--text-dim)", fontSize: 10 }}>パス: %USERPROFILE%\Saved Games\Respawn\Apex\profile\profile.cfg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
