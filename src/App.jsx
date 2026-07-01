import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TeamPortal from './components/TeamPortal.jsx'
import MemberDashboard from './components/MemberDashboard.jsx'
import ManagerPortal from './components/ManagerPortal.jsx'
import { MANAGER_PIN } from './config.js'

export default function App() {
  const [screen, setScreen] = useState('home') // home | member | manager
  const [activeMember, setActiveMember] = useState(null)
  const [managerUnlocked, setManagerUnlocked] = useState(false)
  const [managerPin, setManagerPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('team')

  const handleMemberSelect = (member) => {
    setActiveMember(member)
    setScreen('member')
  }

  const handleManagerAccess = () => {
    setSidebarTab('manager')
    setScreen('manager-lock')
  }

  const handlePinSubmit = () => {
    if (managerPin === MANAGER_PIN) {
      setManagerUnlocked(true)
      setScreen('manager')
      setPinError(false)
    } else {
      setPinError(true)
      setManagerPin('')
    }
  }

  const handleBack = () => {
    setScreen('home')
    setActiveMember(null)
    setSidebarTab('team')
  }

  const handleLock = () => {
    setManagerUnlocked(false)
    setManagerPin('')
    setScreen('home')
    setSidebarTab('team')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activeTab={sidebarTab}
        onTeam={() => { setScreen('home'); setSidebarTab('team') }}
        onManager={handleManagerAccess}
        managerUnlocked={managerUnlocked}
        activeMember={activeMember}
        onLock={handleLock}
      />
      <main className="main-content">
        {screen === 'home' && (
          <TeamPortal onSelectMember={handleMemberSelect} />
        )}
        {screen === 'member' && activeMember && (
          <MemberDashboard member={activeMember} onBack={handleBack} />
        )}
        {screen === 'manager-lock' && (
          <ManagerLock
            pin={managerPin}
            setPin={setManagerPin}
            onSubmit={handlePinSubmit}
            error={pinError}
            onBack={handleBack}
          />
        )}
        {screen === 'manager' && managerUnlocked && (
          <ManagerPortal onLock={handleLock} />
        )}
      </main>
    </div>
  )
}

function ManagerLock({ pin, setPin, onSubmit, error, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: 360, textAlign: 'center', padding: 40, border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 40px rgba(99,102,241,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Manager Access</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 28 }}>Guri · Gurjinder · SMM lead only</p>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="Enter PIN"
            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 18 }}
            autoFocus
          />
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>
            Wrong PIN. Try again.
          </p>
        )}

        <button className="btn btn-blue" onClick={onSubmit} style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          Unlock →
        </button>
        <button className="btn btn-ghost" onClick={onBack} style={{ width: '100%', justifyContent: 'center' }}>
          Back
        </button>
      </div>
    </div>
  )
}
