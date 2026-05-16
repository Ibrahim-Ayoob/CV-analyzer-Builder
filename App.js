import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';
import CVBuilder from './builder/CVBuilder';

// ── Point this at your Flask server ───────────────────────────────────────
const API_BASE = "http://localhost:8080";

// ── Helpers ────────────────────────────────────────────────────────────────
function gradeColor(g) {
  if (!g) return '#888';
  if (g.startsWith('A')) return '#4ade80';
  if (g.startsWith('B')) return '#60a5fa';
  if (g.startsWith('C')) return '#fbbf24';
  return '#f87171';
}
function scoreColor(s) {
  if (s >= 80) return '#4ade80';
  if (s >= 60) return '#60a5fa';
  if (s >= 40) return '#fbbf24';
  return '#f87171';
}

function CircleScore({ score, size = 120 }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e2e" strokeWidth={10}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
    </svg>
  );
}

function ProgressBar({ value, max, color }) {
  return (
    <div className="prog-track">
      <div className="prog-fill" style={{ width: `${Math.round(value/max*100)}%`, background: color }}/>
    </div>
  );
}

const STEPS = ['Uploading file…','Extracting text…','Parsing sections…','Running AI…','Building report…'];

// ── Backend status banner ──────────────────────────────────────────────────
function StatusBanner({ status }) {
  if (status === 'ok') return null;
  if (status === 'checking') return (
    <div className="banner banner-info">⏳ Connecting to backend at {API_BASE}…</div>
  );
  if (status === 'no_key') return (
    <div className="banner banner-warn">
      ⚠️ <strong>Backend is running but GROQ_API_KEY is missing.</strong><br/>
      Open <code>backend/.env</code>, set <code>GROQ_API_KEY=gsk_...</code>, then restart Flask.
    </div>
  );
  return (
    <div className="banner banner-error">
      ❌ <strong>Cannot reach the Flask backend at {API_BASE}</strong><br/>
      Make sure you ran <code>python app.py</code> inside the <code>backend/</code> folder
      (or use <code>start.sh</code> / <code>start.bat</code>).
    </div>
  );
}

// ── Home page — choose Analyze or Build ──────────────────────────────────
function HomePage({ backendStatus, onBuild, onResult, mode }) {
  return (
    <div className="home-page">
      <header className="site-header">
        <div className="logo"><span className="logo-icon">◈</span><span>CV<strong>Analyzer</strong></span></div>
        <p className="tagline">AI-powered resume tools · Powered by Groq AI</p>
      </header>
      <StatusBanner status={backendStatus}/>
      <div className="home-cards">
        <div className="home-card">
          <div className="home-card-icon">📊</div>
          <h2 className="home-card-title">Analyze My CV</h2>
          <p className="home-card-desc">Upload your existing CV and get an AI score out of 100, section-by-section feedback, ATS compatibility check, and actionable tips.</p>
          <UploadView onResult={onResult} backendStatus={backendStatus} />
        </div>
        <div className="home-card home-card-build">
          <div className="home-card-icon">✨</div>
          <h2 className="home-card-title">Build My CV</h2>
          <p className="home-card-desc">Start from scratch with a professional template. Fill in your details and download a polished, ready-to-send PDF resume.</p>
          <div className="home-templates-preview">
            <span style={{background:'#6366f1'}} className="tpl-dot-prev" />
            <span style={{background:'#1e3a5f'}} className="tpl-dot-prev" />
            <span style={{background:'#111'}}    className="tpl-dot-prev" />
            <span style={{background:'#0ea5e9'}} className="tpl-dot-prev" />
            <span className="tpl-label-prev">4 templates</span>
          </div>
          <button className="build-btn" onClick={onBuild}>Start Building →</button>
        </div>
      </div>
    </div>
  );
}

