import React, { useEffect, useRef, useState } from 'react'

export default function JarvisIntro({ onEnterTeam, onEnterAdmin, onEnterClient }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    setTimeout(() => setReady(true), 800)
    const gi = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
    }, 4000)
    return () => clearInterval(gi)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2
      const cy = canvas.height / 2

      // Draw grid
      ctx.strokeStyle = 'rgba(99,102,241,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }

      // Radar rings
      const rings = [
        { r: 100, color: '99,102,241', speed: 0.008, dash: [8, 4] },
        { r: 180, color: '239,68,68', speed: -0.006, dash: [4, 8] },
        { r: 260, color: '99,102,241', speed: 0.005, dash: [12, 6] },
        { r: 340, color: '34,211,165', speed: -0.004, dash: [6, 12] },
        { r: 420, color: '139,92,246', speed: 0.003, dash: [16, 8] },
      ]

      rings.forEach((ring, i) => {
        const pulse = Math.sin(t * 1.5 + i * 1.2) * 0.25 + 0.75
        ctx.strokeStyle = `rgba(${ring.color},${0.15 * pulse})`
        ctx.lineWidth = 1
        ctx.setLineDash(ring.dash)
        ctx.lineDashOffset = -t * ring.speed * 200
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // Scanning sweep line
      const sweepAngle = (t * 0.6) % (Math.PI * 2)
      const sweepGrad = ctx.createConicalGradient
        ? ctx.createConicalGradient(cx, cy, sweepAngle)
        : null

      // Manual sweep with gradient arc
      const maxR = 420
      for (let a = 0; a > -Math.PI * 0.6; a -= 0.02) {
        const alpha = (Math.PI * 0.6 + a) / (Math.PI * 0.6)
        ctx.strokeStyle = `rgba(99,102,241,${alpha * 0.12})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, maxR, sweepAngle + a, sweepAngle + a + 0.02)
        ctx.lineTo(cx, cy)
        ctx.stroke()
      }
      // Bright sweep line
      ctx.strokeStyle = 'rgba(99,102,241,0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR)
      ctx.stroke()

      // Red sweep (secondary, opposite phase)
      const redSweep = (t * 0.4 + Math.PI) % (Math.PI * 2)
      ctx.strokeStyle = 'rgba(239,68,68,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(redSweep) * 180, cy + Math.sin(redSweep) * 180)
      ctx.stroke()

      // Center dot
      const centerPulse = Math.sin(t * 2) * 0.4 + 0.6
      ctx.fillStyle = `rgba(239,68,68,${centerPulse})`
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(239,68,68,${centerPulse * 0.5})`
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(cx, cy, 10 + Math.sin(t * 3) * 3, 0, Math.PI * 2)
      ctx.stroke()

      // Blip dots on rings
      rings.forEach((ring, i) => {
        const blipAngle = sweepAngle - 0.3 - i * 0.15
        if (blipAngle > sweepAngle - Math.PI * 0.5) {
          const fade = 1 - Math.abs(blipAngle - sweepAngle + 0.3) / (Math.PI * 0.5)
          const bx = cx + Math.cos(blipAngle) * ring.r
          const by = cy + Math.sin(blipAngle) * ring.r
          ctx.fillStyle = `rgba(34,211,165,${fade * 0.8})`
          ctx.beginPath()
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Cross-hair lines through center
      ctx.strokeStyle = 'rgba(99,102,241,0.08)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke()
      ctx.setLineDash([])

      t += 0.016
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  const btnStyle = (color) => ({
    padding: '14px 32px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: `1px solid ${color}55`,
    background: `${color}15`,
    color: color,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
    fontFamily: 'Space Grotesk, sans-serif',
    minWidth: 160,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020208', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Corner decorations */}
      {[['0,0','right,bottom'],['0,auto','right,top'],['auto,0','left,bottom'],['auto,auto','left,top']].map(([tb, lr], i) => (
        <div key={i} style={{
          position: 'absolute',
          top: i < 2 ? 20 : 'auto', bottom: i >= 2 ? 20 : 'auto',
          left: i % 2 === 1 ? 20 : 'auto', right: i % 2 === 0 ? 20 : 'auto',
          width: 40, height: 40,
          borderTop: i >= 2 ? 'none' : '2px solid rgba(99,102,241,0.4)',
          borderBottom: i < 2 ? 'none' : '2px solid rgba(99,102,241,0.4)',
          borderLeft: i % 2 === 0 ? 'none' : '2px solid rgba(99,102,241,0.4)',
          borderRight: i % 2 === 1 ? 'none' : '2px solid rgba(99,102,241,0.4)',
          zIndex: 2,
        }} />
      ))}

      {/* Live indicator */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a5', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, color: 'rgba(34,211,165,0.8)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Space Grotesk' }}>System Online</span>
      </div>

      {/* Stats top right */}
      <div style={{ position: 'absolute', top: 20, right: 60, zIndex: 2, textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.6)', letterSpacing: '0.15em', fontFamily: 'Space Grotesk' }}>BRAMPTON · INDIA</div>
        <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.4)', marginTop: 2, fontFamily: 'Space Grotesk' }}>{new Date().toLocaleDateString('en-CA', { weekday:'short', month:'short', day:'numeric' })}</div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 700 }}>
        {/* Logo mark */}
        <div style={{ marginBottom: 24, opacity: ready ? 1 : 0, transition: 'opacity 0.8s' }}>
          <svg width="60" height="54" viewBox="0 0 220 195" fill="none" style={{ filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' }}>
            <path d="M110 8 L212 187 L8 187 Z" fill="none" stroke="#6366f1" strokeWidth="20" strokeLinejoin="round"/>
            <path d="M110 55 L175 175 L45 175 Z" fill="none" stroke="#6366f1" strokeWidth="14" strokeLinejoin="round"/>
            <path d="M110 110 L148 178 L72 178 Z" fill="#ef4444"/>
          </svg>
        </div>

        {/* Headline */}
        <div style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease 0.3s',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'rgba(99,102,241,0.7)', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Space Grotesk' }}>
            Internal Command Center
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 58px)',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontFamily: 'Space Grotesk',
            filter: glitch ? 'hue-rotate(90deg) brightness(1.5)' : 'none',
            transition: 'filter 0.05s',
          }}>
            Welcome to ELEV<span style={{ color: '#ef4444' }}>8</span>
          </h1>
          <h2 style={{
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            fontWeight: 400,
            color: 'rgba(148,163,184,0.8)',
            margin: '8px 0 0',
            letterSpacing: '0.05em',
            fontFamily: 'Space Grotesk',
          }}>
            Operations
          </h2>
        </div>

        {/* Divider */}
        <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 1s ease 0.6s', margin: '32px auto', width: 120, height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

        {/* Buttons */}
        <div style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.8s ease 0.8s',
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <button
            style={btnStyle('#6366f1')}
            onClick={onEnterTeam}
            onMouseEnter={e => { e.target.style.background = 'rgba(99,102,241,0.25)'; e.target.style.boxShadow = '0 0 30px rgba(99,102,241,0.3)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(99,102,241,0.15)'; e.target.style.boxShadow = 'none' }}
          >
            ◈ Team Portal
          </button>
          <button
            style={btnStyle('#f59e0b')}
            onClick={onEnterAdmin}
            onMouseEnter={e => { e.target.style.background = 'rgba(245,158,11,0.25)'; e.target.style.boxShadow = '0 0 30px rgba(245,158,11,0.3)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(245,158,11,0.15)'; e.target.style.boxShadow = 'none' }}
          >
            ⬡ Admin Portal
          </button>
          <button
            style={btnStyle('#8b5cf6')}
            onClick={onEnterClient}
            onMouseEnter={e => { e.target.style.background = 'rgba(139,92,246,0.25)'; e.target.style.boxShadow = '0 0 30px rgba(139,92,246,0.3)' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(139,92,246,0.15)'; e.target.style.boxShadow = 'none' }}
          >
            🔒 Client Hub
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'rgba(99,102,241,0.35)', letterSpacing: '0.2em', fontFamily: 'Space Grotesk' }}>
          ELEV<span style={{ color: '#ef4444' }}>8</span> MEDIA · OPS V5 · SECURE
        </div>
      </div>
    </div>
  )
}
