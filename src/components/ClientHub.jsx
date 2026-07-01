import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const CLIENT_PASSWORD = '50K'

const NICHES = ['Real Estate','Mortgage/Lending','Restaurant','Education','E-commerce','Service Business','Founder/Personal Brand','Other']
const STAGES = ['Cold','Warm','Proposal Sent','Negotiating','Closed Won','Closed Lost']
const STATUSES = ['Active','Paused','At Risk','Churned']

const ONBOARDING_QUESTIONS = [
  { id:'business_name', section:'🏢 Business Info', label:'Business / Brand Name' },
  { id:'owner_name', section:'🏢 Business Info', label:'Owner / Main Contact Name' },
  { id:'email', section:'🏢 Business Info', label:'Email Address' },
  { id:'phone', section:'🏢 Business Info', label:'Phone Number' },
  { id:'website', section:'🏢 Business Info', label:'Website URL' },
  { id:'socials', section:'🏢 Business Info', label:'Social Handles (IG, TikTok, YouTube, FB)', type:'textarea' },
  { id:'location', section:'🏢 Business Info', label:'Business Location / Service Area' },
  { id:'target_audience', section:'🎯 Strategy', label:'Who is your ideal client? (age, gender, location, income)', type:'textarea' },
  { id:'pain_points', section:'🎯 Strategy', label:'What problems does your audience have that you solve?', type:'textarea' },
  { id:'unique_value', section:'🎯 Strategy', label:'What makes you different from competitors?', type:'textarea' },
  { id:'competitors', section:'🎯 Strategy', label:'Who are your main competitors? (names or handles)', type:'textarea' },
  { id:'content_goals', section:'🎯 Strategy', label:'Main content goals? (leads, brand awareness, sales)', type:'textarea' },
  { id:'past_content', section:'🎯 Strategy', label:'Have you done content before? What worked / what did not?', type:'textarea' },
  { id:'dream_result', section:'🎯 Strategy', label:'What does success look like for you in 6 months?', type:'textarea' },
  { id:'tone', section:'🎨 Creative', label:'How should your brand sound? (professional, casual, bold, educational)' },
  { id:'topics', section:'🎨 Creative', label:'What topics or content pillars do you want to cover?', type:'textarea' },
  { id:'avoid', section:'🎨 Creative', label:'Anything you never want to say or show?', type:'textarea' },
  { id:'inspiration', section:'🎨 Creative', label:'Any creators or brands whose content style you love?', type:'textarea' },
  { id:'brand_assets', section:'🎨 Creative', label:'Existing brand assets? (logo, colors, fonts, photos)' },
  { id:'shoot_days', section:'🎬 Production', label:'How many shoot days per month are you available?' },
  { id:'shoot_location', section:'🎬 Production', label:'Preferred shoot location(s)' },
  { id:'on_camera', section:'🎬 Production', label:'Will anyone else be in the content? (team, clients, guests)' },
  { id:'special_reqs', section:'🎬 Production', label:'Special requirements or things to know before we start?', type:'textarea' },
  { id:'budget_notes', section:'💰 Business', label:'Monthly budget / retainer agreed' },
  { id:'contract_start', section:'💰 Business', label:'Contract start date' },
  { id:'reporting_prefs', section:'💰 Business', label:'How often do you want progress updates?' },
  { id:'extra_notes', section:'📝 Notes', label:'Additional notes, ideas, or anything else', type:'textarea' },
]

const SECTIONS = [...new Set(ONBOARDING_QUESTIONS.map(q => q.section))]

