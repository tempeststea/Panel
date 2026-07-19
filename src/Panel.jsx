import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import Papa from 'papaparse';

const COLORS = {
  ink: '#2A2230',
  inkSoft: '#6B5C6E',
  paper: '#FBF6F2',
  card: '#FFFFFF',
  border: '#E6DADD',
  teal: '#C3AEDD',
  tealDark: '#8A6FA8',
  tealSoft: 'rgba(138,111,168,0.14)',
  red: '#B23A32',
  redSoft: 'rgba(178,58,50,0.10)',
  amber: '#B4791A',
  amberSoft: 'rgba(180,121,26,0.12)',
  overlay: ['#8A6FA8', '#D98CA0', '#4A3355', '#B9A8D9', '#946B2D', '#5B3A5E'],
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
  if (status === 'Normal') return COLORS.tealDark;
  if (status === 'Consult Physician') return COLORS.red;
  return COLORS.amber; // Monitor
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={flagColor(payload.flag)} stroke="#fff" strokeWidth={1.5} />;
};

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
  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState({ date: todayISO(), test: 'Hemoglobin', custom: '', value: '', unit: '', low: '', high: '' });
  const [importMsg, setImportMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [profile, setProfile] = useState({ name: '', dob: '', sex: '' });
  const [profileOpen, setProfileOpen] = useState(false);

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
      date: form.date, test: testName, value, unit, low, high,
      flag: flagOf(value, low, high),
    };
    setEntries(prev => [...prev, entry]);
    setSelected(prev => prev.includes(testName) ? prev : [...prev, testName]);
    setForm(f => ({ ...f, value: '', low: '', high: '' }));
  }

  function removeEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function loadSample() {
    const built = SAMPLE.map(([date, test, value]) => {
      const lib = TEST_LIBRARY[test];
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date, test, value, unit: lib.unit, low: lib.low, high: lib.high,
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
              date, test, value, unit, low, high,
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

  const singleMode = selected.length === 1;
  const compareMode = selected.length > 1;

  const singleData = singleMode ? byTest[selected[0]] : [];
  const singleRef = singleMode && singleData.length ? { low: singleData[0].low, high: singleData[0].high, unit: singleData[0].unit } : null;

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

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: COLORS.paper, color: COLORS.ink, minHeight: '600px', padding: '0', borderRadius: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .panel-h1 { font-family: 'Fraunces', serif; }
        .panel-num { font-family: 'IBM Plex Mono', monospace; }
        .panel-btn { cursor: pointer; border: 1px solid ${COLORS.border}; background: ${COLORS.card}; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 500; color: ${COLORS.ink}; }
        .panel-btn:hover { border-color: ${COLORS.teal}; color: ${COLORS.tealDark}; }
        .panel-input, .panel-select { border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 7px 10px; font-size: 13px; font-family: inherit; background: #fff; color: ${COLORS.ink}; width: 100%; box-sizing: border-box; }
        .test-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; }
        .test-row:hover { background: rgba(0,0,0,0.03); }
        .test-row.active { background: ${COLORS.tealSoft}; border-color: ${COLORS.teal}; }
      `}</style>

      <div style={{ padding: '28px 32px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="panel-h1" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', textAlign: 'center' }}>Panel</div>
        <div style={{ fontSize: 14, color: COLORS.inkSoft, margin: '4px auto 0', maxWidth: 520, textAlign: 'center' }}>
          Track blood work over time. Enter results by hand or import a file, and watch each marker trend against its reference range.
        </div>

        <div style={{ maxWidth: 420, margin: '18px auto 0', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', background: COLORS.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: profileOpen ? 10 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.inkSoft }}>Patient profile</div>
            <button className="panel-btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setProfileOpen(o => !o)}>{profileOpen ? 'Hide' : 'Edit'}</button>
          </div>

          {!profileOpen && (
            <div style={{ fontSize: 14, textAlign: 'center' }}>
              {profile.name ? <span style={{ fontWeight: 500 }}>{profile.name}</span> : <span style={{ color: COLORS.inkSoft }}>No name set</span>}
              {profile.dob && ageFromDOB(profile.dob) != null && <span style={{ color: COLORS.inkSoft }}> · {ageFromDOB(profile.dob)} yrs</span>}
              {profile.sex && <span style={{ color: COLORS.inkSoft }}> · {profile.sex}</span>}
            </div>
          )}

          {profileOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="panel-input" placeholder="Full name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="panel-input" type="date" placeholder="Date of birth" value={profile.dob} onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))} />
                <select className="panel-select" value={profile.sex} onChange={e => setProfile(p => ({ ...p, sex: e.target.value }))}>
                  <option value="">Sex (optional)</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
            <div><span className="panel-num" style={{ fontSize: 20, fontWeight: 500 }}>{entries.length}</span> <span style={{ fontSize: 12, color: COLORS.inkSoft }}>results</span></div>
            <div><span className="panel-num" style={{ fontSize: 20, fontWeight: 500 }}>{testNames.length}</span> <span style={{ fontSize: 12, color: COLORS.inkSoft }}>tests tracked</span></div>
            <div><span className="panel-num" style={{ fontSize: 20, fontWeight: 500, color: flaggedCount ? COLORS.red : COLORS.ink }}>{flaggedCount}</span> <span style={{ fontSize: 12, color: COLORS.inkSoft }}>outside range</span></div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 300, minWidth: 260, flex: '0 0 300px', borderRight: `1px solid ${COLORS.border}`, padding: '20px 20px 32px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.inkSoft }}>Add a result</div>
            <button className="panel-btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setFormOpen(o => !o)}>{formOpen ? 'Hide' : 'Show'}</button>
          </div>

          {formOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
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
              <button className="panel-btn" type="button" onClick={addEntry} style={{ background: COLORS.tealDark, color: '#fff', borderColor: COLORS.tealDark }}>Add result</button>
              {formError && <div style={{ fontSize: 12, color: COLORS.red }}>{formError}</div>}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.inkSoft, marginBottom: 10 }}>Import a file</div>
          <label className="panel-btn" style={{ display: 'block', textAlign: 'center', marginBottom: 6 }}>
            Choose CSV file
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            Columns: <span className="panel-num">date, test, value</span> — plus optional <span className="panel-num">unit, low, high</span>.
          </div>
          {importMsg && <div style={{ fontSize: 12, marginTop: 8, color: COLORS.tealDark }}>{importMsg}</div>}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: COLORS.inkSoft, margin: '24px 0 10px' }}>Tests tracked</div>
          {storageError && <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 8 }}>{storageError}</div>}
          {testNames.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
              No results yet. <span onClick={loadSample} style={{ color: COLORS.tealDark, cursor: 'pointer', fontWeight: 500 }}>Load sample data</span> to see how it works.
            </div>
          )}
          {testNames.map(t => {
            const list = byTest[t];
            const last = list[list.length - 1];
            const status = statusOf(list);
            return (
              <div key={t} className={`test-row${selected.includes(t) ? ' active' : ''}`} onClick={() => toggleSelect(t)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: flagColor(last.flag), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{list.length} result{list.length === 1 ? '' : 's'} · last {last.value}{last.unit}</div>
                </div>
                {status && (
                  <div style={{
                    fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
                    color: statusColor(status), whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8,
                  }}>{status}</div>
                )}
              </div>
            );
          })}
          {entries.length > 0 && (
            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <span onClick={clearAllData} style={{ fontSize: 11, color: COLORS.inkSoft, cursor: 'pointer' }}>Clear all data</span>
            </div>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 320, padding: '24px 28px 32px' }}>
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.inkSoft }}>
              <div className="panel-h1" style={{ fontSize: 20, marginBottom: 8, color: COLORS.ink }}>Nothing charted yet</div>
              <div style={{ fontSize: 14 }}>Add a result or import a CSV to start seeing trends.</div>
            </div>
          )}

          {entries.length > 0 && selected.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.inkSoft, fontSize: 14 }}>
              Select a test from the left to see its trend. Select more than one to compare them side by side.
            </div>
          )}

          {singleMode && singleData.length > 0 && (
            <div>
              <div className="panel-h1" style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>{selected[0]}</div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: TEST_INFO[selected[0]] ? 8 : 16 }}>
                {singleRef && singleRef.low != null && singleRef.high != null
                  ? `Reference range ${singleRef.low}–${singleRef.high} ${singleRef.unit}`
                  : 'No reference range set for this test'}
              </div>
              {TEST_INFO[selected[0]] && (
                <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.6, maxWidth: 560, marginBottom: 16 }}>
                  {TEST_INFO[selected[0]]}
                </div>
              )}
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={singleData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: COLORS.inkSoft }} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} domain={['auto', 'auto']} width={44} />
                    {singleRef && singleRef.low != null && singleRef.high != null && (
                      <ReferenceArea y1={singleRef.low} y2={singleRef.high} fill={COLORS.teal} fillOpacity={0.12} strokeOpacity={0} />
                    )}
                    <Tooltip
                      formatter={(v, n, p) => [`${v} ${p.payload.unit} (${flagLabel(p.payload.flag)})`, selected[0]]}
                      labelFormatter={fmtDate}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                    />
                    <Line type="monotone" dataKey="value" stroke={COLORS.tealDark} strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {(() => {
                const trend = trendOf(singleData);
                if (!trend) {
                  return (
                    <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 10 }}>
                      Add another result to start seeing a trend.
                    </div>
                  );
                }
                return (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                    fontSize: 13, fontWeight: 500, color: trend.tone,
                  }}>
                    <span style={{ fontSize: 14 }}>{trend.icon}</span>
                    {trend.label}
                  </div>
                );
              })()}

              <table style={{ width: '100%', fontSize: 13, marginTop: 20, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.inkSoft, textAlign: 'left' }}>
                    <th style={{ padding: '6px 4px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '6px 4px', fontWeight: 500 }}>Value</th>
                    <th style={{ padding: '6px 4px', fontWeight: 500 }}>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...singleData].reverse().map(e => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '7px 4px' }}>{fmtDate(e.date)}</td>
                      <td className="panel-num" style={{ padding: '7px 4px' }}>{e.value} {e.unit}</td>
                      <td style={{ padding: '7px 4px', color: flagColor(e.flag), fontWeight: 500 }}>{flagLabel(e.flag)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                        <span onClick={() => removeEntry(e.id)} style={{ cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12 }}>Remove</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {compareMode && (
            <div>
              <div className="panel-h1" style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>Comparing {selected.length} tests</div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
                Each line shows position within its own reference range (0–100%), so tests with different units can be read on one chart. The shaded band is the normal zone.
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: COLORS.inkSoft }} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} domain={[(dataMin) => Math.min(dataMin, -10), (dataMax) => Math.max(dataMax, 110)]} width={44} unit="%" />
                    <ReferenceArea y1={0} y2={100} fill={COLORS.teal} fillOpacity={0.10} strokeOpacity={0} />
                    <Tooltip labelFormatter={fmtDate} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {selected.map((t, i) => (
                      <Line key={t} type="monotone" dataKey={t} stroke={COLORS.overlay[i % COLORS.overlay.length]} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 32px', borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.inkSoft }}>
        Reference ranges are typical adult defaults and vary by lab and individual — confirm against your own lab report, not a substitute for medical advice.
      </div>
      <div style={{ padding: '10px 32px 20px', textAlign: 'center', fontSize: 11.5, color: COLORS.inkSoft }}>
        A project of <span className="panel-h1" style={{ fontStyle: 'italic', color: COLORS.tealDark }}>Dr. Fatima Azhar</span> — part of a wider vision to make health data understandable, trackable, and actionable for every patient.
      </div>
    </div>
  );
}
