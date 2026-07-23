import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine } from 'recharts';
import Papa from 'papaparse';

// Palette from the panel-redesign-v7 mockup: deeper plum, an airier lavender-pink
// background, and a muted gold accent. Status colors (red/amber/green) are used
// consistently for "needs attention" / "monitor" / "in range" throughout.
const COLORS = {
  ink: '#2E2530',
  inkSoft: '#6B5C6C',
  inkMuted: '#9A8B99',
  paper: '#FBF5F7',
  card: '#FFFFFF',
  border: '#F0E1EA',
  borderSoft: '#F6EDF2',

  plum: '#6B3F63',
  plumDark: '#3D2439',
  plumTint: '#F8ECF5',
  plumLine: '#C9A0C0',

  gold: '#B98D4F',
  goldDark: '#7A5A1E',
  goldTint: '#F5EDDD',

  amberBg: '#F6ECD6',
  amberText: '#7A5A1E',
  amberLine: '#B98D4F',

  greenBg: '#EEF3E4',
  greenText: '#2B3E15',
  greenMid: '#516B34',
  greenLine: '#82A15C',

  redBg: '#FBEAEC',
  redText: '#7E2733',
  redLine: '#C15468',

  // legacy aliases kept so the rest of the file (unrelated to color) doesn't
  // need every reference rewritten
  tealDark: '#6B3F63',
  teal: '#C9A0C0',
  tealSoft: '#F8ECF5',
  red: '#7E2733',
  redSoft: '#FBEAEC',
  amber: '#7A5A1E',
  amberSoft: '#F6ECD6',

  overlay: ['#6B3F63', '#C15468', '#516B34', '#B98D4F', '#3D2439', '#82A15C'],
};

const TEST_LIBRARY = {
  'Hemoglobin': { unit: 'g/dL', low: 12.0, high: 16.0 },
  'Hematocrit': { unit: '%', low: 36, high: 46 },
  'White Blood Cells': { unit: 'K/µL', low: 4.5, high: 11.0 },
  'Platelets': { unit: 'K/µL', low: 150, high: 400 },
  'Glucose': { unit: 'mg/dL', low: 70, high: 99 },
  'Sodium': { unit: 'mmol/L', low: 136, high: 145 },
  'Potassium': { unit: 'mmol/L', low: 3.5, high: 5.1 },
  'Creatinine': { unit: 'mg/dL', low: 0.6, high: 1.3 },
  'BUN': { unit: 'mg/dL', low: 7, high: 20 },
  'Total Cholesterol': { unit: 'mg/dL', low: 100, high: 200 },
  'LDL': { unit: 'mg/dL', low: 0, high: 100 },
  'HDL': { unit: 'mg/dL', low: 40, high: 90 },
  'Triglycerides': { unit: 'mg/dL', low: 0, high: 150 },
  'TSH': { unit: 'µIU/mL', low: 0.4, high: 4.0 },
  'ALT': { unit: 'U/L', low: 7, high: 56 },
  'AST': { unit: 'U/L', low: 10, high: 40 },
  'Serum Iron': { unit: 'µg/dL', low: 60, high: 170 },
  'Serum Ferritin': { unit: 'ng/mL', low: 20, high: 200 },
  'HbA1c': { unit: '%', low: 4.0, high: 5.6 },
  'Serum Calcium': { unit: 'mg/dL', low: 8.5, high: 10.5 },
  'Vitamin D': { unit: 'ng/mL', low: 30, high: 100 },
  'Insulin': { unit: 'µIU/mL', low: 2.6, high: 24.9 },
  'T3': { unit: 'ng/dL', low: 80, high: 200 },
  'T4': { unit: 'µg/dL', low: 5.0, high: 12.0 },
  'Vitamin B12': { unit: 'pg/mL', low: 200, high: 900 },
  'ALP': { unit: 'U/L', low: 44, high: 147 },
  'Bilirubin': { unit: 'mg/dL', low: 0.1, high: 1.2 },
};

const TEST_INFO = {
  'Hemoglobin': 'Carries oxygen in your blood — low levels can lead to fatigue, especially if declining over time.',
  'Hematocrit': 'Reflects the share of blood made up of red cells — tracks closely with hemoglobin and can signal anemia or dehydration.',
  'White Blood Cells': 'Reflects immune system activity — elevated levels often point to infection or inflammation, while low levels may suggest reduced immune defense.',
  'Platelets': 'Responsible for blood clotting — low levels can raise bleeding risk, while high levels may raise clotting risk.',
  'Glucose': 'Measures blood sugar at a single point in time — persistently high levels are linked to insulin resistance and diabetes risk.',
  'Sodium': 'Regulates fluid balance and nerve function — imbalances often reflect hydration status or kidney and hormonal issues.',
  'Potassium': 'Essential for heart and muscle function — even small deviations can affect heart rhythm and deserve prompt attention.',
  'Creatinine': 'A byproduct of muscle metabolism cleared by the kidneys — rising levels can indicate reduced kidney function.',
  'BUN': 'Reflects kidney filtration and protein breakdown — elevated levels can point to kidney strain or dehydration.',
  'Total Cholesterol': 'An overall measure of cholesterol in the blood — persistently high levels are linked to cardiovascular risk over time.',
  'LDL': 'Often called "bad" cholesterol — higher levels contribute to plaque buildup in arteries over time.',
  'HDL': 'Often called "good" cholesterol — higher levels are generally protective for heart health.',
  'Triglycerides': 'A type of fat in the blood — elevated levels are linked to diet, metabolic health, and cardiovascular risk.',
  'TSH': 'Signals the thyroid to produce hormone — high levels often indicate an underactive thyroid, low levels an overactive one.',
  'ALT': 'An enzyme released when liver cells are damaged — rising levels can indicate liver stress or injury.',
  'AST': 'Found in liver and muscle tissue — elevated levels can reflect liver damage or, less specifically, muscle injury.',
  'Serum Iron': 'Measures circulating iron — levels can fluctuate and should be interpreted alongside other markers.',
  'Serum Ferritin': 'Reflects stored iron — low levels may indicate depleted reserves even before anemia develops.',
  'HbA1c': 'Shows average blood sugar over time — higher levels suggest sustained elevated glucose.',
  'Serum Calcium': 'Important for bone, muscle, and nerve function — abnormal levels can point to bone, kidney, or parathyroid issues.',
  'Vitamin D': 'Supports bone health and immune function — low levels are common and linked to fatigue and bone discomfort.',
  'Insulin': 'Regulates blood sugar by helping cells absorb glucose — elevated fasting levels can be an early sign of insulin resistance.',
  'T3': 'An active thyroid hormone that drives metabolism — levels shift with both thyroid conditions and overall illness.',
  'T4': 'The main hormone produced by the thyroid — helps confirm whether a TSH change reflects true thyroid dysfunction.',
  'Vitamin B12': 'Supports nerve function and red blood cell production — low levels can cause fatigue, numbness, or memory issues.',
  'ALP': 'An enzyme found in liver and bone tissue — elevated levels can point to liver, bile duct, or bone conditions.',
  'Bilirubin': 'A byproduct of red blood cell breakdown processed by the liver — elevated levels can indicate liver dysfunction or increased red cell turnover.',
};

