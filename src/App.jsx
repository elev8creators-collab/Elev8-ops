import { useState } from 'react'
import { C } from './components/ui.jsx'
import TeamPortal    from './components/TeamPortal.jsx'
import ManagerPortal from './components/ManagerPortal.jsx'

const NAV = [
  { id:'team',    label:'Team Portal', icon:'👥' },
  { id:'manager', label:'Manager',     icon:'🔒' },
]

export default function App() {
  const [tab, setTab] = useState('team')

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width:220, flexShrink:0,
        background:C.bg,
        borderRight:`1px solid ${C.border}`,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, bottom:0, zIndex:50,
        boxShadow:'1px 0 0 rgba(0,0,0,0.04)',
      }}>

        {/* Logo — clicking goes home (resets to team portal name picker) */}
        <button
          onClick={() => { setTab('team') }}
          style={{
            padding:'1.25rem 1.25rem 1rem',
            borderBottom:`1px solid ${C.border}`,
            background:'none', border:'none', cursor:'pointer',
            textAlign:'left', width:'100%',
            display:'flex', flexDirection:'column', gap:2,
            transition:'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background=C.surface}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:28, height:28, borderRadius:7,
              background:C.red, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:900, color:'#fff',
            }}>E</div>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:'.06em', color:C.text }}>
              ELEV<span style={{ color:C.red }}>8</span> MEDIA
            </div>
          </div>
          <div style={{ fontSize:10, color:C.text3, letterSpacing:'.08em', textTransform:'uppercase', paddingLeft:36 }}>
            Operations ↖ home
          </div>
        </button>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'0.75rem 0.625rem', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(n => {
            const active = tab === n.id
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:8, border:'none',
                background: active ? C.redDim : 'none',
                color: active ? C.red : C.text2,
                fontWeight: active ? 700 : 500,
                fontSize:13, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%',
                borderLeft: `2px solid ${active ? C.red : 'transparent'}`,
                transition:'all .12s',
              }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>
                {n.label}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding:'0.75rem 1rem', borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color:C.text3, letterSpacing:'.05em', textTransform:'uppercase' }}>
            Elev8 Ops · V3
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft:220, flex:1, minHeight:'100vh', padding:'2rem 2.5rem', background:C.surface }}>
        <div className="fade-in" key={tab}>
          {tab === 'team'    && <TeamPortal    />}
          {tab === 'manager' && <ManagerPortal />}
        </div>
      </main>
    </div>
  )
}
