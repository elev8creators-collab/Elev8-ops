import { useState, useEffect } from 'react'
import { C } from './components/ui.jsx'
import TeamPortal   from './components/TeamPortal.jsx'
import ManagerPortal from './components/ManagerPortal.jsx'

const NAV = [
  { id:'team',    label:'Team Portal',  icon:'👥' },
  { id:'manager', label:'Manager',      icon:'🔒' },
]

export default function App() {
  const [tab, setTab] = useState('team')

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink:0, background:C.surface,
        borderRight:`1px solid ${C.border}`,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:50,
      }}>
        {/* Logo */}
        <div style={{ padding:'1.25rem 1.25rem 1rem', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.12em', color:C.text, textTransform:'uppercase' }}>
            ELEV<span style={{ color:C.red }}>8</span> MEDIA
          </div>
          <div style={{ fontSize:10, color:C.text3, marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>
            Operations
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'0.75rem 0.5rem', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(n => {
            const active = tab === n.id
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 14px', borderRadius:8, border:'none',
                background: active ? C.redDim : 'none',
                color: active ? C.red : C.text2,
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor:'pointer', fontFamily:'inherit',
                textAlign:'left', width:'100%',
                borderLeft: active ? `2px solid ${C.red}` : '2px solid transparent',
                transition:'all .15s',
              }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                {n.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'0.75rem 1rem', borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.text3, letterSpacing:'.05em' }}>
            ELEV8 MEDIA OPS • V3
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft:220, flex:1, minHeight:'100vh', padding:'2rem', maxWidth:'calc(100vw - 220px)' }}>
        <div className="fade-in" key={tab}>
          {tab === 'team'    && <TeamPortal />}
          {tab === 'manager' && <ManagerPortal />}
        </div>
      </main>
    </div>
  )
}
