import React, { useState, useEffect } from 'react'
import JarvisIntro from './components/JarvisIntro.jsx'
import Sidebar from './components/Sidebar.jsx'
import TeamPortal from './components/TeamPortal.jsx'
import MemberDashboard from './components/MemberDashboard.jsx'
import ManagerPortal from './components/ManagerPortal.jsx'
import ClientHub from './components/ClientHub.jsx'
import { supabase } from './supabase.js'
import { MANAGER_PIN } from './config.js'

const CLIENT_PASSWORD = '50K'

export default function App() {
  const [screen, setScreen] = useState('intro')
  const [activeMember, setActiveMember] = useState(null)
  const [managerUnlocked, setManagerUnlocked] = useState(false)
  const [clientUnlocked, setClientUnlocked] = useState(false)
  const [lockScreen, setLockScreen] = useState(null) // 'manager' | 'member' | 'client'
  const [lockTarget, setLockTarget] = useState(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [memberPins, setMemberPins] = useState({})

  useEffect(() => {
    // Load member PINs from Supabase
    const loadPins = async () => {
      try {
        const { data } = await supabase.from('member_pins').select('*')
        if (data) {
          const map = {}
          data.forEach(r => { map[r.member_name] = r.pin })
          setMemberPins(map)
        }
      } catch(e) { console.warn('PIN load failed, using defaults') }
    }
    loadPins()
  }, [])

  const handleMemberSelect = (member) => {
    setLockTarget(member)
    setLockScreen('member')
    setPin('')
    setPinError(false)
  }

  const handlePinSubmit = async () => {
    if (lockScreen === 'member') {
      const expectedPin = memberPins[lockTarget.name] || defaultPin(lockTarget.name)
      if (pin === expectedPin) {
        setActiveMember(lockTarget)
        setScreen('member')
        setLockScreen(null)
        setPinError(false)
      } else {
        setPinError(true)
        setPin('')
      }
    } else if (lockScreen === 'manager') {
      if (pin === MANAGER_PIN) {
        setManagerUnlocked(true)
        setScreen('manager')
        setLockScreen(null)
        setPinError(false)
      } else {
        setPinError(true)
        setPin('')
      }
    } else if (lockScreen === 'client') {
      if (pin === CLIENT_PASSWORD) {
        setClientUnlocked(true)
        setScreen('client')
        setLockScreen(null)
        setPinError(false)
      } else {
        setPinError(true)
        setPin('')
      }
    }
  }

  const handleBack = () => {
    setScreen('team')
    setActiveMember(null)
  }

  const handleLock = () => {
    setManagerUnlocked(false)
    setScreen('team')
  }

  const goToIntro = () => {
    setScreen('intro')
    setActiveMember(null)
  }

  // Lock screens
  if (lockScreen) {
    const titles = {
      member: { title: lockTarget?.name, subtitle: 'Enter your PIN to continue', color: '#6366f1' },
      manager: { title: 'Admin Portal', subtitle: 'Guri · Gurjinder · SMM lead only', color: '#f59e0b' },
      client: { title: 'Client Hub', subtitle: 'Restricted access', color: '#8b5cf6' },
    }
    const info = titles[lockScreen]
    return (
      <div style={{ position:'fixed', inset:0, background:'#0a0a14', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
        <div style={{ width:360, background:'#11151f', borderRadius:16, padding:40, textAlign:'center', border:`1px solid ${info.color}44`, boxShadow:`0 0 60px ${info.color}15` }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔐</div>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:6, color:'#fff', fontFamily:'Space Grotesk' }}>{info.title}</h2>
          <p style={{ color:'#94a3b8', fontSize:13, marginBottom:28, fontFamily:'Space Grotesk' }}>{info.subtitle}</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handlePinSubmit()}
            placeholder={lockScreen==='client' ? 'Enter password' : 'Enter PIN'}
            style={{ textAlign:'center', letterSpacing:'0.3em', fontSize:18, marginBottom:12, background:'rgba(255,255,255,0.05)', border:`1px solid ${info.color}44`, borderRadius:10, color:'#fff', padding:'12px 16px', width:'100%', fontFamily:'Space Grotesk', outline:'none' }}
            autoFocus
          />
          {pinError && <p style={{ color:'#f87171', fontSize:13, marginBottom:12 }}>Incorrect. Try again.</p>}
          <button onClick={handlePinSubmit} style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:14, fontWeight:700, background:`linear-gradient(135deg, ${info.color}, ${info.color}bb)`, color: lockScreen==='manager'?'#000':'#fff', border:'none', cursor:'pointer', marginBottom:10, fontFamily:'Space Grotesk', boxShadow:`0 0 20px ${info.color}44` }}>
            Unlock →
          </button>
          <button onClick={() => { setLockScreen(null); setPin(''); setPinError(false); setScreen(screen==='intro'?'intro':'team') }} style={{ width:'100%', padding:'10px', borderRadius:10, fontSize:13, background:'transparent', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontFamily:'Space Grotesk' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Intro screen — full page, no sidebar
  if (screen === 'intro') {
    return (
      <JarvisIntro
        onEnterTeam={() => setScreen('team')}
        onEnterAdmin={() => { setLockScreen('manager'); setPin(''); setPinError(false) }}
        onEnterClient={() => setScreen('client')}
      />
    )
  }

  // Client Hub — full page with back
  if (screen === 'client' && clientUnlocked) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:28 }}>
          <ClientHub onBack={() => setScreen('intro')} />
        </div>
      </div>
    )
  }

  // Team / Manager screens — with sidebar
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar
        activeTab={screen==='manager'?'manager':'team'}
        onTeam={() => { setScreen('team'); setActiveMember(null) }}
        onManager={() => { if (managerUnlocked) { setScreen('manager') } else { setLockScreen('manager'); setPin(''); setPinError(false) } }}
        onHome={goToIntro}
        managerUnlocked={managerUnlocked}
        activeMember={activeMember}
        onLock={handleLock}
      />
      <main className="main-content">
        {screen==='team' && <TeamPortal onSelectMember={handleMemberSelect} />}
        {screen==='member' && activeMember && <MemberDashboard member={activeMember} onBack={handleBack} />}
        {screen==='manager' && managerUnlocked && <ManagerPortal onLock={handleLock} />}
      </main>
    </div>
  )
}

// Default PINs if not loaded from DB yet
function defaultPin(name) {
  const defaults = { 'Abhijot':'1001', 'Narsi':'1002', 'Param':'1003', 'Vansh':'1004', 'Narpat':'1005', 'Vansh Verma':'1006' }
  return defaults[name] || '0000'
}