export default function ClientHub({ onBack }) {
  const [folder, setFolder] = useState(null) // null=home, 'clients', 'onboarding'
  const [clientsUnlocked, setClientsUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])
  const [onboardingList, setOnboardingList] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedOnboarding, setSelectedOnboarding] = useState(null)
  const [clientTab, setClientTab] = useState('active')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: l }, { data: o }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('onboarding').select('*').order('updated_at', { ascending: false }),
      ])
      setClients(c || [])
      setLeads(l || [])
      setOnboardingList(o || [])
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const handleUnlock = () => {
    if (pin === CLIENT_PASSWORD) {
      setClientsUnlocked(true)
      setPinError(false)
      loadData()
    } else {
      setPinError(true)
      setPin('')
    }
  }

  const saveClient = async (c) => {
    setSaving(true)
    try {
      if (c.id && !c.id.startsWith('new_')) {
        await supabase.from('clients').update({ ...c, updated_at: new Date().toISOString() }).eq('id', c.id)
      } else {
        const { id, ...rest } = c
        await supabase.from('clients').insert(rest)
      }
      setEditingClient(null)
      await loadData()
    } catch(e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const saveLead = async (l) => {
    setSaving(true)
    try {
      if (l.id && !l.id.startsWith('new_')) {
        await supabase.from('leads').update({ ...l, updated_at: new Date().toISOString() }).eq('id', l.id)
      } else {
        const { id, ...rest } = l
        await supabase.from('leads').insert(rest)
      }
      setEditingLead(null)
      await loadData()
    } catch(e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const saveOnboarding = async (form) => {
    setSaving(true)
    try {
      const data = { ...form, updated_at: new Date().toISOString() }
      if (form.id) {
        await supabase.from('onboarding').update(data).eq('id', form.id)
      } else {
        const { id, ...rest } = data
        await supabase.from('onboarding').insert(rest)
      }
      await loadData()
      setSaving(false)
      return true
    } catch(e) {
      alert('Save failed: ' + e.message)
      setSaving(false)
      return false
    }
  }

  const totalMRR = clients.filter(c => c.status === 'Active').reduce((s, c) => s + (parseFloat(c.retainer) || 0), 0)
  const pipeline = leads.filter(l => !['Closed Won','Closed Lost'].includes(l.stage)).reduce((s, l) => s + (parseFloat(l.potential_value) || 0), 0)

  // HOME SCREEN
  if (!folder) {
    return (
      <div className="animate-in">
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:'8px 14px' }}>← Home</button>
          <div>
            <h1 style={{ fontSize:26, fontWeight:700 }}>Client <span style={{ color:'#8b5cf6' }}>Hub</span></h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Elev8 Media · Confidential</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:700 }}>
          {/* Client Folder */}
          <div
            className="card"
            onClick={() => setFolder('clients')}
            style={{ cursor:'pointer', borderColor:'rgba(99,102,241,0.3)', boxShadow:'0 0 30px rgba(99,102,241,0.08)', padding:32, textAlign:'center', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(99,102,241,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 30px rgba(99,102,241,0.08)' }}
          >
            <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Client Folder</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>Active clients · CRM pipeline · Revenue tracking</div>
            <span className="badge blue">Password Protected</span>
          </div>

          {/* Onboarding Folder */}
          <div
            className="card"
            onClick={() => { setFolder('onboarding'); if (clientsUnlocked) loadData() }}
            style={{ cursor:'pointer', borderColor:'rgba(139,92,246,0.3)', boxShadow:'0 0 30px rgba(139,92,246,0.08)', padding:32, textAlign:'center', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(139,92,246,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 30px rgba(139,92,246,0.08)' }}
          >
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Onboarding</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16 }}>Client forms · Meeting notes · PDF export</div>
            <span className="badge purple">Password Protected</span>
          </div>
        </div>
      </div>
    )
  }

  // LOCK SCREEN for both folders
  if (!clientsUnlocked) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        <div className="card" style={{ width:360, textAlign:'center', padding:40, borderColor:'rgba(139,92,246,0.4)', boxShadow:'0 0 60px rgba(139,92,246,0.15)' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>{folder === 'clients' ? '🔐' : '📋'}</div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>{folder === 'clients' ? 'Client Folder' : 'Onboarding Folder'}</h2>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:24 }}>Enter password to access</p>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Password" autoFocus
            style={{ textAlign:'center', letterSpacing:'0.3em', fontSize:18, marginBottom:12 }}
          />
          {pinError && <p style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>Incorrect password.</p>}
          <button className="btn btn-teal" onClick={handleUnlock} style={{ width:'100%', justifyContent:'center', marginBottom:10 }}>Unlock →</button>
          <button className="btn btn-ghost" onClick={() => { setFolder(null); setPin(''); setPinError(false) }} style={{ width:'100%', justifyContent:'center' }}>← Back</button>
        </div>
      </div>
    )
  }

  // CLIENT FOLDER
  if (folder === 'clients') {
    return (
      <ClientFolderView
        clients={clients} leads={leads} loading={loading}
        onBack={() => setFolder(null)} onRefresh={loadData}
        onSaveClient={saveClient} onSaveLead={saveLead}
        onDeleteClient={async (id) => { if (!confirm('Delete?')) return; await supabase.from('clients').delete().eq('id', id); loadData() }}
        onDeleteLead={async (id) => { if (!confirm('Delete?')) return; await supabase.from('leads').delete().eq('id', id); loadData() }}
        saving={saving} totalMRR={totalMRR} pipeline={pipeline}
        editingClient={editingClient} setEditingClient={setEditingClient}
        editingLead={editingLead} setEditingLead={setEditingLead}
        clientTab={clientTab} setClientTab={setClientTab}
      />
    )
  }

  // ONBOARDING FOLDER
  if (folder === 'onboarding') {
    return (
      <OnboardingFolder
        clients={clients} onboardingList={onboardingList}
        selected={selectedOnboarding} setSelected={setSelectedOnboarding}
        onSave={saveOnboarding} onRefresh={loadData}
        onBack={() => setFolder(null)} saving={saving}
      />
    )
  }
}

// ─── CLIENT FOLDER VIEW ───────────────────────────────────────────
function ClientFolderView({ clients, leads, loading, onBack, onRefresh, onSaveClient, onSaveLead, onDeleteClient, onDeleteLead, saving, totalMRR, pipeline, editingClient, setEditingClient, editingLead, setEditingLead, clientTab, setClientTab }) {
  const activeClients = clients.filter(c => c.status === 'Active')
  const atRisk = clients.filter(c => c.status === 'At Risk')
  const STAGES = ['Cold','Warm','Proposal Sent','Negotiating','Closed Won','Closed Lost']

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:'8px 14px' }}>← Back</button>
          <h2 style={{ fontSize:22, fontWeight:700 }}>🔐 Client Folder</h2>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={onRefresh} style={{ padding:'8px 14px' }}>↻</button>
          <button className="btn btn-blue" onClick={() => setEditingClient({ id:`new_${Date.now()}`, name:'', niche:'', retainer:0, videos_target:10, videos_delivered:0, contract_start:'', status:'Active', notes:'', contact_name:'', contact_email:'', contact_phone:'' })}>
            + Add Client
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ gap:12, marginBottom:20 }}>
        {[
          ['Total MRR', `$${totalMRR.toLocaleString()}`, '#22d3a5'],
          ['Pipeline', `$${pipeline.toLocaleString()}`, '#8b5cf6'],
          ['Active', activeClients.length, '#6366f1'],
          ['At Risk', atRisk.length, atRisk.length > 0 ? '#f87171' : '#22d3a5'],
        ].map(([l,v,c]) => (
          <div key={l} className="card" style={{ borderColor:`${c}33`, padding:'14px 18px' }}>
            <div className="label" style={{ marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:24, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'var(--card)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[['active','👥 Active Clients'],['crm','🎯 CRM Pipeline']].map(([id,label]) => (
          <button key={id} onClick={() => setClientTab(id)} style={{ padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, background:clientTab===id?'#6366f1':'transparent', color:clientTab===id?'#fff':'var(--text2)', border:'none', cursor:'pointer' }}>{label}</button>
        ))}
      </div>

      {loading ? <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Loading...</div> : (
        <>
          {clientTab === 'active' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {clients.length === 0 ? (
                <EmptyState icon="👥" msg="No clients yet. Add your first client." />
              ) : clients.map(c => (
                <ClientCard key={c.id} client={c} onEdit={() => setEditingClient({...c})} onDelete={() => onDeleteClient(c.id)} />
              ))}
            </div>
          )}

          {clientTab === 'crm' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
                <button className="btn btn-blue" onClick={() => setEditingLead({ id:`new_${Date.now()}`, name:'', business:'', niche:'', contact:'', stage:'Cold', potential_value:0, last_contact:'', notes:'' })}>
                  + Add Lead
                </button>
              </div>
              {leads.length === 0 ? <EmptyState icon="🎯" msg="No leads yet." /> : (
                STAGES.map(stage => {
                  const sl = leads.filter(l => l.stage === stage)
                  if (!sl.length) return null
                  return (
                    <div key={stage} style={{ marginBottom:20 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                        <span className={`badge ${stageColor(stage)}`}>{stage}</span>
                        <span style={{ fontSize:12, color:'var(--text3)' }}>{sl.length} · ${sl.reduce((s,l)=>s+(parseFloat(l.potential_value)||0),0).toLocaleString()}/mo</span>
                      </div>
                      {sl.map(l => <LeadCard key={l.id} lead={l} onEdit={() => setEditingLead({...l})} onDelete={() => onDeleteLead(l.id)} />)}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editingClient && (
        <Modal onClose={() => setEditingClient(null)}>
          <ClientForm client={editingClient} onChange={setEditingClient} onSave={() => onSaveClient(editingClient)} onCancel={() => setEditingClient(null)} saving={saving} />
        </Modal>
      )}
      {editingLead && (
        <Modal onClose={() => setEditingLead(null)}>
          <LeadForm lead={editingLead} onChange={setEditingLead} onSave={() => onSaveLead(editingLead)} onCancel={() => setEditingLead(null)} saving={saving} />
        </Modal>
      )}
    </div>
  )
}

// ─── ONBOARDING FOLDER ────────────────────────────────────────────
function OnboardingFolder({ clients, onboardingList, selected, setSelected, onSave, onRefresh, onBack, saving }) {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(SECTIONS[0])

  const selectClient = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    const existing = onboardingList.find(o => o.client_id === clientId)
    const f = existing || { client_id:clientId, client_name:client.name, answers:{}, meeting_notes:'' }
    setForm({ ...f })
    setActiveSection(SECTIONS[0])
  }

  const handleSave = async () => {
    if (!form) return
    const ok = await onSave(form)
    if (ok) {
      setSaved(true)
      await onRefresh()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handlePDF = () => {
    if (!form) return
    const w = window.open('', '_blank')
    if (!w) { alert('Please allow popups to download PDF'); return }
    const html = `<!DOCTYPE html><html><head><title>Onboarding - ${form.client_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;background:#0a0a14;color:#fff;padding:40px;font-size:14px}
h1{font-size:28px;font-weight:700;margin-bottom:4px}
h1 span{color:#ef4444}
.sub{color:#64748b;font-size:13px;margin-bottom:32px}
.section{margin-bottom:24px;page-break-inside:avoid}
.sec-title{font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#6366f1;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid rgba(99,102,241,0.2)}
.qa{margin-bottom:12px}
.q{font-size:11px;color:#94a3b8;margin-bottom:3px;font-weight:600}
.a{font-size:13px;color:#e2e8f0;background:rgba(255,255,255,0.04);padding:8px 12px;border-radius:6px;border-left:2px solid #6366f1;min-height:28px;white-space:pre-wrap;word-break:break-word}
.notes-box{background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:16px;margin-top:20px}
.notes-title{color:#8b5cf6;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px}
.footer{margin-top:32px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#475569;display:flex;justify-content:space-between}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:20px}h1{font-size:22px}.a{font-size:12px}}
</style></head><body>
<h1>ELEV<span>8</span> MEDIA</h1>
<div class="sub">Client Onboarding Form &mdash; ${form.client_name} &mdash; ${new Date().toLocaleDateString('en-CA', {year:'numeric',month:'long',day:'numeric'})}</div>
${SECTIONS.map(sec => {
  const qs = ONBOARDING_QUESTIONS.filter(q => q.section === sec)
  const hasAnswers = qs.some(q => (form.answers||{})[q.id])
  if (!hasAnswers) return ''
  return `<div class="section">
<div class="sec-title">${sec}</div>
${qs.map(q => {
  const ans = (form.answers||{})[q.id]
  if (!ans) return ''
  return `<div class="qa"><div class="q">${q.label}</div><div class="a">${ans}</div></div>`
}).join('')}
</div>`
}).join('')}
${form.meeting_notes ? `<div class="notes-box"><div class="notes-title">Meeting Notes</div><div style="white-space:pre-wrap;font-size:13px;color:#e2e8f0">${form.meeting_notes}</div></div>` : ''}
<div class="footer"><span>Elev8 Media OPS &mdash; Confidential</span><span>${new Date().toLocaleString()}</span></div>
</body></html>`
    w.document.open()
    w.document.write(html)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 800)
  }

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:'8px 14px' }}>← Back</button>
          <h2 style={{ fontSize:22, fontWeight:700 }}>📋 Onboarding Folder</h2>
        </div>
        {form && (
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {saved && <span style={{ color:'#22d3a5', fontSize:13 }}>✅ Saved!</span>}
            <button className="btn btn-ghost" onClick={handlePDF} style={{ padding:'8px 14px', fontSize:12 }}>⬇ PDF</button>
            <button className="btn btn-teal" onClick={handleSave} disabled={saving} style={{ padding:'8px 16px' }}>
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        )}
      </div>

      {/* Client pills */}
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Select Client</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {clients.length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:13 }}>Add clients in the Client Folder first.</div>
          ) : clients.map(c => {
            const hasForm = onboardingList.some(o => o.client_id === c.id)
            const isSelected = form?.client_id === c.id
            return (
              <button key={c.id} onClick={() => selectClient(c.id)} style={{
                padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border:'none',
                background: isSelected ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                color: isSelected ? '#a78bfa' : 'var(--text2)',
                outline: isSelected ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border)',
              }}>
                {c.name} {hasForm ? '✓' : '+'}
              </button>
            )
          })}
        </div>
      </div>

      {!form ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text3)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👆</div>
          <div>Select a client above to start or view their onboarding form</div>
        </div>
      ) : (
        <div>
          <div style={{ fontWeight:700, fontSize:18, marginBottom:16, color:'#fff' }}>
            {form.client_name}
            {onboardingList.find(o => o.client_id === form.client_id) && (
              <span style={{ fontSize:12, color:'#22d3a5', marginLeft:10, fontWeight:400 }}>● Saved</span>
            )}
          </div>

          {/* Section tabs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
            {SECTIONS.map(sec => (
              <button key={sec} onClick={() => setActiveSection(sec)} style={{
                padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
                background: activeSection===sec ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                color: activeSection===sec ? '#818cf8' : 'var(--text3)',
                outline: activeSection===sec ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
              }}>{sec}</button>
            ))}
            <button onClick={() => setActiveSection('notes')} style={{
              padding:'6px 12px', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', border:'none',
              background: activeSection==='notes' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
              color: activeSection==='notes' ? '#a78bfa' : 'var(--text3)',
              outline: activeSection==='notes' ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
            }}>📝 Meeting Notes</button>
          </div>

          {/* Questions */}
          {activeSection !== 'notes' && (
            <div className="card" style={{ borderColor:'rgba(99,102,241,0.2)' }}>
              <div className="label" style={{ color:'#818cf8', marginBottom:20 }}>{activeSection}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {ONBOARDING_QUESTIONS.filter(q => q.section === activeSection).map(q => (
                  <div key={q.id}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:6 }}>{q.label}</div>
                    {q.type === 'textarea' ? (
                      <textarea
                        value={(form.answers||{})[q.id]||''}
                        onChange={e => setForm(f => ({...f, answers:{...f.answers,[q.id]:e.target.value}}))}
                        style={{ height:90, resize:'vertical' }}
                        placeholder="Type here..."
                      />
                    ) : (
                      <input
                        type="text"
                        value={(form.answers||{})[q.id]||''}
                        onChange={e => setForm(f => ({...f, answers:{...f.answers,[q.id]:e.target.value}}))}
                        placeholder="Type here..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'notes' && (
            <div className="card purple">
              <div className="label" style={{ marginBottom:12 }}>Meeting Notes</div>
              <textarea
                value={form.meeting_notes||''}
                onChange={e => setForm(f => ({...f, meeting_notes:e.target.value}))}
                style={{ height:240, resize:'vertical' }}
                placeholder="Meeting notes, action items, ideas, anything discussed..."
              />
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
            {saved && <span style={{ color:'#22d3a5', fontSize:13, alignSelf:'center' }}>✅ Saved!</span>}
            <button className="btn btn-ghost" onClick={handlePDF}>⬇ Download PDF</button>
            <button className="btn btn-teal" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Form'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────
function ClientCard({ client, onEdit, onDelete }) {
  const statusColors = { 'Active':'teal', 'Paused':'amber', 'At Risk':'red', 'Churned':'gray' }
  const pct = client.videos_target > 0 ? Math.min((client.videos_delivered / client.videos_target) * 100, 100) : 0
  const barColor = pct >= 100 ? '#22d3a5' : pct >= 50 ? '#f59e0b' : '#6366f1'
  return (
    <div className="card" style={{ borderLeft:`3px solid ${barColor}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{client.name}</div>
            <span className={`badge ${statusColors[client.status]||'gray'}`}>{client.status}</span>
            {client.niche && <span className="badge purple" style={{ fontSize:10 }}>{client.niche}</span>}
          </div>
          {client.contact_name && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>👤 {client.contact_name}{client.contact_phone ? ` · ${client.contact_phone}` : ''}</div>}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:3 }}>
              <span>Videos {client.videos_delivered}/{client.videos_target}</span><span>{Math.round(pct)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${barColor}, ${barColor}88)` }} />
            </div>
          </div>
          {client.notes && <div style={{ marginTop:8, fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>📝 {client.notes}</div>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#22d3a5' }}>${(parseFloat(client.retainer)||0).toLocaleString()}<span style={{ fontSize:11, color:'var(--text3)' }}>/mo</span></div>
          {client.contract_start && <div style={{ fontSize:11, color:'var(--text3)' }}>Since {client.contract_start}</div>}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={onEdit} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)', cursor:'pointer' }}>Edit</button>
            <button onClick={onDelete} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer' }}>✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead, onEdit, onDelete }) {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8, flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:180 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
          <div style={{ fontWeight:700 }}>{lead.name}</div>
          {lead.business && <span style={{ fontSize:12, color:'var(--text3)' }}>· {lead.business}</span>}
          <span className={`badge ${stageColor(lead.stage)}`} style={{ fontSize:10 }}>{lead.stage}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>
          {lead.niche && <span style={{ marginRight:10 }}>🏷 {lead.niche}</span>}
          {lead.contact && <span style={{ marginRight:10 }}>📞 {lead.contact}</span>}
          {lead.last_contact && <span>Last: {lead.last_contact}</span>}
        </div>
        {lead.notes && <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, fontStyle:'italic' }}>📝 {lead.notes}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#8b5cf6' }}>${(parseFloat(lead.potential_value)||0).toLocaleString()}<span style={{ fontSize:11, color:'var(--text3)' }}>/mo</span></div>
        <button onClick={onEdit} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)', cursor:'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer' }}>✕</button>
      </div>
    </div>
  )
}

function ClientForm({ client, onChange, onSave, onCancel, saving }) {
  const f = client
  const s = (k, v) => onChange({...f, [k]:v})
  return (
    <div>
      <h3 style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>{f.id?.startsWith('new_') ? 'Add Client' : 'Edit Client'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <F label="Client Name *" value={f.name} onChange={v=>s('name',v)} />
        <F label="Niche" value={f.niche} onChange={v=>s('niche',v)} type="select" opts={NICHES} />
        <F label="Contact Name" value={f.contact_name} onChange={v=>s('contact_name',v)} />
        <F label="Phone" value={f.contact_phone} onChange={v=>s('contact_phone',v)} />
        <F label="Email" value={f.contact_email} onChange={v=>s('contact_email',v)} />
        <F label="Retainer ($/mo)" value={f.retainer} onChange={v=>s('retainer',v)} type="number" />
        <F label="Videos Target" value={f.videos_target} onChange={v=>s('videos_target',v)} type="number" />
        <F label="Videos Delivered" value={f.videos_delivered} onChange={v=>s('videos_delivered',v)} type="number" />
        <F label="Contract Start" value={f.contract_start} onChange={v=>s('contract_start',v)} type="date" />
        <F label="Status" value={f.status} onChange={v=>s('status',v)} type="select" opts={STATUSES} />
      </div>
      <F label="Notes" value={f.notes} onChange={v=>s('notes',v)} type="textarea" />
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-teal" onClick={onSave} disabled={saving||!f.name}>{saving?'Saving...':'Save Client'}</button>
      </div>
    </div>
  )
}

function LeadForm({ lead, onChange, onSave, onCancel, saving }) {
  const f = lead
  const s = (k, v) => onChange({...f, [k]:v})
  return (
    <div>
      <h3 style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>{f.id?.startsWith('new_') ? 'Add Lead' : 'Edit Lead'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <F label="Contact Name *" value={f.name} onChange={v=>s('name',v)} />
        <F label="Business" value={f.business} onChange={v=>s('business',v)} />
        <F label="Niche" value={f.niche} onChange={v=>s('niche',v)} type="select" opts={NICHES} />
        <F label="Contact (phone/email/IG)" value={f.contact} onChange={v=>s('contact',v)} />
        <F label="Stage" value={f.stage} onChange={v=>s('stage',v)} type="select" opts={STAGES} />
        <F label="Potential Value ($/mo)" value={f.potential_value} onChange={v=>s('potential_value',v)} type="number" />
        <F label="Last Contact Date" value={f.last_contact} onChange={v=>s('last_contact',v)} type="date" />
      </div>
      <F label="Notes" value={f.notes} onChange={v=>s('notes',v)} type="textarea" />
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-teal" onClick={onSave} disabled={saving||!f.name}>{saving?'Saving...':'Save Lead'}</button>
      </div>
    </div>
  )
}

const F = ({ label, value, onChange, type='text', opts=[] }) => (
  <div>
    <div style={{ fontSize:12, color:'var(--text2)', marginBottom:5, fontWeight:600 }}>{label}</div>
    {type==='select' ? (
      <select value={value||''} onChange={e=>onChange(e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
    ) : type==='textarea' ? (
      <textarea value={value||''} onChange={e=>onChange(e.target.value)} style={{ height:80 }} />
    ) : (
      <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} />
    )}
  </div>
)

const Modal = ({ children, onClose }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
    <div style={{ background:'var(--card)', borderRadius:16, padding:28, width:'100%', maxWidth:580, border:'1px solid rgba(99,102,241,0.3)', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
)

const EmptyState = ({ icon, msg }) => (
  <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
    <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div><div>{msg}</div>
  </div>
)

const stageColor = s => ({ Cold:'gray', Warm:'blue', 'Proposal Sent':'amber', Negotiating:'pink', 'Closed Won':'teal', 'Closed Lost':'red' }[s]||'gray')
