import { useState, useEffect } from 'react'
import { C, Btn, Skeleton } from './ui.jsx'
import { todayStr } from '../lib/config.js'
import { getTeamMembers } from '../lib/supabase.js'
import PINGate   from './PINGate.jsx'
import LogMyDay  from './LogMyDay.jsx'
import MyStats   from './MyStats.jsx'
import TeamBoard from './TeamBoard.jsx'

const TABS = [
  { id:'log',   label:'Log My Day',  icon:'✏️' },
  { id:'stats', label:'My Stats',    icon:'📊' },
  { id:'team',  label:'Leaderboard', icon:'🏆' },
]

export default function TeamPortal() {
  const [members,   setMembers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [member,    setMember]    = useState(null)
  const [sub,       setSub]       = useState('log')
  const today = todayStr()

  useEffect(() => {
    getTeamMembers()
      .then(d => { setMembers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // PIN gate
  if (selected && !member) {
    return <PINGate memberName={selected.name} initials={selected.initials} onSuccess={m => setMember(m)} onBack={() => setSelected(null)} />
  }

  // Logged in — show sub-nav + content
  if (member) {
    return (
      <div>
        {/* Sub nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', gap:2, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4 }}>
            {TABS.map(t => {
              const active = sub === t.id
              return (
                <button key={t.id} onClick={() => setSub(t.id)} style={{
                  display:'flex', alignItems:'center', gap:6,
                  fontSize:13, padding:'7px 14px', borderRadius:7, border:'none',
                  background: active ? C.surface3 : 'none',
                  color: active ? C.text : C.text3,
                  fontWeight: active ? 600 : 400,
                  cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                }}>
                  <span style={{ fontSize:14 }}>{t.icon}</span>{t.label}
                </button>
              )
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background:C.redDim, border:`1px solid ${C.redBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:800, color:C.red,
              }}>{member.initials}</div>
              <span style={{ fontSize:13, color:C.text2, fontWeight:500 }}>{member.name}</span>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => { setMember(null); setSelected(null) }}>
              Switch
            </Btn>
          </div>
        </div>

        <div className="fade-in" key={sub}>
          {sub === 'log'   && <LogMyDay  member={member} today={today} />}
          {sub === 'stats' && <MyStats   member={member} today={today} />}
          {sub === 'team'  && <TeamBoard today={today} />}
        </div>
      </div>
    )
  }

  // Name picker
  return (
    <div className="fade-in">
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Who are you?</div>
        <div style={{ fontSize:13, color:C.text3 }}>Select your name to access your portal</div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={64} radius={10} />)}
        </div>
      ) : members.length === 0 ? (
        <div style={{ color:C.text3, padding:'2rem 0', fontSize:13 }}>No team members found. Contact your manager.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:8, maxWidth:700 }}>
          {members.map(m => (
            <button key={m.id} onClick={() => setSelected(m)} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'14px 16px', borderRadius:10,
              border:`1px solid ${C.border}`, background:C.surface,
              cursor:'pointer', color:C.text, fontFamily:'inherit',
              textAlign:'left', transition:'border-color .15s, background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.redBorder; e.currentTarget.style.background = C.surface2 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}
            >
              <div style={{
                width:40, height:40, borderRadius:'50%', flexShrink:0,
                background:C.redDim, border:`1px solid ${C.redBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, color:C.red,
              }}>{m.initials}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{m.name}</div>
                <div style={{ fontSize:11, color:C.text3, textTransform:'capitalize' }}>{m.role}</div>
              </div>
              <span style={{ color:C.red, fontSize:16, marginLeft:'auto' }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