// ── Upload view ────────────────────────────────────────────────────────────
function UploadView({ onResult, backendStatus }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0);

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: fs => {
      const code = fs[0]?.errors[0]?.code;
      toast.error(code === 'file-too-large' ? 'File exceeds 10 MB' : 'Unsupported file type');
    },
  });

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true); setStep(0);
    const tick = setInterval(() => setStep(i => Math.min(i+1, STEPS.length-1)), 1600);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axios.post(`${API_BASE}/result`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      clearInterval(tick);
      onResult(data, file.name);
    } catch (err) {
      clearInterval(tick);
      setLoading(false); setStep(0);

      let msg = 'Something went wrong.';
      if (!err.response) {
        // Network error – backend not reachable
        msg = `Cannot reach backend at ${API_BASE}. Make sure Flask is running (python app.py).`;
      } else {
        const serverMsg = err.response?.data?.error;
        if (serverMsg) msg = serverMsg;
      }
      toast.error(msg, { duration: 8080 });
    }
  }

  return (
    <div className="upload-page">
      <header className="site-header">
        <div className="logo"><span className="logo-icon">◈</span><span>CV<strong>Analyzer</strong></span></div>
        <p className="tagline">AI-powered resume evaluation · Powered by Groq AI</p>
      </header>

      <StatusBanner status={backendStatus}/>

      {loading ? (
        <div className="loading-card">
          <div className="spinner"/>
          <p className="loading-step">{STEPS[step]}</p>
          <div className="step-dots">
            {STEPS.map((_,i) => <div key={i} className={`dot ${i<step?'done':i===step?'active':''}`}/>)}
          </div>
          <p className="loading-sub">Usually takes 10–20 seconds</p>
        </div>
      ) : (
        <>
          <div {...getRootProps()} className={`dropzone ${isDragActive?'drag':''} ${file?'has-file':''}`}>
            <input {...getInputProps()}/>
            {file ? (
              <div className="file-selected">
                <div className="file-icon">📄</div>
                <div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-meta">{(file.size/1024).toFixed(1)} KB</p>
                </div>
                <button className="remove-btn" onClick={e=>{e.stopPropagation();setFile(null);}}>✕</button>
              </div>
            ) : (
              <div className="drop-prompt">
                <div className="drop-icon">⬆</div>
                <p className="drop-title">{isDragActive ? 'Drop it!' : 'Drop your CV here'}</p>
                <p className="drop-sub">or click to browse · PDF, DOCX, TXT · max 10 MB</p>
              </div>
            )}
          </div>

          <button className="analyze-btn" disabled={!file || backendStatus==='down'} onClick={handleAnalyze}>
            {file ? '⚡ Analyze My CV' : 'Select a file to start'}
          </button>

          <div className="feature-grid">
            {[['📊','Score / 100','4 weighted categories'],['🔍','Section check','Finds gaps instantly'],
              ['💡','5 actionable tips','Specific improvements'],['🤖','ATS score','Recruiter-system check']
            ].map(([icon,title,desc]) => (
              <div key={title} className="feature-card">
                <span className="feat-icon">{icon}</span>
                <p className="feat-title">{title}</p>
                <p className="feat-desc">{desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Results view ───────────────────────────────────────────────────────────
function ResultsView({ data, filename, onReset }) {
  const bk = data.breakdown || {};
  const cats = [
    {key:'content_quality',      label:'Content quality',       color:'#4ade80'},
    {key:'structure_formatting', label:'Structure & formatting', color:'#60a5fa'},
    {key:'skills_relevance',     label:'Skills relevance',       color:'#f472b6'},
    {key:'experience_strength',  label:'Experience strength',    color:'#fb923c'},
  ];
  const ALL = ['Personal Information','Summary / Objective','Education','Experience',
               'Skills','Projects','Certifications','Languages','Achievements'];

  return (
    <div className="results-page">
      <header className="results-header">
        <div className="logo"><span className="logo-icon">◈</span><span>CV<strong>Analyzer</strong></span></div>
        <button className="back-btn" onClick={onReset}>← Analyze another</button>
      </header>
      <p className="filename-label">Results for: <strong>{filename}</strong></p>

      {/* Score hero */}
      <div className="score-hero">
        <div className="score-circle-wrap">
          <CircleScore score={data.score} size={140}/>
          <div className="score-overlay">
            <span className="score-num">{data.score}</span>
            <span className="score-denom">/100</span>
          </div>
        </div>
        <div className="score-meta">
          <div className="grade-badge" style={{color:gradeColor(data.grade),borderColor:gradeColor(data.grade)}}>
            Grade {data.grade}
          </div>
          <p className="score-summary">{data.summary}</p>
          {data.industry_fit?.length > 0 && (
            <div className="industry-fit">
              <span className="if-label">Best fit: </span>
              {data.industry_fit.map(i => <span key={i} className="if-tag">{i}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <section className="section-block">
        <h2 className="section-title">Score breakdown</h2>
        <div className="breakdown-grid">
          {cats.map(({key,label,color}) => {
            const d = bk[key] || {score:0,max:30,comment:''};
            return (
              <div className="breakdown-card" key={key}>
                <div className="bc-top">
                  <span className="bc-label">{label}</span>
                  <span className="bc-score" style={{color}}>{d.score}<span className="bc-max">/{d.max}</span></span>
                </div>
                <ProgressBar value={d.score} max={d.max} color={color}/>
                <p className="bc-comment">{d.comment}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sections */}
      <section className="section-block">
        <h2 className="section-title">Section checklist</h2>
        <div className="sections-grid">
          {ALL.map(s => {
            const found = (data.sections_found||[]).some(f =>
              f.toLowerCase().includes(s.toLowerCase().split('/')[0].trim())
            );
            return (
              <div key={s} className={`section-pill ${found?'found':'missing'}`}>
                <span>{found?'✓':'○'}</span> {s}
              </div>
            );
          })}
        </div>
        {data.missing_sections?.length > 0 && (
          <p className="missing-note">⚠ Missing core sections: {data.missing_sections.join(', ')}</p>
        )}
      </section>

      {/* Strengths + Weaknesses */}
      <div className="two-col">
        <section className="section-block">
          <h2 className="section-title">Strengths</h2>
          <ul className="sw-list">
            {(data.strengths||[]).map((s,i) => <li key={i}><span className="sw-dot green"/>  {s}</li>)}
          </ul>
        </section>
        <section className="section-block">
          <h2 className="section-title">Weaknesses</h2>
          <ul className="sw-list">
            {(data.weaknesses||[]).map((w,i) => <li key={i}><span className="sw-dot red"/> {w}</li>)}
          </ul>
        </section>
      </div>

      {/* Tips */}
      <section className="section-block">
        <h2 className="section-title">Actionable tips</h2>
        <ol className="tips-list">
          {(data.tips||[]).map((t,i) => (
            <li key={i} className="tip-item">
              <span className="tip-num">{i+1}</span><p>{t}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ATS */}
      {data.ats_score !== undefined && (
        <section className="section-block ats-block">
          <h2 className="section-title">ATS compatibility</h2>
          <div className="ats-inner">
            <div className="ats-score-wrap">
              <CircleScore score={data.ats_score} size={90}/>
              <div className="ats-num">{data.ats_score}</div>
            </div>
            <p className="ats-notes">{data.ats_notes}</p>
          </div>
        </section>
      )}

      {/* Stats */}
      {data.structure_info && (
        <section className="section-block">
          <h2 className="section-title">Document stats</h2>
          <div className="stats-grid">
            {[['Words',data.structure_info.word_count],['Lines',data.structure_info.line_count],
              ['Bullets',data.structure_info.bullet_count],['Length',data.structure_info.length_note]
            ].map(([l,v]) => (
              <div key={l} className="stat-card"><p className="stat-val">{v}</p><p className="stat-label">{l}</p></div>
            ))}
          </div>
        </section>
      )}

      <button className="analyze-btn reset-full" onClick={onReset}>⬆ Analyze another CV</button>
    </div>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]         = useState('home'); // 'home' | 'analyze' | 'build'
  const [result,   setResult]   = useState(null);
  const [filename, setFilename] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    axios.get(`${API_BASE}/health`, { timeout: 5000 })
      .then(res => {
        if (res.data.ai_ready) setBackendStatus('ok');
        else                   setBackendStatus('no_key');
      })
      .catch(() => setBackendStatus('down'));
  }, []);

  if (mode === 'build') return <CVBuilder onBack={() => setMode('home')} />;

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style:{ background:'#1e1e2e', color:'#e8e6e1', border:'1px solid #2e2e3e' },
        duration: 6000,
      }}/>
      {mode === 'analyze' && result
        ? <ResultsView data={result} filename={filename} onReset={() => { setResult(null); setMode('home'); }}/>
        : <HomePage
            backendStatus={backendStatus}
            onAnalyze={() => setMode('analyze')}
            onBuild={() => setMode('build')}
            onResult={(d,f) => { setResult(d); setFilename(f); setMode('analyze'); }}
            mode={mode}
          />
      }
    </>
  );
}
