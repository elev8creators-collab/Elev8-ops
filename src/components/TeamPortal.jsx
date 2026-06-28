import { useState, useEffect } from 'react'
import { C, Btn, Skeleton, Badge } from './ui.jsx'
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
  const [members,  setMembers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [member,   setMember]   = useState(null)
  const [sub,      setSub]      = useState('log')
  const today = todayStr()

  useEffect(() => {
    getTeamMembers()
      .then(d => { setMembers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function signOut() {
    setMember(null)
    setSelected(null)
    setSub('log')
  }

  // PIN gate
  if (selected && !member) {
    return (
      <PINGate
        memberName={selected.name}
        initials={selected.initials}
        onSuccess={m => { setMember(m); setSub('log') }}
        onBack={() => setSelected(null)}
      />
    )
  }

  // Logged in
  if (member) {
    return (
      <div>
        {/* Sub-nav */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'1.75rem', flexWrap:'wrap', gap:8,
          paddingBottom:'1.25rem', borderBottom:`1px solid ${C.border}`,
        }}>
          <div style={{ display:'flex', gap:2, background:C.surface2, borderRadius:10, padding:4 }}>
            {TABS.map(t => {
              const active = sub === t.id
              return (
                <button key={t.id} onClick={() => setSub(t.id)} style={{
                  display:'flex', alignItems:'center', gap:6,
                  fontSize:13, padding:'7px 14px', borderRadius:7, border:'none',
                  background: active ? C.bg : 'none',
                  color: active ? C.text : C.text3,
                  fontWeight: active ? 600 : 400,
                  cursor:'pointer', fontFamily:'inherit',
                  boxShadow: active ? C.shadowSm : 'none',
                  transition:'all .12s',
                }}>
                  <span>{t.icon}</span>{t.label}
                </button>
              )
            })}
          </div>

          {/* User pill */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8,
              padding:'6px 12px', borderRadius:20,
              background:C.surface2, border:`1px solid ${C.border}` }}>
              <div style={{
                width:24, height:24, borderRadius:'50%', flexShrink:0,
                background:C.redDim, border:`1.5px solid ${C.redBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:9, fontWeight:800, color:C.red,
              }}>{member.initials}</div>
              <span style={{ fontSize:13, color:C.text2, fontWeight:500 }}>{member.name}</span>
            </div>
            <Btn variant="ghost" size="sm" onClick={signOut}>Sign out</Btn>
          </div>
        </div>

        <div className="fade-in" key={sub}>
          {sub === 'log'   && <LogMyDay  member={member} today={today} onSignOut={signOut} />}
          {sub === 'stats' && <MyStats   member={member} today={today} />}
          {sub === 'team'  && <TeamBoard today={today} />}
        </div>
      </div>
    )
  }

  // Name picker
  return (
    <div className="fade-in">
      <div style={{ marginBottom:'1.75rem' }}>
        <div style={{ fontSize:26, fontWeight:800, color:C.text, letterSpacing:'-.4px', marginBottom:4 }}>
          Who are you?
        </div>
        <div style={{ fontSize:14, color:C.text3 }}>Select your name to access your portal</div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10, maxWidth:700 }}>
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={72} radius={12} />)}
        </div>
      ) : members.length === 0 ? (
        <div style={{ color:C.text3, padding:'2rem 0', fontSize:14 }}>
          No team members found. Contact your manager.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10, maxWidth:680 }}>
          {members.map(m => (
            <button key={m.id} onClick={() => setSelected(m)} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'14px 16px', borderRadius:12,
              border:`1px solid ${C.border}`, background:C.bg,
              cursor:'pointer', color:C.text, fontFamily:'inherit', textAlign:'left',
              boxShadow:C.shadowSm,
              transition:'box-shadow .15s, border-color .15s, transform .1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow=C.shadowMd; e.currentTarget.style.borderColor=C.redBorder; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow=C.shadowSm; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='translateY(0)' }}
            >
              <div style={{
                width:44, height:44, borderRadius:'50%', flexShrink:0,
                background:C.redDim, border:`1.5px solid ${C.redBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:800, color:C.red,
              }}>{m.initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:2 }}>{m.name}</div>
                <div style={{ fontSize:12, color:C.text3, textTransform:'capitalize' }}>{m.role}</div>
              </div>
              <span style={{ color:C.red, fontSize:18 }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
