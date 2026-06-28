import { useState } from 'react'
import TeamPortal   from './components/TeamPortal.jsx'
import ManagerPortal from './components/ManagerPortal.jsx'
import { T } from './components/ui.jsx'

export default function App() {
  const [tab, setTab] = useState('team')

  return (
    <div style={{ minHeight: '100vh', background: T.bg || '#09090F', color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Navbar ── */}
      <div style={{
        background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, background: '#E24B4A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-.5px',
          }}>8</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.2px' }}>
              ELEV<span style={{ color: '#E24B4A' }}>8</span> MEDIA
            </div>
            <div style={{ fontSize: 9, color: '#6868A0', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 1 }}>
              Operations
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['team', 'Team portal'], ['manager', '🔒 Manager']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none',
              background: tab === v ? 'rgba(226,75,74,.12)' : 'none',
              color: tab === v ? '#E24B4A' : '#6868A0',
              fontWeight: tab === v ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {tab === 'team'    && <TeamPortal />}
        {tab === 'manager' && <ManagerPortal />}
      </div>
    </div>
  )
}
