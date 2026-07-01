import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const NICHES = ['Real Estate','Mortgage/Lending','Restaurant','Education','E-commerce','Service Business','Founder/Personal Brand','Other']
const STAGES = ['Cold','Warm','Proposal Sent','Negotiating','Closed Won','Closed Lost']
const STATUSES = ['Active','Paused','At Risk','Churned']

const ONBOARDING_QUESTIONS = [
  { id:'business_name', section:'Business', label:'Business / Brand Name', type:'text' },
  { id:'owner_name', section:'Business', label:'Owner / Main Contact Name', type:'text' },
  { id:'email', section:'Business', label:'Email Address', type:'text' },
  { id:'phone', section:'Business', label:'Phone Number', type:'text' },
  { id:'website', section:'Business', label:'Website URL', type:'text' },
  { id:'socials', section:'Business', label:'Social Media Handles (IG, TikTok, YouTube, FB)', type:'textarea' },
  { id:'niche', section:'Business', label:'Industry / Niche', type:'text' },
  { id:'location', section:'Business', label:'Business Location / Service Area', type:'text' },
  { id:'target_audience', section:'Strategy', label:'Who is your ideal client? (age, gender, location, income)', type:'textarea' },
  { id:'pain_points', section:'Strategy', label:"What problems does your audience have that you solve?", type:'textarea' },
  { id:'unique_value', section:'Strategy', label:'What makes you different from competitors?', type:'textarea' },
  { id:'competitors', section:'Strategy', label:'Who are your main competitors? (names or handles)', type:'textarea' },
  { id:'content_goals', section:'Strategy', label:'What are your main content goals? (leads, brand awareness, sales)', type:'textarea' },
  { id:'past_content', section:'Strategy', label:'Have you done content before? What worked / what did not?', type:'textarea' },
  { id:'dream_result', section:'Strategy', label:'What does success look like for you in 6 months?', type:'textarea' },
  { id:'tone', section:'Creative', label:'How should your brand sound? (professional, casual, bold, educational)', type:'text' },
  { id:'topics', section:'Creative', label:'What topics or content pillars do you want to cover?', type:'textarea' },
  { id:'avoid', section:'Creative', label:'Anything you never want to say or show in content?', type:'textarea' },
  { id:'inspiration', section:'Creative', label:'Any creators or brands whose content style you love?', type:'textarea' },
  { id:'assets', section:'Creative', label:'Do you have existing brand assets? (logo, colors, fonts, photos)', type:'text' },
  { id:'shoot_days', section:'Production', label:'How many shoot days per month are you available?', type:'text' },
  { id:'shoot_location', section:'Production', label:'Preferred shoot location(s)', type:'text' },
  { id:'team_size', section:'Production', label:'Will anyone else be in the content? (team, clients, guests)', type:'text' },
  { id:'special_reqs', section:'Production', label:'Any special requirements or things to know before we start?', type:'textarea' },
  { id:'extra_notes', section:'Notes', label:'Additional notes, ideas, or anything else', type:'textarea' },
]