const SAMPLE = [
  ['2025-01-10','Hemoglobin',13.1],['2025-04-14','Hemoglobin',12.6],['2025-07-20','Hemoglobin',11.7],['2025-10-02','Hemoglobin',11.2],
  ['2025-01-10','Glucose',91],['2025-04-14','Glucose',97],['2025-07-20','Glucose',104],['2025-10-02','Glucose',112],
  ['2025-01-10','LDL',118],['2025-04-14','LDL',109],['2025-07-20','LDL',96],['2025-10-02','LDL',88],
  ['2025-01-10','TSH',2.1],['2025-04-14','TSH',2.4],['2025-07-20','TSH',3.6],['2025-10-02','TSH',4.8],
];

function flagOf(value, low, high) {
  if (value == null || low == null || high == null) return 'unknown';
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'normal';
}

function flagColor(flag) {
  if (flag === 'high') return COLORS.red;
  if (flag === 'low') return COLORS.amber;
  return COLORS.tealDark;
}

function flagLabel(flag) {
  if (flag === 'high') return 'above range';
  if (flag === 'low') return 'below range';
  if (flag === 'unknown') return 'no reference range';
  return 'in range';
}

function fmtDate(d) {
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Describes the shape of a test's own history — separate from whether the
// latest value sits inside the population reference range. This is a simple
// heuristic for a quick read, not a clinical trend analysis.
function trendOf(list) {
  if (!list || list.length < 2) return null;
  const values = list.map(e => e.value);
  const n = values.length;
  const last = values[n - 1];
  const lastEntry = list[n - 1];
  const hist = values.slice(0, -1);
  const histMean = hist.reduce((a, b) => a + b, 0) / hist.length;
  const histStd = hist.length > 1
    ? Math.sqrt(hist.reduce((a, b) => a + (b - histMean) ** 2, 0) / hist.length)
    : Math.abs(histMean) * 0.08;
  const spread = Math.max(histStd, Math.abs(histMean) * 0.04, 0.01);
  const deviates = Math.abs(last - histMean) > spread * 1.6;

  if (deviates) {
    const direction = last > histMean ? 'higher' : 'lower';
    const icon = direction === 'higher' ? '↑' : '↓';
    if (lastEntry.flag === 'normal') {
      return {
        label: `Still within range, but ${direction} than your usual baseline.`,
        icon, tone: COLORS.amber, deviates: true,
      };
    }
    return { label: 'Outside your usual range', icon: '◆', tone: COLORS.amber, deviates: true };
  }

  const first = values[0];
  const pctChange = first !== 0 ? (last - first) / Math.abs(first) : (last - first);
  if (Math.abs(pctChange) < 0.05) {
    return { label: 'Stable over time', icon: '→', tone: COLORS.inkSoft, deviates: false };
  }
  if (last > first) {
    return { label: 'Gradually increasing', icon: '↑', tone: COLORS.inkSoft, deviates: false };
  }
  return { label: 'Recently decreased', icon: '↓', tone: COLORS.inkSoft, deviates: false };
}

// Status shown in the test list: reflects both where the latest value sits
// relative to the reference range, and whether it's an outlier for this
// person specifically — a value can be "in range" but still worth a second
// look if it's unusual for that individual's own history.
function statusOf(list) {
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1];
  const trend = trendOf(list);

  if (last.flag === 'unknown') return 'Monitor';

  if (last.flag === 'normal') {
    return trend && trend.deviates ? 'Monitor' : 'Normal';
  }

  // high or low — gauge how far past the boundary, relative to the range's own width
  const rangeWidth = (last.high ?? 0) - (last.low ?? 0);
  if (!rangeWidth || rangeWidth <= 0) return 'Monitor';
  const overshoot = last.flag === 'high' ? (last.value - last.high) : (last.low - last.value);
  const ratio = overshoot / rangeWidth;
  return ratio > 0.25 ? 'Consult Physician' : 'Monitor';
}

function statusColor(status) {
  if (status === 'Normal') return COLORS.greenText;
  if (status === 'Consult Physician') return COLORS.redText;
  return COLORS.amberText; // Monitor
}

function statusBg(status) {
  if (status === 'Normal') return COLORS.greenBg;
  if (status === 'Consult Physician') return COLORS.redBg;
  return COLORS.amberBg; // Monitor
}

function statusLine(status) {
  if (status === 'Normal') return COLORS.greenLine;
  if (status === 'Consult Physician') return COLORS.redLine;
  return COLORS.amberLine; // Monitor
}

// Display naming used by the grouped home view and detail badges — distinct
// from the internal `status` value, which drives logic elsewhere in the file.
function badgeLabel(status) {
  if (status === 'Consult Physician') return 'Outside range';
  if (status === 'Monitor') return 'Monitor';
  return 'In range';
}

