import React, { useState, useRef } from 'react';
import './CVBuilder.css';

// ── Default empty CV data ─────────────────────────────────────────────────
const EMPTY_CV = {
  personal: {
    name: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: { technical: '', soft: '', languages: '' },
  projects: [],
  certifications: [],
};

const TEMPLATES = [
  { id: 'modern',    label: 'Modern',    accent: '#6366f1' },
  { id: 'classic',   label: 'Classic',   accent: '#1e3a5f' },
  { id: 'minimal',   label: 'Minimal',   accent: '#111111' },
  { id: 'creative',  label: 'Creative',  accent: '#0ea5e9' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 8); }

function emptyExp() {
  return { id: uid(), company: '', role: '', start: '', end: '', current: false, bullets: [''] };
}
function emptyEdu() {
  return { id: uid(), school: '', degree: '', field: '', start: '', end: '', gpa: '' };
}
function emptyProject() {
  return { id: uid(), name: '', description: '', tech: '', link: '' };
}
function emptyCert() {
  return { id: uid(), name: '', issuer: '', date: '' };
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="cb-section">
      <button className="cb-section-head" onClick={() => setOpen(o => !o)}>
        <span>{title}</span><span className="cb-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="cb-section-body">{children}</div>}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', half }) {
  return (
    <div className={cb-field ${half ? 'half' : ''}}>
      <label className="cb-label">{label}</label>
      <input className="cb-input" type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''} />
    </div>
  );
}
function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="cb-field">
      <label className="cb-label">{label}</label>
      <textarea className="cb-input cb-textarea" rows={rows} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} />
    </div>
  );
}