export default function ClientHub({ onBack }) {
  const [tab, setTab] = useState('clients')
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])
  const [onboardingList, setOnboardingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [onboardingClient, setOnboardingClient] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: l }, { data: o }] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('onboarding').select('*').order('created_at', { ascending: false }),
      ])
      setClients(c || [])
      setLeads(l || [])
      setOnboardingList(o || [])
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const saveClient = async (client) => {
    setSaving(true)
    try {
      if (client.id && !client.id.startsWith('new_')) {
        await supabase.from('clients').update({ ...client, updated_at: new Date().toISOString() }).eq('id', client.id)
      } else {
        const { id, ...rest } = client
        await supabase.from('clients').insert({ ...rest })
      }
      await loadAll()
      setEditingClient(null)
    } catch(e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const saveLead = async (lead) => {
    setSaving(true)
    try {
      if (lead.id && !lead.id.startsWith('new_')) {
        await supabase.from('leads').update({ ...lead, updated_at: new Date().toISOString() }).eq('id', lead.id)
      } else {
        const { id, ...rest } = lead
        await supabase.from('leads').insert({ ...rest })
      }
      await loadAll()
      setEditingLead(null)
    } catch(e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const deleteClient = async (id) => {
    if (!confirm('Delete this client?')) return
    await supabase.from('clients').delete().eq('id', id)
    await loadAll()
  }

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    await loadAll()
  }

  const totalMRR = clients.filter(c => c.status === 'Active').reduce((s,c) => s + (parseFloat(c.retainer)||0), 0)
  const pipelineValue = leads.filter(l => !['Closed Won','Closed Lost'].includes(l.stage)).reduce((s,l) => s + (parseFloat(l.potential_value)||0), 0)
  const activeCount = clients.filter(c => c.status === 'Active').length
  const atRisk = clients.filter(c => c.status === 'At Risk').length

  const tabs = [
    { id:'clients', label:'👥 Active Clients' },
    { id:'crm', label:'🎯 CRM Pipeline' },
    { id:'onboarding', label:'📋 Onboarding' },
  ]

  if (loading) return <div style={{ textAlign:'center', padding:80, color:'var(--text2)', fontFamily:'Space Grotesk' }}>Loading Client Hub...</div>

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding:'8px 14px' }}>← Back</button>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700 }}>Client <span style={{ color:'#8b5cf6' }}>Hub</span></h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Clients · CRM · Onboarding</div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={loadAll} style={{ padding:'8px 14px' }}>↻ Refresh</button>
      </div>

      {/* Summary Bar */}
      <div className="grid-4" style={{ gap:12, marginBottom:24 }}>
        {[
          ['Total MRR', `$${totalMRR.toLocaleString()}`, '#22d3a5'],
          ['Pipeline', `$${pipelineValue.toLocaleString()}`, '#8b5cf6'],
          ['Active Clients', activeCount, '#6366f1'],
          ['At Risk', atRisk, atRisk > 0 ? '#f87171' : '#22d3a5'],
        ].map(([l,v,c]) => (
          <div key={l} className="card" style={{ borderColor:`${c}33`, padding:'14px 18px' }}>
            <div className="label" style={{ marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:24, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--card)', borderRadius:10, padding:4, width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600,
            background: tab===t.id ? '#8b5cf6' : 'transparent',
            color: tab===t.id ? '#fff' : 'var(--text2)',
            border:'none', cursor:'pointer', whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ACTIVE CLIENTS */}
      {tab==='clients' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className="btn btn-blue" onClick={() => setEditingClient({ id:`new_${Date.now()}`, name:'', niche:'', retainer:0, videos_target:10, videos_delivered:0, contract_start:'', status:'Active', notes:'', contact_name:'', contact_email:'', contact_phone:'' })}>
              + Add Client
            </button>
          </div>

          {clients.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
              <div>No clients yet. Add your first client above.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {clients.map(client => (
                <ClientCard key={client.id} client={client} onEdit={() => setEditingClient({...client})} onDelete={() => deleteClient(client.id)} onboard={onboardingList.find(o=>o.client_id===client.id)} onOpenOnboarding={() => { setOnboardingClient(onboardingList.find(o=>o.client_id===client.id) || { client_id:client.id, client_name:client.name, answers:{}, meeting_notes:'' }); setTab('onboarding') }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CRM PIPELINE */}
      {tab==='crm' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className="btn btn-blue" onClick={() => setEditingLead({ id:`new_${Date.now()}`, name:'', business:'', niche:'', contact:'', stage:'Cold', potential_value:0, last_contact:'', notes:'' })}>
              + Add Lead
            </button>
          </div>

          {STAGES.slice(0,-1).map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage)
            if (stageLeads.length === 0) return null
            return (
              <div key={stage} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span className={`badge ${stageColor(stage)}`}>{stage}</span>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>{stageLeads.length} lead{stageLeads.length!==1?'s':''} · ${stageLeads.reduce((s,l)=>s+(parseFloat(l.potential_value)||0),0).toLocaleString()}/mo potential</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {stageLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onEdit={() => setEditingLead({...lead})} onDelete={() => deleteLead(lead.id)} />
                  ))}
                </div>
              </div>
            )
          })}

          {leads.length === 0 && (
            <div style={{ textAlign:'center', padding:60, color:'var(--text2)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
              <div>No leads yet. Start tracking your pipeline.</div>
            </div>
          )}
        </div>
      )}

      {/* ONBOARDING */}
      {tab==='onboarding' && (
        <OnboardingTab
          clients={clients}
          onboardingList={onboardingList}
          selected={onboardingClient}
          setSelected={setOnboardingClient}
          onSave={loadAll}
        />
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <Modal onClose={() => setEditingClient(null)}>
          <ClientForm client={editingClient} onChange={setEditingClient} onSave={() => saveClient(editingClient)} onCancel={() => setEditingClient(null)} saving={saving} />
        </Modal>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <Modal onClose={() => setEditingLead(null)}>
          <LeadForm lead={editingLead} onChange={setEditingLead} onSave={() => saveLead(editingLead)} onCancel={() => setEditingLead(null)} saving={saving} />
        </Modal>
      )}
    </div>
  )
}

function ClientCard({ client, onEdit, onDelete, onboard, onOpenOnboarding }) {
  const statusColors = { 'Active':'teal', 'Paused':'amber', 'At Risk':'red', 'Churned':'gray' }
  const pct = client.videos_target > 0 ? Math.min((client.videos_delivered / client.videos_target) * 100, 100) : 0
  return (
    <div className="card" style={{ borderLeft:`3px solid ${pct>=100?'#22d3a5':pct>=50?'#f59e0b':'#6366f1'}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ fontWeight:700, fontSize:16 }}>{client.name}</div>
            <span className={`badge ${statusColors[client.status]||'gray'}`}>{client.status}</span>
            {client.niche && <span className="badge purple" style={{ fontSize:10 }}>{client.niche}</span>}
          </div>
          {client.contact_name && <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>👤 {client.contact_name} {client.contact_phone ? `· ${client.contact_phone}` : ''}</div>}
          <div style={{ marginTop:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:4 }}>
              <span>Videos: {client.videos_delivered}/{client.videos_target}</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${pct>=100?'#22d3a5':pct>=50?'#f59e0b':'#6366f1'}, ${pct>=100?'#22d3a5aa':pct>=50?'#f59e0baa':'#6366f1aa'})` }} />
            </div>
          </div>
          {client.notes && <div style={{ marginTop:8, fontSize:12, color:'var(--text2)', fontStyle:'italic' }}>📝 {client.notes}</div>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#22d3a5' }}>${(parseFloat(client.retainer)||0).toLocaleString()}<span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>/mo</span></div>
          {client.contract_start && <div style={{ fontSize:11, color:'var(--text3)' }}>Since {client.contract_start}</div>}
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={onOpenOnboarding} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(139,92,246,0.15)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.3)', cursor:'pointer' }}>
              {onboard ? '📋 View Form' : '📋 Onboard'}
            </button>
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
    <div className="card" style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <div style={{ fontWeight:700 }}>{lead.name}</div>
          {lead.business && <span style={{ fontSize:12, color:'var(--text3)' }}>· {lead.business}</span>}
          <span className={`badge ${stageColor(lead.stage)}`} style={{ fontSize:10 }}>{lead.stage}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text3)' }}>
          {lead.niche && <span style={{ marginRight:10 }}>🏷 {lead.niche}</span>}
          {lead.contact && <span style={{ marginRight:10 }}>📞 {lead.contact}</span>}
          {lead.last_contact && <span>Last contact: {lead.last_contact}</span>}
        </div>
        {lead.notes && <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, fontStyle:'italic' }}>📝 {lead.notes}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#8b5cf6' }}>${(parseFloat(lead.potential_value)||0).toLocaleString()}<span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>/mo</span></div>
        <button onClick={onEdit} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(99,102,241,0.15)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.3)', cursor:'pointer' }}>Edit</button>
        <button onClick={onDelete} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', cursor:'pointer' }}>✕</button>
      </div>
    </div>
  )
}