function groupLabel(status) {
  if (status === 'Consult Physician') return 'Needs attention';
  if (status === 'Monitor') return 'Monitor';
  return 'In range';
}

function groupKey(status) {
  if (status === 'Consult Physician') return 'attn';
  if (status === 'Monitor') return 'mon';
  return 'ok';
}

// Baseline = mean of every recorded result for this test so far. Used both
// for the per-row "compared to baseline" column and the key-takeaways card,
// so the term means one consistent thing throughout the app.
function baselineOf(list) {
  if (!list || list.length === 0) return null;
  const values = list.map(e => e.value);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function comparedToBaseline(value, baseline) {
  if (baseline == null) return null;
  const deadZone = Math.max(Math.abs(baseline) * 0.03, 0.01);
  if (value > baseline + deadZone) return { direction: 'higher', icon: '↑' };
  if (value < baseline - deadZone) return { direction: 'lower', icon: '↓' };
  return { direction: 'about', icon: '→' };
}

function cmpWord(cmp, style) {
  if (!cmp) return '–';
  if (style === 'usual') return cmp.direction === 'higher' ? 'Higher than usual' : cmp.direction === 'lower' ? 'Lower than usual' : 'About usual';
  return cmp.direction === 'higher' ? 'Higher than your baseline' : cmp.direction === 'lower' ? 'Lower than your baseline' : 'About your baseline';
}

// A short read on the last few results specifically (distinct from the
// whole-history trend), plus the numeric swing across that same window.
function last3Summary(list) {
  if (!list || list.length < 2) return null;
  const windowSize = Math.min(3, list.length);
  const win = list.slice(-windowSize);
  const change = win[win.length - 1].value - win[0].value;
  const unit = win[win.length - 1].unit;
  let direction = 'steady';
  if (change > 0) direction = 'up';
  if (change < 0) direction = 'down';
  return { windowSize, change, unit, direction };
}

function overallConclusion(status) {
  if (status === 'Normal') return { label: 'Looking good', color: COLORS.greenText };
  if (status === 'Consult Physician') return { label: 'Worth discussing with your doctor', color: COLORS.redText };
  return { label: 'Worth monitoring', color: COLORS.amberText };
}

function statusPhraseOf(list) {
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1];
  if (last.flag === 'unknown') return { label: 'No reference range set', color: COLORS.inkSoft };
  if (last.flag === 'normal') return { label: 'Within normal range', color: COLORS.greenText };
  return { label: last.flag === 'high' ? 'Above range' : 'Below range', color: COLORS.redText };
}

function trendPhraseOf(last3) {
  if (!last3) return null;
  if (last3.direction === 'up') return 'Increasing trend';
  if (last3.direction === 'down') return 'Decreasing trend';
  return 'Steady trend';
}

// Detects: current result is in range, but the 1-2 results immediately
// before it (within the last-3 window only — not the whole history) were
// consistently on one side of the range. Framed as "recovering" since it's
// specifically a return to normal, not just any in-range reading.
function recoveryPattern(list) {
  if (!list || list.length < 2) return null;
  const windowSize = Math.min(3, list.length);
  const win = list.slice(-windowSize);
  const last = win[win.length - 1];
  const prior = win.slice(0, -1);
  if (last.flag !== 'normal' || prior.length === 0) return null;
  if (prior.every(e => e.flag === 'high')) return 'high';
  if (prior.every(e => e.flag === 'low')) return 'low';
  return null;
}

function finalOverall(status, recovery) {
  if (recovery) return { label: 'Returning to normal levels. This is an improving trend.', color: COLORS.greenText };
  const base = overallConclusion(status);
  return { label: `${base.label}.`, color: base.color };
}

