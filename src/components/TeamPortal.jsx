import { useState, useEffect } from 'react'
import { Card, Btn, T } from './ui.jsx'
import { todayStr, fmtDate } from '../lib/config.js'
import { getTeamMembers } from '../lib/supabase.js'
import PINGate  from './PINGate.jsx'
import LogMyDay from './LogMyDay.jsx'
import MyStats  from './MyStats.jsx'
import TeamBoard from './TeamBoard.jsx'

const TABS = [['log', 'Log my day'], ['stats', 'My stats'], ['team', 'Team']]

export default function TeamPortal() {
  const [members,    setMembers]    = useState([])
  const [selected,   setSelected]   = useState(null) // { name }
  const [member,     setMember]     = useState(null) // verified member
  const [sub,        setSub]        = useState('log')
  const [guestName,  setGuestName]  = useState('')
  const today = todayStr()

  useEffect(() => { getTeamMembers().then(setMembers) }, [])

  // Name selected — show PIN gate
  if (selected && !member) {
    return (
      <PINGate
        memberName={selected.name}
        onSuccess={(m) => setMember(m)}
        onBack={() => setSelected(null)}
      />
    )
  }

  // Logged in — show portal
  if (member) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, background: '#18181F', borderRadius: 11, padding: 4 }}>
            {TABS.map(([v, l]) => (
              <button key={v} onClick={() => setSub(v)} style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 8, border: 'none',
                background: sub === v ? T.red : 'none',
                color: sub === v ? '#fff' : T.muted,
                fontWeight: sub === v ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: T.muted }}>{member.name}</span>
            <Btn variant="ghost" onClick={() => { setMember(null); setSelected(null) }} style={{ fontSize: 12, padding: '5px 10px' }}>
              Switch
            </Btn>
          </div>
        </div>
        {sub === 'log'   && <LogMyDay  member={member} today={today} fmtDate={fmtDate} />}
        {sub === 'stats' && <MyStats   member={member} today={today} />}
        {sub === 'team'  && <TeamBoard today={today} />}
      </div>
    )
  }

  // Name picker
  return (
    <div style={{ maxWidth: 400, margin: '2.5rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>Who are you?</div>
        <div style={{ fontSize: 13, color: T.muted }}>Select your name to continue</div>
      </div>

      {members.length === 0 ? (
        <div style={{ textAlign: 'center', color: T.muted, padding: '1rem' }}>Loading team…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {members.map(m => (
            <button key={m.id} onClick={() => setSelected(m)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,.06)', background: '#18181F',
              cursor: 'pointer', color: T.text, fontFamily: 'inherit',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(226,75,74,.1)', border: '1px solid rgba(226,75,74,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: T.red,
                }}>{m.initials}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: 'capitalize' }}>{m.role}</div>
                </div>
              </div>
              <span style={{ color: T.red, fontSize: 16 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {/* Guest slot */}
      <div style={{ border: '1.5px dashed rgba(255,255,255,.08)', borderRadius: 12, padding: '1rem' }}>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Someone else? Type your name:</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Your name" value={guestName} onChange={e => setGuestName(e.target.value)}
            style={{ flex: 1, fontSize: 13, padding: '9px 11px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,.06)', background: '#18181F', color: T.text, outline: 'none' }} />
          <Btn disabled={!guestName.trim()} onClick={() => {
            const m = { id: 'guest', name: guestName.trim(), role: 'editor',
              initials: guestName.trim().slice(0, 2).toUpperCase(), pin: '' }
            setMember(m)
          }}>
            Go →
          </Btn>
        </div>
      </div>
    </div>
  )
}