function OnboardingTab({ clients, onboardingList, selected, setSelected, onSave }) {
  const [form, setForm] = useState(selected || null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { if (selected) setForm({ ...selected }) }, [selected])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const data = { ...form, updated_at: new Date().toISOString() }
      if (form.id) {
        await supabase.from('onboarding').upsert(data)
      } else {
        await supabase.from('onboarding').insert(data)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      await onSave()
    } catch(e) { alert('Save failed: ' + e.message) }
    setSaving(false)
  }

  const handleDownloadPDF = () => {
    if (!form) return
    const sections = [...new Set(ONBOARDING_QUESTIONS.map(q => q.section))]
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>Onboarding — ${form.client_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Space Grotesk',sans-serif;background:#0a0a14;color:#fff;padding:40px}
    .header{margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.1)}
    .logo h1{font-size:28px;font-weight:700}.logo span{color:#ef4444}
    .client{font-size:18px;color:#8b5cf6;margin-top:8px;font-weight:600}
    .date{font-size:12px;color:#64748b;margin-top:4px}
    .section{margin-bottom:28px}
    .section-title{font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#6366f1;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid rgba(99,102,241,0.2)}
    .qa{margin-bottom:14px}
    .q{font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}
    .a{font-size:14px;color:#fff;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:8px;border-left:3px solid #6366f1;min-height:36px;white-space:pre-wrap}
    .notes{margin-top:28px;padding:20px;background:rgba(139,92,246,0.08);border-radius:12px;border:1px solid rgba(139,92,246,0.2)}
    .notes-title{font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#8b5cf6;margin-bottom:12px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);font-size:11px;color:#475569;display:flex;justify-content:space-between}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
    <div class="header"><div class="logo"><h1>ELEV<span>8</span> MEDIA</h1></div>
    <div class="client">Client Onboarding — ${form.client_name}</div>
    <div class="date">Generated ${new Date().toLocaleDateString()}</div></div>
    ${sections.map(sec => `
      <div class="section">
        <div class="section-title">${sec}</div>
        ${ONBOARDING_QUESTIONS.filter(q=>q.section===sec).map(q => `
          <div class="qa">
            <div class="q">${q.label}</div>
            <div class="a">${(form.answers||{})[q.id] || '—'}</div>
          </div>`).join('')}
      </div>`).join('')}
    ${form.meeting_notes ? `<div class="notes"><div class="notes-title">Meeting Notes</div><div style="white-space:pre-wrap;font-size:14px">${form.meeting_notes}</div></div>` : ''}
    <div class="footer"><span>Elev8 Media OPS · Confidential</span><span>${new Date().toLocaleString()}</span></div>
    </body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => w.print(), 500)
  }

  const selectClient = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    const existing = onboardingList.find(o => o.client_id === clientId)
    if (existing) {
      setForm({ ...existing })
    } else {
      setForm({ client_id: clientId, client_name: client.name, answers: {}, meeting_notes: '' })
    }
  }

  return (
    <div>
      {/* Client selector */}
      <div style={{ marginBottom:20 }}>
        <div className="label" style={{ marginBottom:8 }}>Select Client</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {clients.map(c => {
            const hasForm = onboardingList.some(o => o.client_id === c.id)
            return (
              <button key={c.id} onClick={() => selectClient(c.id)} style={{
                padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
                background: form?.client_id===c.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                color: form?.client_id===c.id ? '#a78bfa' : 'var(--text2)',
                border: `1px solid ${form?.client_id===c.id ? 'rgba(139,92,246,0.5)' : 'var(--border)'}`,
              }}>
                {c.name} {hasForm ? '✓' : ''}
              </button>
            )
          })}
          {clients.length === 0 && <div style={{ color:'var(--text3)', fontSize:13 }}>Add clients first in the Active Clients tab</div>}
        </div>
      </div>

      {form && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:18 }}>{form.client_name}</div>
            <div style={{ display:'flex', gap:8 }}>
              {saved && <span style={{ color:'#22d3a5', fontSize:13, alignSelf:'center' }}>✅ Saved!</span>}
              <button className="btn btn-ghost" onClick={handleDownloadPDF} style={{ padding:'8px 14px', fontSize:12 }}>⬇ Download PDF</button>
              <button className="btn btn-teal" onClick={handleSave} disabled={saving} style={{ padding:'8px 14px', fontSize:12 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Questions by section */}
          {[...new Set(ONBOARDING_QUESTIONS.map(q => q.section))].map(sec => (
            <div key={sec} className="card" style={{ marginBottom:16, borderColor:'rgba(99,102,241,0.2)' }}>
              <div className="label" style={{ color:'#818cf8', marginBottom:16 }}>{sec}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {ONBOARDING_QUESTIONS.filter(q => q.section===sec).map(q => (
                  <div key={q.id}>
                    <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6, fontWeight:600 }}>{q.label}</div>
                    {q.type==='textarea' ? (
                      <textarea
                        value={(form.answers||{})[q.id]||''}
                        onChange={e => setForm(f => ({ ...f, answers:{ ...f.answers, [q.id]:e.target.value } }))}
                        style={{ height:80, resize:'vertical' }}
                        placeholder="Type here..."
                      />
                    ) : (
                      <input
                        type="text"
                        value={(form.answers||{})[q.id]||''}
                        onChange={e => setForm(f => ({ ...f, answers:{ ...f.answers, [q.id]:e.target.value } }))}
                        placeholder="Type here..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Meeting notes */}
          <div className="card purple">
            <div className="label" style={{ marginBottom:12 }}>Meeting Notes</div>
            <textarea
              value={form.meeting_notes||''}
              onChange={e => setForm(f => ({ ...f, meeting_notes:e.target.value }))}
              style={{ height:140, resize:'vertical' }}
              placeholder="Any additional notes from the meeting, ideas, action items..."
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ClientForm({ client, onChange, onSave, onCancel, saving }) {
  const f = client
  const set = (k, v) => onChange({ ...f, [k]: v })
  return (
    <div style={{ maxHeight:'80vh', overflowY:'auto', padding:'4px' }}>
      <h3 style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>{f.id?.startsWith('new_') ? 'Add New Client' : 'Edit Client'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <Field label="Client / Business Name *" value={f.name} onChange={v=>set('name',v)} />
        <Field label="Niche" value={f.niche} onChange={v=>set('niche',v)} type="select" options={NICHES} />
        <Field label="Contact Name" value={f.contact_name} onChange={v=>set('contact_name',v)} />
        <Field label="Contact Email" value={f.contact_email} onChange={v=>set('contact_email',v)} />
        <Field label="Contact Phone" value={f.contact_phone} onChange={v=>set('contact_phone',v)} />
        <Field label="Monthly Retainer ($)" value={f.retainer} onChange={v=>set('retainer',v)} type="number" />
        <Field label="Videos Target / Month" value={f.videos_target} onChange={v=>set('videos_target',v)} type="number" />
        <Field label="Videos Delivered" value={f.videos_delivered} onChange={v=>set('videos_delivered',v)} type="number" />
        <Field label="Contract Start Date" value={f.contract_start} onChange={v=>set('contract_start',v)} type="date" />
        <Field label="Status" value={f.status} onChange={v=>set('status',v)} type="select" options={STATUSES} />
      </div>
      <Field label="Notes" value={f.notes} onChange={v=>set('notes',v)} type="textarea" />
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-teal" onClick={onSave} disabled={saving || !f.name}>{saving ? 'Saving...' : 'Save Client'}</button>
      </div>
    </div>
  )
}

function LeadForm({ lead, onChange, onSave, onCancel, saving }) {
  const f = lead
  const set = (k, v) => onChange({ ...f, [k]: v })
  return (
    <div style={{ maxHeight:'80vh', overflowY:'auto', padding:'4px' }}>
      <h3 style={{ fontWeight:700, fontSize:18, marginBottom:20 }}>{f.id?.startsWith('new_') ? 'Add New Lead' : 'Edit Lead'}</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <Field label="Contact Name *" value={f.name} onChange={v=>set('name',v)} />
        <Field label="Business Name" value={f.business} onChange={v=>set('business',v)} />
        <Field label="Niche" value={f.niche} onChange={v=>set('niche',v)} type="select" options={NICHES} />
        <Field label="Contact (phone/email/IG)" value={f.contact} onChange={v=>set('contact',v)} />
        <Field label="Stage" value={f.stage} onChange={v=>set('stage',v)} type="select" options={STAGES} />
        <Field label="Potential Value ($/mo)" value={f.potential_value} onChange={v=>set('potential_value',v)} type="number" />
        <Field label="Last Contact Date" value={f.last_contact} onChange={v=>set('last_contact',v)} type="date" />
      </div>
      <Field label="Notes" value={f.notes} onChange={v=>set('notes',v)} type="textarea" />
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-teal" onClick={onSave} disabled={saving || !f.name}>{saving ? 'Saving...' : 'Save Lead'}</button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type='text', options=[] }) {
  return (
    <div>
      <div style={{ fontSize:12, color:'var(--text2)', marginBottom:6, fontWeight:600 }}>{label}</div>
      {type==='select' ? (
        <select value={value||''} onChange={e=>onChange(e.target.value)}>
          {options.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : type==='textarea' ? (
        <textarea value={value||''} onChange={e=>onChange(e.target.value)} style={{ height:80 }} />
      ) : (
        <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} />
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:'var(--card)', borderRadius:16, padding:28, width:'100%', maxWidth:600, border:'1px solid rgba(99,102,241,0.3)', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const stageColor = (stage) => {
  const m = { 'Cold':'gray', 'Warm':'blue', 'Proposal Sent':'amber', 'Negotiating':'pink', 'Closed Won':'teal', 'Closed Lost':'red' }
  return m[stage]||'gray'
}