function downloadCSV(testName, list) {
  const rows = list.map(e => ({
    date: e.date, test: e.test, value: e.value, unit: e.unit, low: e.low, high: e.high, notes: e.notes || '',
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${testName.replace(/\s+/g, '_')}_results.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function IconVial({ size = 20, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 2h6M10 2v7.5L5.5 18a2.5 2.5 0 0 0 2.2 3.7h8.6a2.5 2.5 0 0 0 2.2-3.7L14 9.5V2" />
      <path d="M7.2 15h9.6" />
    </svg>
  );
}
function IconLink({ size = 18, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.5l1-1a3.5 3.5 0 0 1 5 5l-1 1" />
      <path d="M13 17.5l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
    </svg>
  );
}
function IconFlask({ size = 18, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8" />
      <path d="M10 2v7l-5.2 9a1.8 1.8 0 0 0 1.6 2.6h11.2a1.8 1.8 0 0 0 1.6-2.6L14 9V2" />
      <path d="M6.5 15h11" />
    </svg>
  );
}
function IconAlert({ size = 18, color = COLORS.red }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 2.5 20h19L12 3.5z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}
function IconRadar({ size = 18, color = COLORS.amber }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}
function IconArrowLeft({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}
function IconLightbulb({ size = 20, color = COLORS.amber }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" />
    </svg>
  );
}
function IconInfo({ size = 15, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill={color} stroke="none" />
    </svg>
  );
}
function IconDownload({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}
function IconShield({ size = 18, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}
function IconTrend({ direction = 'flat', size = 18, color = COLORS.inkSoft }) {
  const d = direction === 'up' ? 'M4 16l6-6 4 4 6-8' : direction === 'down' ? 'M4 8l6 6 4-4 6 8' : 'M4 12h16';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
function IconBarChart({ size = 18, color = COLORS.inkSoft }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 20V10" /><path d="M12 20V4" /><path d="M19 20v-7" />
    </svg>
  );
}
function IconTarget({ size = 18, color = COLORS.inkSoft }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}
function IconCheck({ size = 18, color = COLORS.greenMid }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconChevronDown({ size = 10, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function IconSearch({ size = 14, color = COLORS.inkMuted }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function IconPlus({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconLeaf({ size = 20, color = COLORS.tealDark }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
      <path d="M4 20c8 0 15-6 16-16-8 1-14 6-16 16z" />
      <path d="M6 18c3-4 7-7 12-9" />
    </svg>
  );
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={flagColor(payload.flag)} stroke="#fff" strokeWidth={1.5} />;
};

function OverviewStat({ count, label, valueColor }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 13, padding: '16px 15px', textAlign: 'center' }}>
      <div className="panel-num" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: valueColor || COLORS.ink }}>{count}</div>
      <div style={{ fontSize: 10.5, color: COLORS.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function KeyTakeawaysPanel({ statusPhrase, last3, latestCmp, recovery, overall, latestValue }) {
  const trendLabel = trendPhraseOf(last3);
  const baselineLabel = recovery
    ? `Previously ${recovery === 'high' ? 'above' : 'below'} range`
    : (latestCmp ? `${cmpWord(latestCmp, 'usual')} ${latestCmp.icon}` : '–');

  return (
    <div className="card" style={{ padding: '22px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
        <IconCheck size={20} color={COLORS.greenMid} />
        <div style={{ fontSize: 14.5, fontWeight: 700, color: overall ? overall.color : COLORS.greenText }}>
          {statusPhrase ? statusPhrase.label : 'Status'}{overall ? ` — ${overall.label.replace(/\.$/, '')}` : ''}
        </div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        paddingTop: 15, borderTop: `1px solid ${COLORS.borderSoft}`,
      }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Trend</div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>
            {trendLabel || '–'}
            {last3 && <span className="panel-num" style={{ fontWeight: 500 }}> ({last3.change > 0 ? '+' : ''}{Math.round(last3.change * 100) / 100} {last3.unit})</span>}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>vs. Baseline</div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{baselineLabel}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Latest</div>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>{latestValue || '–'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Overall</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: overall ? overall.color : COLORS.ink }}>{overall ? overall.label.replace(/\.$/, '') : '–'}</div>
        </div>
      </div>
    </div>
  );
}

// Small inline sparkline for the collapsed test cards on the home view —
// normalized 0..1 within this test's own history so shape is always visible.
function Sparkline({ list, color }) {
  if (!list || list.length < 2) return null;
  const values = list.map(e => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 300, h = 36, pad = 6;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" />
    </svg>
  );
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function ageFromDOB(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth)) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function Panel() {
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), test: 'Hemoglobin', custom: '', value: '', unit: '', low: '', high: '' });
  const [importMsg, setImportMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [profile, setProfile] = useState({ name: '', dob: '', sex: '' });
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAllOk, setShowAllOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get('entries', false);
        if (result && result.value) {
          setEntries(JSON.parse(result.value));
        }
      } catch (err) {
        // no saved data yet, or a read error — start empty either way
      }
      try {
        const result = await window.storage.get('profile', false);
        if (result && result.value) {
          const p = JSON.parse(result.value);
          setProfile(p);
          setProfileOpen(!p.name);
        } else {
          setProfileOpen(true);
        }
      } catch (err) {
        setProfileOpen(true);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const result = await window.storage.set('entries', JSON.stringify(entries), false);
        setStorageError(result ? '' : 'Could not save — your changes may not persist.');
      } catch (err) {
        setStorageError('Could not save — your changes may not persist.');
      }
    })();
  }, [entries, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set('profile', JSON.stringify(profile), false);
      } catch (err) {
        // profile save failed silently — entries storageError already surfaces the bigger issue
      }
    })();
  }, [profile, loaded]);

  async function clearAllData() {
    try {
      await window.storage.delete('entries', false);
    } catch (err) {
      // ignore — clearing local state regardless
    }
    setEntries([]);
    setSelected([]);
  }

  const testNames = useMemo(() => {
    const set = new Set(entries.map(e => e.test));
    return Array.from(set);
  }, [entries]);

  const byTest = useMemo(() => {
    const map = {};
    for (const t of testNames) {
      map[t] = entries
        .filter(e => e.test === t)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return map;
  }, [entries, testNames]);

  function addEntry() {
    const testName = form.test === '__custom__' ? form.custom.trim() : form.test;
    if (!testName) { setFormError('Enter a name for the custom test.'); return; }
    if (!form.date) { setFormError('Pick a date.'); return; }
    if (form.value === '' || isNaN(parseFloat(form.value))) { setFormError('Enter a numeric value.'); return; }
    setFormError('');
    const lib = TEST_LIBRARY[testName];
    const low = form.low !== '' ? parseFloat(form.low) : (lib ? lib.low : null);
    const high = form.high !== '' ? parseFloat(form.high) : (lib ? lib.high : null);
    const unit = form.unit || (lib ? lib.unit : '');
    const value = parseFloat(form.value);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: form.date, test: testName, value, unit, low, high, notes: '',
      flag: flagOf(value, low, high),
    };
    setEntries(prev => [...prev, entry]);
    setSelected(prev => prev.includes(testName) ? prev : [...prev, testName]);
    setForm(f => ({ ...f, value: '', low: '', high: '' }));
  }

  function updateNote(id, notes) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, notes } : e));
  }

  function removeEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function loadSample() {
    const built = SAMPLE.map(([date, test, value]) => {
      const lib = TEST_LIBRARY[test];
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date, test, value, unit: lib.unit, low: lib.low, high: lib.high, notes: '',
        flag: flagOf(value, lib.low, lib.high),
      };
    });
    setEntries(built);
    setSelected(['Hemoglobin']);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      Papa.parse(ev.target.result, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          const rows = res.data;
          const built = [];
          for (const row of rows) {
            const norm = {};
            Object.keys(row).forEach(k => { norm[k.trim().toLowerCase()] = row[k]; });
            const date = norm.date;
            const test = norm.test || norm.name;
            const value = parseFloat(norm.value);
            if (!date || !test || isNaN(value)) continue;
            const lib = TEST_LIBRARY[test];
            const low = norm.low !== undefined && norm.low !== '' ? parseFloat(norm.low) : (lib ? lib.low : null);
            const high = norm.high !== undefined && norm.high !== '' ? parseFloat(norm.high) : (lib ? lib.high : null);
            const unit = norm.unit || (lib ? lib.unit : '');
            built.push({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              date, test, value, unit, low, high, notes: norm.notes || '',
              flag: flagOf(value, low, high),
            });
          }
          if (built.length === 0) {
            setImportMsg('No usable rows found. Expect columns: date, test, value (unit, low, high optional).');
          } else {
            setEntries(prev => [...prev, ...built]);
            setSelected(prev => Array.from(new Set([...prev, ...built.slice(0, 1).map(b => b.test)])));
            setImportMsg(`Imported ${built.length} result${built.length === 1 ? '' : 's'}.`);
          }
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function toggleSelect(t) {
    setSelected(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  const flaggedCount = entries.filter(e => e.flag === 'high' || e.flag === 'low').length;
  const monitorCount = testNames.filter(t => statusOf(byTest[t]) === 'Monitor').length;

  const visibleTestNames = testNames.filter(t => t.toLowerCase().includes(search.trim().toLowerCase()));
  const grouped = { attn: [], mon: [], ok: [] };
  visibleTestNames.forEach(t => {
    grouped[groupKey(statusOf(byTest[t]))].push(t);
  });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia ? window.matchMedia('(max-width: 780px)').matches : window.innerWidth <= 780;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia ? window.matchMedia('(max-width: 780px)') : null;
    function check() { setIsMobile(mq ? mq.matches : window.innerWidth <= 780); }
    check(); // re-measure right after mount, in case the very first synchronous read was premature
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', check);
      else mq.addListener(check); // older Safari/WebKit fallback
    }
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', check);
        else mq.removeListener(check);
      }
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  const singleMode = selected.length === 1;
  const compareMode = selected.length > 1;

  const singleData = singleMode ? byTest[selected[0]] : [];
  const singleRef = singleMode && singleData.length ? { low: singleData[0].low, high: singleData[0].high, unit: singleData[0].unit } : null;
  const singleStatus = singleMode && singleData.length > 0 ? statusOf(singleData) : null;
  const singleTrend = singleMode && singleData.length > 0 ? trendOf(singleData) : null;
  const singleLast3 = singleMode && singleData.length > 0 ? last3Summary(singleData) : null;
  const singleBaseline = singleMode && singleData.length > 0 ? baselineOf(singleData) : null;
  const singleConclusion = singleStatus ? overallConclusion(singleStatus) : null;
  const singleRecovery = singleMode && singleData.length > 0 ? recoveryPattern(singleData) : null;
  const singleLatestCmp = (singleBaseline != null && singleData.length > 0) ? comparedToBaseline(singleData[singleData.length - 1].value, singleBaseline) : null;

  const compareData = useMemo(() => {
    if (!compareMode) return [];
    const allDates = Array.from(new Set(selected.flatMap(t => (byTest[t] || []).map(e => e.date))))
      .sort((a, b) => new Date(a) - new Date(b));
    return allDates.map(date => {
      const row = { date };
      selected.forEach(t => {
        const e = (byTest[t] || []).find(x => x.date === date);
        if (e && e.low != null && e.high != null && e.high !== e.low) {
          row[t] = Math.round(((e.value - e.low) / (e.high - e.low)) * 100);
        } else {
          row[t] = null;
        }
      });
      return row;
    });
  }, [compareMode, selected, byTest]);

  if (!loaded) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: COLORS.paper, color: COLORS.inkSoft, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, fontSize: 14 }}>
        Loading your saved results…
      </div>
    );
  }

  function renderAddResultForm() {
    return (
      <div className="card" style={{ maxWidth: 440, margin: '0 auto 28px', padding: '22px 24px', textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 14 }}>Add a result</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <input className="panel-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <select className="panel-select" value={form.test} onChange={e => setForm(f => ({ ...f, test: e.target.value, unit: '' }))}>
            {Object.keys(TEST_LIBRARY).map(t => <option key={t} value={t}>{t}</option>)}
            <option value="__custom__">Custom test…</option>
          </select>
          {form.test === '__custom__' && (
            <input className="panel-input" placeholder="Test name" value={form.custom} onChange={e => setForm(f => ({ ...f, custom: e.target.value }))} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="panel-input" type="number" step="any" placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            <input className="panel-input" placeholder="Unit" style={{ width: 90 }} value={form.unit || (TEST_LIBRARY[form.test] ? TEST_LIBRARY[form.test].unit : '')} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="panel-input" type="number" step="any" placeholder={`Low${TEST_LIBRARY[form.test] ? ` (${TEST_LIBRARY[form.test].low})` : ''}`} value={form.low} onChange={e => setForm(f => ({ ...f, low: e.target.value }))} />
            <input className="panel-input" type="number" step="any" placeholder={`High${TEST_LIBRARY[form.test] ? ` (${TEST_LIBRARY[form.test].high})` : ''}`} value={form.high} onChange={e => setForm(f => ({ ...f, high: e.target.value }))} />
          </div>
          <button className="btn-primary" type="button" onClick={addEntry} style={{ justifyContent: 'center', marginTop: 2 }}>Add result</button>
          {formError && <div style={{ fontSize: 12, color: COLORS.redText }}>{formError}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: `1px solid ${COLORS.borderSoft}` }}>
          <label className="panel-btn" style={{ fontSize: 12, padding: '7px 12px' }}>
            Import CSV
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          {entries.length > 0 && (
            <span onClick={clearAllData} style={{ fontSize: 11.5, color: COLORS.inkMuted, cursor: 'pointer' }}>Clear all data</span>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: COLORS.inkMuted, marginTop: 8, lineHeight: 1.5 }}>
          CSV columns: <span className="panel-num">date, test, value</span> — plus optional <span className="panel-num">unit, low, high</span>.
        </div>
        {importMsg && <div style={{ fontSize: 12, marginTop: 8, color: COLORS.plum }}>{importMsg}</div>}
      </div>
    );
  }

  function renderTestCard(t, group) {
    const list = byTest[t];
    const last = list[list.length - 1];
    const status = statusOf(list);
    const line = statusLine(status);
    // Needs-attention cards get a visibly heavier border than Monitor cards,
    // so urgency reads at a glance before anyone reads the badge text.
    const borderWidth = group === 'attn' ? 3 : group === 'mon' ? 1.5 : 1;
    const badgeClass = status === 'Consult Physician' ? 'badge-outside' : status === 'Monitor' ? 'badge-monitor' : 'badge-range';
    return (
      <div key={t} className="test-card" style={{ border: `${borderWidth}px solid ${line}` }} onClick={() => setSelected([t])}>
        <div className="test-card-top">
          <div>
            <p className="name">{t}</p>
            <p className="val">{last.value} {last.unit} · last checked {fmtDate(last.date)}</p>
          </div>
          <span className={`badge ${badgeClass}`}>{badgeLabel(status)}</span>
        </div>
        <Sparkline list={list} color={line} />
        <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: COLORS.inkMuted, cursor: 'pointer' }}>
          <input type="checkbox" checked={selected.includes(t)} onChange={() => toggleSelect(t)} /> Compare with others
        </label>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: COLORS.paper, color: COLORS.ink, minHeight: '600px', borderRadius: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .panel-h1 { font-family: Georgia, 'Times New Roman', serif; }
        .panel-num { font-family: 'IBM Plex Mono', monospace; }

        .panel-btn { cursor: pointer; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; color: ${COLORS.ink}; }
        .panel-btn:hover { border-color: ${COLORS.plumLine}; color: ${COLORS.plum}; }
        .panel-input, .panel-select { border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 8px 11px; font-size: 13px; font-family: inherit; background: #fff; color: ${COLORS.ink}; width: 100%; box-sizing: border-box; }

        .btn-primary { background: ${COLORS.plum}; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { background: ${COLORS.plumDark}; }

        .card { background: ${COLORS.card}; border-radius: 16px; border: 1px solid ${COLORS.border}; box-shadow: 0 1px 3px rgba(46,37,48,.05), 0 6px 20px rgba(46,37,48,.06); }

        .gold-rule { width: 36px; height: 2px; background: ${COLORS.gold}; margin: 10px auto 0; border-radius: 2px; }

        .badge { display: inline-block; font-size: 10.5px; padding: 4px 10px; border-radius: 20px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
        .badge-monitor { background: ${COLORS.amberBg}; color: ${COLORS.amberText}; }
        .badge-range { background: ${COLORS.greenBg}; color: ${COLORS.greenText}; }
        .badge-outside { background: ${COLORS.redBg}; color: ${COLORS.redText}; }

        .profile-pill { display: inline-flex; align-items: center; gap: 9px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 26px; padding: 7px 16px 7px 7px; cursor: pointer; box-shadow: 0 1px 3px rgba(46,37,48,.05); }
        .avatar { width: 28px; height: 28px; border-radius: 50%; background: ${COLORS.plumTint}; color: ${COLORS.plum}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11.5px; flex: none; }

        .search-box { display: flex; align-items: center; gap: 8px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 11px 15px; }
        .search-box input { border: none; background: transparent; outline: none; font-size: 13px; color: ${COLORS.ink}; width: 100%; font-family: inherit; }
        .search-box input::placeholder { color: ${COLORS.inkMuted}; }

        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 620px) { .stat-grid { grid-template-columns: 1fr 1fr; } }

        .group-label { font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
        .group-label.attn { color: ${COLORS.redLine}; }
        .group-label.mon { color: ${COLORS.amberLine}; }
        .group-label.ok { color: ${COLORS.greenLine}; }

        .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 620px) { .test-grid { grid-template-columns: 1fr; } }
        .test-card { border-radius: 16px; padding: 20px 22px; cursor: pointer; background: ${COLORS.card}; box-shadow: 0 1px 3px rgba(46,37,48,.05); }
        .test-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .test-card .name { margin: 0; font-size: 16px; font-weight: 700; font-family: Georgia, serif; }
        .test-card .val { margin: 4px 0 0; font-size: 12px; color: ${COLORS.inkMuted}; }

        .collapsed-note { font-size: 12px; color: ${COLORS.inkMuted}; padding: 12px 18px; cursor: pointer; border: 1px dashed ${COLORS.border}; border-radius: 14px; display: inline-flex; align-items: center; gap: 7px; }

        .hist-row { display: flex; justify-content: space-between; padding: 12px 18px; font-size: 13px; border-bottom: 1px solid ${COLORS.borderSoft}; gap: 12px; flex-wrap: wrap; }
        .hist-row:last-child { border-bottom: none; }

        .footer { text-align: center; padding: 6px 24px 22px; }
        .footer p { margin: 0; font-size: 11.5px; color: ${COLORS.inkMuted}; line-height: 1.7; }
        .footer .drname { color: ${COLORS.plum}; font-style: italic; font-weight: 600; }
      `}</style>

      <div style={{ padding: isMobile ? '28px 16px 4px' : '40px 44px 4px' }}>

        {selected.length === 0 ? (
          <>
            {/* ===== Centered header (home) ===== */}
            <div style={{ maxWidth: 640, margin: '0 auto 6px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 2 }}>
                <IconVial size={24} color={COLORS.gold} />
                <span className="panel-h1" style={{ fontSize: 26 }}>Panel</span>
              </div>
              <div className="gold-rule" />
              <div style={{ fontSize: 13, color: COLORS.inkSoft, margin: '10px 0 22px' }}>Understand your results. Take control of your health.</div>

              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                <div className="profile-pill" onClick={() => setProfileOpen(o => !o)}>
                  <div className="avatar">{profile.name ? profile.name.trim()[0].toUpperCase() : '?'}</div>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{profile.name || 'Set up profile'}</span>
                  <IconChevronDown size={11} color={COLORS.inkMuted} />
                </div>
                {profileOpen && (
                  <div className="card" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 240, padding: 16, zIndex: 5, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.inkSoft, marginBottom: 10 }}>Patient profile</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input className="panel-input" placeholder="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                      <input className="panel-input" type="date" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))} />
                      <select className="panel-select" value={profile.sex} onChange={e => setProfile(p => ({ ...p, sex: e.target.value }))}>
                        <option value="">Sex (optional)</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                      {profile.dob && ageFromDOB(profile.dob) != null && (
                        <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{ageFromDOB(profile.dob)} yrs</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="search-box" style={{ width: 260 }}>
                  <IconSearch size={14} />
                  <input placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={() => setFormOpen(o => !o)}>
                  <IconPlus size={13} /> {formOpen ? 'Close' : 'Add a result'}
                </button>
              </div>
            </div>

            {formOpen && renderAddResultForm()}
            {storageError && <div style={{ maxWidth: 460, margin: '0 auto 18px', fontSize: 12, color: COLORS.redText, textAlign: 'center' }}>{storageError}</div>}

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px 60px', color: COLORS.inkSoft }}>
                <div className="panel-h1" style={{ fontSize: 20, marginBottom: 8, color: COLORS.ink }}>Nothing charted yet</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Add a result or import a CSV to start seeing trends.</div>
                <span onClick={loadSample} style={{ color: COLORS.plum, cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>Load sample data</span>
              </div>
            ) : (
              <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 20 }}>
                <div className="stat-grid" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
                  <OverviewStat count={entries.length} label="Total results" />
                  <OverviewStat count={testNames.length} label="Tests tracked" />
                  <OverviewStat count={flaggedCount} label="Outside range" valueColor={flaggedCount ? COLORS.redLine : COLORS.ink} />
                  <OverviewStat count={monitorCount} label="Needs monitoring" valueColor={monitorCount ? COLORS.amberLine : COLORS.ink} />
                </div>

                {visibleTestNames.length === 0 ? (
                  <div style={{ textAlign: 'center', color: COLORS.inkSoft, fontSize: 13.5, padding: '20px 0 40px' }}>No tests match “{search}”.</div>
                ) : (
                  <>
                    {grouped.attn.length > 0 && (
                      <div style={{ marginBottom: 26 }}>
                        <div className="group-label attn"><IconAlert size={11} color={COLORS.redLine} /> Needs attention</div>
                        <div className="test-grid">{grouped.attn.map(t => renderTestCard(t, 'attn'))}</div>
                      </div>
                    )}
                    {grouped.mon.length > 0 && (
                      <div style={{ marginBottom: 26 }}>
                        <div className="group-label mon">Monitor</div>
                        <div className="test-grid">{grouped.mon.map(t => renderTestCard(t, 'mon'))}</div>
                      </div>
                    )}
                    {grouped.ok.length > 0 && (
                      <div style={{ marginBottom: 26 }}>
                        <div className="group-label ok">In range</div>
                        {!showAllOk ? (
                          <div className="collapsed-note" onClick={() => setShowAllOk(true)}>
                            <IconChevronDown size={10} /> {grouped.ok.length} test{grouped.ok.length === 1 ? '' : 's'} in range — {grouped.ok.join(', ')}
                          </div>
                        ) : (
                          <div className="test-grid">{grouped.ok.map(t => renderTestCard(t, 'ok'))}</div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {selected.length > 1 && (
                  <div className="card" style={{ padding: '22px 24px', marginTop: 10 }}>
                    <div className="panel-h1" style={{ fontSize: 19, fontWeight: 600, marginBottom: 2 }}>Comparing {selected.length} tests</div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
                      Each line shows position within its own reference range (0–100%), so tests with different units can be read on one chart. The shaded band is the normal zone.
                    </div>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={compareData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
                          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: COLORS.inkSoft }} />
                          <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} domain={[(dataMin) => Math.min(dataMin, -10), (dataMax) => Math.max(dataMax, 110)]} width={44} unit="%" />
                          <ReferenceArea y1={0} y2={100} fill={COLORS.greenBg} fillOpacity={0.6} strokeOpacity={0} />
                          <Tooltip labelFormatter={fmtDate} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          {selected.map((t, i) => (
                            <Line key={t} type="linear" dataKey={t} stroke={COLORS.overlay[i % COLORS.overlay.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 10 }}>
                      <span onClick={() => setSelected([])} style={{ fontSize: 12, color: COLORS.inkMuted, cursor: 'pointer' }}>Clear comparison</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ===== Detail / compare view for a selected test ===== */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 780, margin: '0 auto 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconVial size={20} color={COLORS.gold} />
                <span className="panel-h1" style={{ fontSize: 18 }}>Panel</span>
              </div>
              <div className="profile-pill" style={{ padding: '6px 14px 6px 6px', cursor: 'default' }}>
                <div className="avatar" style={{ width: 24, height: 24, fontSize: 10.5 }}>{profile.name ? profile.name.trim()[0].toUpperCase() : '?'}</div>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{profile.name || 'Patient'}</span>
              </div>
            </div>

            <div style={{ maxWidth: 780, margin: '0 auto' }}>
              <span onClick={() => setSelected([])} style={{ cursor: 'pointer', color: COLORS.plum, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconArrowLeft size={14} /> All tests
              </span>

              {singleMode && singleData.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div className="panel-h1" style={{ fontSize: 26, fontWeight: 400 }}>{selected[0]}</div>
                    {singleStatus && <span className={`badge ${singleStatus === 'Consult Physician' ? 'badge-outside' : singleStatus === 'Monitor' ? 'badge-monitor' : 'badge-range'}`}>{badgeLabel(singleStatus)}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 20, lineHeight: 1.6, maxWidth: 600 }}>
                    {singleRef && singleRef.low != null && singleRef.high != null
                      ? `Reference range ${singleRef.low}–${singleRef.high} ${singleRef.unit}`
                      : 'No reference range set for this test'}
                    {TEST_INFO[selected[0]] ? ` · ${TEST_INFO[selected[0]]}` : ''}
                  </div>

                  {singleTrend ? (() => {
                    const statusPhrase = statusPhraseOf(singleData);
                    const last3 = singleLast3;
                    const overall = finalOverall(singleStatus, singleRecovery);
                    const latest = singleData[singleData.length - 1];
                    return (
                      <KeyTakeawaysPanel
                        statusPhrase={statusPhrase}
                        last3={last3}
                        latestCmp={singleLatestCmp}
                        recovery={singleRecovery}
                        overall={overall}
                        latestValue={`${latest.value} ${latest.unit}, ${fmtDate(latest.date)}`}
                      />
                    );
                  })() : (
                    <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 20 }}>Add another result to start seeing a trend.</div>
                  )}

                  <div className="card" style={{ padding: '22px 20px 8px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 18, fontSize: 11, color: COLORS.inkSoft, marginBottom: 10, flexWrap: 'wrap' }}>
                      {singleRef && singleRef.low != null && singleRef.high != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS.greenLine, display: 'inline-block' }} /> Reference range
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS.plum, display: 'inline-block' }} /> Your results
                      </span>
                      {singleBaseline != null && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, border: `1.5px dashed ${COLORS.goldDark}`, display: 'inline-block' }} /> Your baseline
                        </span>
                      )}
                    </div>
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={singleData} margin={{ top: 16, right: 24, bottom: 0, left: 0 }}>
                          <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
                          <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: COLORS.inkSoft }} />
                          <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} domain={['auto', 'auto']} width={44} />
                          {singleRef && singleRef.low != null && singleRef.high != null && (
                            <ReferenceArea y1={singleRef.low} y2={singleRef.high} fill={COLORS.greenBg} fillOpacity={0.7} strokeOpacity={0} />
                          )}
                          {singleBaseline != null && (
                            <ReferenceLine y={singleBaseline} stroke={COLORS.goldDark} strokeDasharray="4 3" strokeWidth={1.4} />
                          )}
                          <Tooltip
                            formatter={(v, n, p) => [`${v} ${p.payload.unit} (${flagLabel(p.payload.flag)})`, selected[0]]}
                            labelFormatter={fmtDate}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                          />
                          <Line
                            type="linear" dataKey="value" stroke={COLORS.plum} strokeWidth={2.5}
                            dot={<CustomDot />} activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: COLORS.inkSoft,
                    background: COLORS.goldTint, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                    padding: '10px 14px', marginBottom: 20,
                  }}>
                    <IconInfo size={14} color={COLORS.goldDark} />
                    {selected[0]} can vary day to day. Look at the overall trend, not a single number.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 9px' }}>
                    <div style={{ fontSize: 10.5, color: COLORS.inkMuted, letterSpacing: '0.07em', fontWeight: 700, textTransform: 'uppercase' }}>Result history</div>
                    <span onClick={() => downloadCSV(selected[0], singleData)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, color: COLORS.plum, fontWeight: 600, fontSize: 11.5 }}>
                      <IconDownload size={13} /> Download CSV
                    </span>
                  </div>

                  <div className="card" style={{ overflow: 'hidden', marginBottom: 10 }}>
                    {[...singleData].reverse().map(e => {
                      const cmp = singleBaseline != null ? comparedToBaseline(e.value, singleBaseline) : null;
                      return (
                        <div key={e.id} className="hist-row">
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                            <span style={{ color: COLORS.inkMuted, whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</span>
                            <span className="panel-num" style={{ fontWeight: 600 }}>{e.value} {e.unit}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ color: flagColor(e.flag), fontWeight: 600, whiteSpace: 'nowrap' }}>{flagLabel(e.flag)}</span>
                            <span style={{ color: COLORS.inkSoft, whiteSpace: 'nowrap' }}>{cmp ? `${cmpWord(cmp, 'baseline')} ${cmp.icon}` : '–'}</span>
                            {editingNoteId === e.id ? (
                              <input
                                className="panel-input" autoFocus style={{ fontSize: 12, padding: '4px 6px', width: 130 }}
                                value={noteDraft}
                                onChange={ev => setNoteDraft(ev.target.value)}
                                onBlur={() => { updateNote(e.id, noteDraft); setEditingNoteId(null); }}
                                onKeyDown={ev => { if (ev.key === 'Enter') { updateNote(e.id, noteDraft); setEditingNoteId(null); } }}
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingNoteId(e.id); setNoteDraft(e.notes || ''); }}
                                style={{ cursor: 'pointer', color: e.notes ? COLORS.ink : COLORS.inkMuted, fontSize: 12 }}
                              >
                                {e.notes ? e.notes : 'Add note'}
                              </span>
                            )}
                            <span onClick={() => removeEntry(e.id)} style={{ cursor: 'pointer', color: COLORS.inkMuted, fontSize: 11.5 }}>Remove</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkMuted, marginBottom: 30 }}>Baseline calculated from your available results.</div>
                </div>
              )}

              {compareMode && (
                <div className="card" style={{ padding: '22px 24px', marginTop: 16, marginBottom: 30 }}>
                  <div className="panel-h1" style={{ fontSize: 21, fontWeight: 400, marginBottom: 2 }}>Comparing {selected.length} tests</div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
                    Each line shows position within its own reference range (0–100%), so tests with different units can be read on one chart. The shaded band is the normal zone.
                  </div>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compareData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={COLORS.borderSoft} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: COLORS.inkSoft }} />
                        <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} domain={[(dataMin) => Math.min(dataMin, -10), (dataMax) => Math.max(dataMax, 110)]} width={44} unit="%" />
                        <ReferenceArea y1={0} y2={100} fill={COLORS.greenBg} fillOpacity={0.6} strokeOpacity={0} />
                        <Tooltip labelFormatter={fmtDate} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {selected.map((t, i) => (
                          <Line key={t} type="linear" dataKey={t} stroke={COLORS.overlay[i % COLORS.overlay.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="footer">
        <p>Reference ranges are typical adult defaults and vary by lab and individual — confirm against your own lab report, not a substitute for medical advice.</p>
        <p style={{ marginTop: 9 }}>A project of <span className="drname panel-h1">Dr. Fatima Azhar</span> — part of a wider vision to make health data understandable, trackable, and actionable for every patient.</p>
      </div>
    </div>
  );
}