// ── CV BUILDER FORM ───────────────────────────────────────────────────────
export default function CVBuilder({ onBack }) {
  const [cv, setCV]               = useState(EMPTY_CV);
  const [template, setTemplate]   = useState('modern');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const previewRef = useRef();

  // Personal
  const setP = (k, v) => setCV(c => ({ ...c, personal: { ...c.personal, [k]: v } }));

  // Experience
  const addExp    = ()      => setCV(c => ({ ...c, experience: [...c.experience, emptyExp()] }));
  const removeExp = id      => setCV(c => ({ ...c, experience: c.experience.filter(e => e.id !== id) }));
  const setExp    = (id, k, v) => setCV(c => ({
    ...c, experience: c.experience.map(e => e.id === id ? { ...e, [k]: v } : e)
  }));
  const setBullet = (id, i, v) => setCV(c => ({
    ...c, experience: c.experience.map(e => {
      if (e.id !== id) return e;
      const b = [...e.bullets]; b[i] = v; return { ...e, bullets: b };
    })
  }));
  const addBullet    = id => setCV(c => ({
    ...c, experience: c.experience.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e)
  }));
  const removeBullet = (id, i) => setCV(c => ({
    ...c, experience: c.experience.map(e => {
      if (e.id !== id) return e;
      const b = e.bullets.filter((_, idx) => idx !== i);
      return { ...e, bullets: b.length ? b : [''] };
    })
  }));

  // Education
  const addEdu    = ()         => setCV(c => ({ ...c, education: [...c.education, emptyEdu()] }));
  const removeEdu = id         => setCV(c => ({ ...c, education: c.education.filter(e => e.id !== id) }));
  const setEdu    = (id, k, v) => setCV(c => ({
    ...c, education: c.education.map(e => e.id === id ? { ...e, [k]: v } : e)
  }));

  // Projects
  const addProj    = ()         => setCV(c => ({ ...c, projects: [...c.projects, emptyProject()] }));
  const removeProj = id         => setCV(c => ({ ...c, projects: c.projects.filter(p => p.id !== id) }));
  const setProj    = (id, k, v) => setCV(c => ({
    ...c, projects: c.projects.map(p => p.id === id ? { ...p, [k]: v } : p)
  }));

  // Certs
  const addCert    = ()         => setCV(c => ({ ...c, certifications: [...c.certifications, emptyCert()] }));
  const removeCert = id         => setCV(c => ({ ...c, certifications: c.certifications.filter(x => x.id !== id) }));
  const setCert    = (id, k, v) => setCV(c => ({
    ...c, certifications: c.certifications.map(x => x.id === id ? { ...x, [k]: v } : x)
  }));

  // Skills
  const setSkill = (k, v) => setCV(c => ({ ...c, skills: { ...c.skills, [k]: v } }));

  // Print
  function handleDownload() {
    setActiveTab('preview');
    setTimeout(() => window.print(), 400);
  }

  const tpl = TEMPLATES.find(t => t.id === template);

  return (
    <div className="cb-root">
      {/* ── Top bar ── */}
      <div className="cb-topbar">
        <button className="cb-back" onClick={onBack}>← Back</button>
        <div className="cb-topbar-center">
          <span className="cb-logo">◈ CV<strong>Builder</strong></span>
        </div>
        <div className="cb-topbar-right">
          <div className="cb-tabs">
            <button className={activeTab === 'edit'    ? 'cb-tab active' : 'cb-tab'} onClick={() => setActiveTab('edit')}>✏️ Edit</button>
            <button className={activeTab === 'preview' ? 'cb-tab active' : 'cb-tab'} onClick={() => setActiveTab('preview')}>👁️ Preview</button>
          </div>
          <button className="cb-download" onClick={handleDownload}>⬇️ Download PDF</button>
        </div>
      </div>

      <div className="cb-body">
        {/* ── Left: Form ── */}
        <div className={cb-form-col ${activeTab === 'preview' ? 'hidden-mobile' : ''}}>

          {/* Template picker */}
          <div className="cb-template-bar">
            <p className="cb-template-label">Template</p>
            <div className="cb-template-options">
              {TEMPLATES.map(t => (
                <button key={t.id}
                  className={cb-tpl-btn ${template === t.id ? 'active' : ''}}
                  style={{ '--accent': t.accent }}
                  onClick={() => setTemplate(t.id)}>
                  <span className="cb-tpl-dot" style={{ background: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personal */}
          <Section title="👤 Personal Information">
            <Field label="Full Name"        value={cv.personal.name}     onChange={v => setP('name', v)}     placeholder="Ibrahim Mohammed" />
            <Field label="Professional Title" value={cv.personal.title}  onChange={v => setP('title', v)}    placeholder="Software Engineer" />
            <div className="cb-row">
              <Field label="Email"   half value={cv.personal.email}    onChange={v => setP('email', v)}    placeholder="you@email.com" />
              <Field label="Phone"   half value={cv.personal.phone}    onChange={v => setP('phone', v)}    placeholder="+1 234 567 890" />
            </div>
            <div className="cb-row">
              <Field label="Location" half value={cv.personal.location} onChange={v => setP('location', v)} placeholder="Cairo, Egypt" />
              <Field label="LinkedIn" half value={cv.personal.linkedin} onChange={v => setP('linkedin', v)} placeholder="linkedin.com/in/you" />
            </div>
            <div className="cb-row">
              <Field label="GitHub"   half value={cv.personal.github}   onChange={v => setP('github', v)}   placeholder="github.com/you" />
              <Field label="Website"  half value={cv.personal.website}  onChange={v => setP('website', v)}  placeholder="yoursite.com" />
            </div>
          </Section>

          {/* Summary */}
          <Section title="📝 Professional Summary">
            <TextArea label="Summary" rows={4} value={cv.summary}
              onChange={v => setCV(c => ({ ...c, summary: v }))}
              placeholder="A passionate software engineer with 3+ years of experience building scalable web applications..." />
          </Section>

          {/* Experience */}
          <Section title="💼 Work Experience">
            {cv.experience.map((exp, idx) => (
              <div key={exp.id} className="cb-card">
                <div className="cb-card-head">
                  <span className="cb-card-num">Position {idx + 1}</span>
                  <button className="cb-remove" onClick={() => removeExp(exp.id)}>✕ Remove</button>
                </div>
                <div className="cb-row">
                  <Field label="Company"  half value={exp.company} onChange={v => setExp(exp.id, 'company', v)} placeholder="Google" />
                  <Field label="Job Title" half value={exp.role}   onChange={v => setExp(exp.id, 'role', v)}    placeholder="Senior Engineer" />
                </div>
                <div className="cb-row">
                  <Field label="Start Date" half value={exp.start} onChange={v => setExp(exp.id, 'start', v)} placeholder="Jan 2022" />
                  <Field label="End Date"   half value={exp.current ? 'Present' : exp.end}
                    onChange={v => setExp(exp.id, 'end', v)} placeholder="Dec 2024"
                    disabled={exp.current} />
                </div>
                <label className="cb-checkbox">
                  <input type="checkbox" checked={exp.current}
                    onChange={e => setExp(exp.id, 'current', e.target.checked)} />
                  Currently working here
                </label>
                <div className="cb-bullets-label">Responsibilities / Achievements</div>
                {exp.bullets.map((b, i) => (
                  <div key={i} className="cb-bullet-row">
                    <span className="cb-bullet-dot">•</span>
                    <input className="cb-input cb-bullet-input" value={b}
                      onChange={e => setBullet(exp.id, i, e.target.value)}
                      placeholder="Increased system performance by 40% through..." />
                    <button className="cb-remove-bullet" onClick={() => removeBullet(exp.id, i)}>✕</button>
                  </div>
                ))}
                <button className="cb-add-bullet" onClick={() => addBullet(exp.id)}>+ Add bullet</button>
              </div>
            ))}
            <button className="cb-add-btn" onClick={addExp}>+ Add Experience</button>
          </Section>

          {/* Education */}
          <Section title="🎓 Education">
            {cv.education.map((edu, idx) => (
              <div key={edu.id} className="cb-card">
                <div className="cb-card-head">
                  <span className="cb-card-num">Education {idx + 1}</span>
                  <button className="cb-remove" onClick={() => removeEdu(edu.id)}>✕ Remove</button>
                </div>
                <div className="cb-row">
                  <Field label="School / University" half value={edu.school} onChange={v => setEdu(edu.id, 'school', v)} placeholder="Cairo University" />
                  <Field label="Degree"              half value={edu.degree} onChange={v => setEdu(edu.id, 'degree', v)} placeholder="Bachelor of Science" />
                </div>
                <div className="cb-row">
                  <Field label="Field of Study" half value={edu.field} onChange={v => setEdu(edu.id, 'field', v)} placeholder="Computer Science" />
                  <Field label="GPA (optional)" half value={edu.gpa}   onChange={v => setEdu(edu.id, 'gpa', v)}   placeholder="3.8 / 4.0" />
                </div>
                <div className="cb-row">
                  <Field label="Start" half value={edu.start} onChange={v => setEdu(edu.id, 'start', v)} placeholder="2018" />
                  <Field label="End"   half value={edu.end}   onChange={v => setEdu(edu.id, 'end', v)}   placeholder="2022" />
                </div>
              </div>
            ))}
            <button className="cb-add-btn" onClick={addEdu}>+ Add Education</button>
          </Section>

          {/* Skills */}
          <Section title="🛠️ Skills">
            <TextArea label="Technical Skills" rows={2} value={cv.skills.technical}
              onChange={v => setSkill('technical', v)}
              placeholder="Python, React, Node.js, PostgreSQL, Docker, AWS..." />
            <TextArea label="Soft Skills" rows={2} value={cv.skills.soft}
              onChange={v => setSkill('soft', v)}
              placeholder="Leadership, Communication, Problem Solving, Teamwork..." />
            <TextArea label="Languages" rows={1} value={cv.skills.languages}
              onChange={v => setSkill('languages', v)}
              placeholder="Arabic (Native), English (Fluent), French (Intermediate)..." />
          </Section>

          {/* Projects */}
          <Section title="🚀 Projects">
            {cv.projects.map((proj, idx) => (
              <div key={proj.id} className="cb-card">
                <div className="cb-card-head">
                  <span className="cb-card-num">Project {idx + 1}</span>
                  <button className="cb-remove" onClick={() => removeProj(proj.id)}>✕ Remove</button>
                </div>
                <div className="cb-row">
                  <Field label="Project Name" half value={proj.name} onChange={v => setProj(proj.id, 'name', v)} placeholder="CV Analyzer" />
                  <Field label="GitHub / Link" half value={proj.link} onChange={v => setProj(proj.id, 'link', v)} placeholder="github.com/you/project" />
                </div>
                <Field label="Tech Stack" value={proj.tech} onChange={v => setProj(proj.id, 'tech', v)} placeholder="React, Python, Flask, Groq AI" />
                <TextArea label="Description" rows={2} value={proj.description}
                  onChange={v => setProj(proj.id, 'description', v)}
                  placeholder="Built an AI-powered CV analyzer that scores resumes out of 100..." />
              </div>
            ))}
            <button className="cb-add-btn" onClick={addProj}>+ Add Project</button>
          </Section>

          {/* Certifications */}
          <Section title="🏅 Certifications">
            {cv.certifications.map((cert, idx) => (
              <div key={cert.id} className="cb-card">
                <div className="cb-card-head">
                  <span className="cb-card-num">Cert {idx + 1}</span>
                  <button className="cb-remove" onClick={() => removeCert(cert.id)}>✕ Remove</button>
                </div>
                <div className="cb-row">
                  <Field label="Certificate Name" half value={cert.name}   onChange={v => setCert(cert.id, 'name', v)}   placeholder="AWS Solutions Architect" />
                  <Field label="Issuing Org"       half value={cert.issuer} onChange={v => setCert(cert.id, 'issuer', v)} placeholder="Amazon Web Services" />
                </div>
                <Field label="Date" value={cert.date} onChange={v => setCert(cert.id, 'date', v)} placeholder="March 2024" />
              </div>
            ))}
            <button className="cb-add-btn" onClick={addCert}>+ Add Certification</button>
          </Section>

        </div>

        {/* ── Right: Live Preview ── */}
        <div className={cb-preview-col ${activeTab === 'edit' ? 'hidden-mobile' : ''}}>
          <div className="cb-preview-sticky">
            <div className="cb-preview-frame" ref={previewRef}>
              <CVPreview cv={cv} template={tpl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CV PREVIEW (the actual rendered CV) ───────────────────────────────────
function CVPreview({ cv, template }) {
  const { personal: p, summary, experience, education, skills, projects, certifications } = cv;
  const accent = template.accent;
  const tid    = template.id;

  const hasSkills = skills.technical || skills.soft || skills.languages;
  const name  = p.name  || 'Your Name';
  const title = p.title || 'Professional Title';

  return (
    <div className={cvp cvp-${tid}} style={{ '--accent': accent }}>

      {/* ── HEADER ── */}
      {tid === 'modern' && (
        <div className="cvp-header cvp-header-modern">
          <div className="cvp-header-left">
            <h1 className="cvp-name">{name}</h1>
            <p className="cvp-title">{title}</p>
          </div>
          <div className="cvp-header-right">
            {p.email    && <span>✉️ {p.email}</span>}
            {p.phone    && <span>📞 {p.phone}</span>}
            {p.location && <span>📍 {p.location}</span>}
            {p.linkedin && <span>in {p.linkedin}</span>}
            {p.github   && <span>⌥ {p.github}</span>}
          </div>
        </div>
      )}

      {tid === 'classic' && (
        <div className="cvp-header cvp-header-classic">
          <h1 className="cvp-name">{name}</h1>
          <p className="cvp-title">{title}</p>
          <div className="cvp-contact-row">
            {p.email    && <span>{p.email}</span>}
            {p.phone    && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
            {p.linkedin && <span>{p.linkedin}</span>}
            {p.github   && <span>{p.github}</span>}
          </div>
          <div className="cvp-classic-line" style={{ background: accent }} />
        </div>
      )}

      {tid === 'minimal' && (
        <div className="cvp-header cvp-header-minimal">
          <h1 className="cvp-name">{name}</h1>
          <div className="cvp-minimal-sub">
            <span className="cvp-title">{title}</span>
            <span className="cvp-minimal-contacts">
              {[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join('  ·  ')}
            </span>
          </div>
          <div className="cvp-minimal-rule" />
        </div>
      )}

      {tid === 'creative' && (
        <div className="cvp-header cvp-header-creative" style={{ background: accent }}>
          <h1 className="cvp-name cvp-name-creative">{name}</h1>
          <p className="cvp-title cvp-title-creative">{title}</p>
          <div className="cvp-contact-row cvp-contact-creative">
            {p.email    && <span>✉️ {p.email}</span>}
            {p.phone    && <span>📞 {p.phone}</span>}
            {p.location && <span>📍 {p.location}</span>}
            {p.linkedin && <span>in {p.linkedin}</span>}
            {p.github   && <span>⌥ {p.github}</span>}
          </div>
        </div>
      )}

      <div className="cvp-body">

        {/* Summary */}
        {summary && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'PROFESSIONAL SUMMARY' : 'Summary'}
            </h2>
            <p className="cvp-summary">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'WORK EXPERIENCE' : 'Experience'}
            </h2>
            {experience.map(exp => (
              <div key={exp.id} className="cvp-entry">
                <div className="cvp-entry-head">
                  <div>
                    <span className="cvp-entry-title">{exp.role || 'Job Title'}</span>
                    {exp.company && <span className="cvp-entry-sub"> · {exp.company}</span>}
                  </div>
                  <span className="cvp-entry-date">
                    {exp.start}{exp.start && (exp.current ? ' – Present' : exp.end ? ` – ${exp.end}` : '')}
                  </span>
                </div>
                {exp.bullets.filter(b => b.trim()).length > 0 && (
                  <ul className="cvp-bullets">
                    {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'EDUCATION' : 'Education'}
            </h2>
            {education.map(edu => (
              <div key={edu.id} className="cvp-entry">
                <div className="cvp-entry-head">
                  <div>
                    <span className="cvp-entry-title">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</span>
                    {edu.school && <span className="cvp-entry-sub"> · {edu.school}</span>}
                  </div>
                  <span className="cvp-entry-date">
                    {edu.start}{edu.start && edu.end ? ` – ${edu.end}` : ''}
                    {edu.gpa ? `  ·  GPA: ${edu.gpa}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {hasSkills && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'SKILLS' : 'Skills'}
            </h2>
            {skills.technical && (
              <div className="cvp-skill-row">
                <span className="cvp-skill-label">Technical</span>
                <span className="cvp-skill-val">{skills.technical}</span>
              </div>
            )}
            {skills.soft && (
              <div className="cvp-skill-row">
                <span className="cvp-skill-label">Soft Skills</span>
                <span className="cvp-skill-val">{skills.soft}</span>
              </div>
            )}
            {skills.languages && (
              <div className="cvp-skill-row">
                <span className="cvp-skill-label">Languages</span>
                <span className="cvp-skill-val">{skills.languages}</span>
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'PROJECTS' : 'Projects'}
            </h2>
            {projects.map(proj => (
              <div key={proj.id} className="cvp-entry">
                <div className="cvp-entry-head">
                  <span className="cvp-entry-title">{proj.name || 'Project Name'}</span>
                  {proj.link && <span className="cvp-entry-date">{proj.link}</span>}
                </div>
                {proj.tech && <p className="cvp-proj-tech">Tech: {proj.tech}</p>}
                {proj.description && <p className="cvp-proj-desc">{proj.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="cvp-section">
            <h2 className="cvp-section-title" style={{ color: accent, borderColor: accent }}>
              {tid === 'classic' ? 'CERTIFICATIONS' : 'Certifications'}
            </h2>
            {certifications.map(cert => (
              <div key={cert.id} className="cvp-entry">
                <div className="cvp-entry-head">
                  <div>
                    <span className="cvp-entry-title">{cert.name}</span>
                    {cert.issuer && <span className="cvp-entry-sub"> · {cert.issuer}</span>}
                  </div>
                  {cert.date && <span className="cvp-entry-date">{cert.date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}