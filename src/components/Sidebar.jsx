import React from 'react'

// Exact Elev8 logo — triangle with inner chevrons matching the actual mark
const Logo = () => (
  <svg width="36" height="32" viewBox="0 0 220 195" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer triangle */}
    <path d="M110 8 L212 187 L8 187 Z" fill="none" stroke="#6366f1" strokeWidth="20" strokeLinejoin="round"/>
    {/* Inner upper chevron */}
    <path d="M110 55 L175 175 L45 175 Z" fill="none" stroke="#6366f1" strokeWidth="14" strokeLinejoin="round"/>
    {/* Inner solid bottom triangle */}
    <path d="M110 110 L148 178 L72 178 Z" fill="#6366f1"/>
  </svg>
)

export default function Sidebar({ activeTab, onTeam, onManager, managerUnlocked, activeMember, onLock }) {
  const navItems = [
    { id:'team', icon:'◈', label:'Team Portal', onClick:onTeam },
    { id:'manager', icon:'⬡', label:'Manager', onClick:onManager, locked:!managerUnlocked },
  ]

  return (
    <aside className="sidebar">
      {/* Logo — hidden on mobile */}
      <div style={{ padding:'12px 20px 20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Logo />
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'0.05em' }}>
              ELEV<span style={{ color:'#6366f1' }}>8</span>
            </div>
            <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase' }}>
              Operations
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, paddingTop:12 }}>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab===item.id ? 'active' : ''}`}
            onClick={item.onClick}
          >
            <span style={{ fontSize:16 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.locked && <span style={{ marginLeft:'auto', fontSize:12 }}>🔒</span>}
            {item.id==='manager' && managerUnlocked && (
              <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#22d3a5', display:'inline-block' }} />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
        {activeMember ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="avatar" style={{ background:'rgba(99,102,241,0.2)', color:'#818cf8', width:28, height:28, fontSize:10 }}>
              {activeMember.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600 }}>{activeMember.name}</div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>{activeMember.role}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.1em' }}>ELEV8 OPS · V4</div>
        )}
        {managerUnlocked && (
          <button className="btn btn-ghost" onClick={onLock} style={{ width:'100%', justifyContent:'center', marginTop:10, fontSize:12, padding:'6px 12px' }}>
            🔒 Lock
          </button>
        )}
      </div>
    </aside>
  )
}
