import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import Papa from 'papaparse';

const COLORS = {
  ink: '#1B2A2E',
  inkSoft: '#5B6B6C',
  paper: '#EEF2EE',
  card: '#FFFFFF',
  border: '#D7DDD6',
  teal: '#1F7A6C',
  tealDark: '#0F4C42',
  tealSoft: 'rgba(31,122,108,0.14)',
  red: '#B23A32',
  redSoft: 'rgba(178,58,50,0.10)',
  amber: '#B4791A',
  amberSoft: 'rgba(180,121,26,0.12)',
  overlay: ['#0F4C42', '#6B5B95', '#3D6E8C', '#946B2D', '#8C3D5B', '#4C6B3D'],
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

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={flagColor(payload.flag)} stroke="#fff" strokeWidth={1.5} />;
};

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
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

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get('entries', false);
        if (result && result.value) {
          setEntries(JSON.parse(result.value));
        }
      } catch (err) {
        // no saved data yet, or a read error — start empty either way
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
      <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: COLORS.paper, color: COLORS.inkSoft, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, fontSize: 14 }}>
        Loading your saved results…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: COLORS.paper, color: COLORS.ink, minHeight: '600px', padding: '0', borderRadius: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
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
        <div className="panel-h1" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em' }}>Panel</div>
        <div style={{ fontSize: 14, color: COLORS.inkSoft, marginTop: 4, maxWidth: 520 }}>
          Track blood work over time. Enter results by hand or import a file, and watch each marker trend against its reference range.
        </div>
        {entries.length > 0 && (
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
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
            return (
              <div key={t} className={`test-row${selected.includes(t) ? ' active' : ''}`} onClick={() => toggleSelect(t)}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: flagColor(last.flag), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{list.length} result{list.length === 1 ? '' : 's'} · last {last.value}{last.unit}</div>
                </div>
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
              <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 16 }}>
                {singleRef && singleRef.low != null && singleRef.high != null
                  ? `Reference range ${singleRef.low}–${singleRef.high} ${singleRef.unit}`
                  : 'No reference range set for this test'}
              </div>
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
    </div>
  );
}
