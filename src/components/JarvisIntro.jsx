import React, { useEffect, useRef, useState } from 'react'

export default function JarvisIntro({ onEnterTeam, onEnterAdmin, onEnterClient }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const tRef = useRef(0)
  const [booted, setBooted] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [scanLine, setScanLine] = useState(0)
  const [glitch, setGlitch] = useState(false)
  const [bootText, setBootText] = useState('')

  // Boot sequence
  useEffect(() => {
    const lines = [
      'INITIALIZING ELEV8 OPS SYSTEM...',
      'CONNECTING TO DATABASE... OK',
      'LOADING TEAM PROFILES... OK',
      'SECURING CLIENT DATA... OK',
      'SYSTEM READY.',
    ]
    let i = 0
    const type = () => {
      if (i < lines.length) {
        setBootText(lines.slice(0, i + 1).join('\n'))
        i++
        setTimeout(type, i === lines.length ? 400 : 300)
      } else {
        setTimeout(() => {
          setBooted(true)
          setTimeout(() => setShowButtons(true), 600)
        }, 200)
      }
    }
    setTimeout(type, 200)

    // Glitch effect
    const gi = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 80)
    }, 5000)

    // Scan line
    let sl = 0
    const sli = setInterval(() => {
      sl = (sl + 1) % 100
      setScanLine(sl)
    }, 20)

    return () => { clearInterval(gi); clearInterval(sli) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particles
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.7 ? '#ef4444' : '#6366f1',
    }))

    // Data nodes
    const nodes = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2
      const r = 280 + Math.random() * 60
      return {
        baseAngle: angle,
        r,
        label: ['TEAM', 'ADMIN', 'CLIENT', 'DATA', 'CRM', 'SYNC', 'SECURE', 'LIVE'][i],
        pulse: Math.random() * Math.PI * 2,
      }
    })

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const t = tRef.current

      ctx.clearRect(0, 0, W, H)

      // Background gradient radial
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7)
      bg.addColorStop(0, 'rgba(10,5,30,1)')
      bg.addColorStop(0.5, 'rgba(5,5,20,1)')
      bg.addColorStop(1, 'rgba(0,0,10,1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Grid perspective lines
      ctx.strokeStyle = 'rgba(99,102,241,0.04)'
      ctx.lineWidth = 1
      const gridSpacing = 60
      for (let x = cx % gridSpacing; x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = cy % gridSpacing; y < H; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Outer decorative rings
      const rings = [
        { r: 380, color: '99,102,241', width: 1, alpha: 0.08, dash: [] },
        { r: 320, color: '239,68,68', width: 1, alpha: 0.12, dash: [2, 6] },
        { r: 260, color: '99,102,241', width: 1.5, alpha: 0.15, dash: [] },
        { r: 200, color: '34,211,165', width: 1, alpha: 0.1, dash: [4, 8] },
        { r: 140, color: '239,68,68', width: 2, alpha: 0.2, dash: [] },
        { r: 80, color: '99,102,241', width: 1.5, alpha: 0.25, dash: [3, 5] },
        { r: 40, color: '239,68,68', width: 2, alpha: 0.35, dash: [] },
      ]

      rings.forEach((ring, i) => {
        const pulse = Math.sin(t * 1.2 + i * 0.8) * 0.3 + 0.7
        ctx.strokeStyle = `rgba(${ring.color},${ring.alpha * pulse})`
        ctx.lineWidth = ring.width
        ctx.setLineDash(ring.dash)
        ctx.lineDashOffset = -t * 30 * (i % 2 === 0 ? 1 : -1)
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // Main radar sweep — blue
      const sweep1 = (t * 0.7) % (Math.PI * 2)
      for (let a = 0; a > -Math.PI * 0.7; a -= 0.015) {
        const fade = (Math.PI * 0.7 + a) / (Math.PI * 0.7)
        ctx.fillStyle = `rgba(99,102,241,${fade * fade * 0.06})`
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, 380, sweep1 + a, sweep1 + a + 0.015)
        ctx.closePath()
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(99,102,241,0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep1) * 380, cy + Math.sin(sweep1) * 380)
      ctx.stroke()

      // Secondary sweep — red, different speed
      const sweep2 = -(t * 0.45 + Math.PI * 0.3) % (Math.PI * 2)
      for (let a = 0; a > -Math.PI * 0.5; a -= 0.02) {
        const fade = (Math.PI * 0.5 + a) / (Math.PI * 0.5)
        ctx.fillStyle = `rgba(239,68,68,${fade * fade * 0.04})`
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, 200, sweep2 + a, sweep2 + a + 0.02)
        ctx.closePath()
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(239,68,68,0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep2) * 200, cy + Math.sin(sweep2) * 200)
      ctx.stroke()

      // Tertiary sweep — teal
      const sweep3 = (t * 0.3 + Math.PI) % (Math.PI * 2)
      ctx.strokeStyle = 'rgba(34,211,165,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep3) * 320, cy + Math.sin(sweep3) * 320)
      ctx.stroke()

      // Blip dots — appear when sweep hits
      rings.forEach((ring, ri) => {
        if (ring.r > 380) return
        const blipAngle = sweep1 - 0.15
        const bx = cx + Math.cos(blipAngle) * ring.r
        const by = cy + Math.sin(blipAngle) * ring.r
        const fade = Math.max(0, Math.sin(t * 2 + ri) * 0.5 + 0.5)
        ctx.fillStyle = `rgba(34,211,165,${fade * 0.9})`
        ctx.shadowColor = '#22d3a5'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(bx, by, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Data nodes around outer ring
      nodes.forEach((node, i) => {
        const angle = node.baseAngle + t * 0.05 * (i % 2 === 0 ? 1 : -1)
        const pulse = Math.sin(t * 2 + node.pulse) * 0.15 + 1
        const nx = cx + Math.cos(angle) * node.r * pulse
        const ny = cy + Math.sin(angle) * node.r * pulse

        // Line to center
        ctx.strokeStyle = `rgba(99,102,241,0.12)`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke()
        ctx.setLineDash([])

        // Node dot
        const isNear = Math.abs((sweep1 - angle + Math.PI * 4) % (Math.PI * 2) - Math.PI * 2) < 0.4
        ctx.fillStyle = isNear ? 'rgba(34,211,165,0.9)' : 'rgba(99,102,241,0.6)'
        ctx.shadowColor = isNear ? '#22d3a5' : '#6366f1'
        ctx.shadowBlur = isNear ? 12 : 4
        ctx.beginPath()
        ctx.arc(nx, ny, isNear ? 5 : 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Node label
        if (isNear) {
          ctx.fillStyle = 'rgba(34,211,165,0.9)'
          ctx.font = '9px Space Grotesk, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(node.label, nx, ny - 10)
        }
      })

      // Cross-hair lines
      ctx.strokeStyle = 'rgba(99,102,241,0.06)'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 16])
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
      ctx.setLineDash([])

      // Diagonal cross-hairs
      ctx.strokeStyle = 'rgba(239,68,68,0.04)'
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(0, H); ctx.stroke()

      // Center core
      const coreGlow = Math.sin(t * 3) * 0.3 + 0.7
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20)
      coreGrad.addColorStop(0, `rgba(239,68,68,${coreGlow})`)
      coreGrad.addColorStop(0.4, `rgba(239,68,68,${coreGlow * 0.4})`)
      coreGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = coreGrad
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill()

      // Core ring
      ctx.strokeStyle = `rgba(239,68,68,${coreGlow * 0.8})`
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = `rgba(239,68,68,${coreGlow})`
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()

      // Outer glow rings (pulsing)
      ;[30, 50, 70].forEach((r, i) => {
        const p = Math.sin(t * 2 - i * 0.8) * 0.3 + 0.1
        ctx.strokeStyle = `rgba(239,68,68,${p * 0.3})`
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      })

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.fillStyle = p.color === '#ef4444'
          ? `rgba(239,68,68,${p.alpha * 0.6})`
          : `rgba(99,102,241,${p.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Scan line effect
      const slY = (scanLine / 100) * H
      const slGrad = ctx.createLinearGradient(0, slY - 40, 0, slY + 40)
      slGrad.addColorStop(0, 'transparent')
      slGrad.addColorStop(0.5, 'rgba(99,102,241,0.04)')
      slGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = slGrad
      ctx.fillRect(0, slY - 40, W, 80)

      // Hex grid corner decorations
      ;[[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]].forEach(([x, y], i) => {
        const size = 30
        const xSign = i % 2 === 0 ? 1 : -1
        const ySign = i < 2 ? 1 : -1
        ctx.strokeStyle = 'rgba(99,102,241,0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x, y + ySign * size)
        ctx.lineTo(x, y)
        ctx.lineTo(x + xSign * size, y)
        ctx.stroke()
        // Inner corner dot
        ctx.fillStyle = 'rgba(239,68,68,0.6)'
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill()
      })

      // HUD data readouts top-left
      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(99,102,241,0.5)'
      ctx.textAlign = 'left'
      const hud = [
        `SCAN: ${((sweep1 / (Math.PI * 2)) * 360).toFixed(1)}°`,
        `NODES: ${nodes.length} ACTIVE`,
        `SIG: ${(Math.sin(t) * 30 + 70).toFixed(0)}%`,
        `LAT: 43.7315° N`,
      ]
      hud.forEach((line, i) => ctx.fillText(line, 60, 60 + i * 16))

      // HUD data readouts top-right
      ctx.textAlign = 'right'
      ctx.fillStyle = 'rgba(239,68,68,0.5)'
      const hud2 = [
        `FREQ: ${(144 + Math.sin(t * 0.7) * 5).toFixed(2)} MHz`,
        `PWR: 100%`,
        `ENC: AES-256`,
        `VER: V5.0`,
      ]
      hud2.forEach((line, i) => ctx.fillText(line, W - 60, 60 + i * 16))

      tRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const btnBase = {
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '14px 28px',
    borderRadius: 4,
    transition: 'all 0.15s',
    minWidth: 160,
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000008', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Boot text - pre-boot */}
      {!booted && (
        <div style={{
          position: 'relative', zIndex: 10, fontFamily: 'monospace', fontSize: 12,
          color: 'rgba(99,102,241,0.8)', letterSpacing: '0.05em', textAlign: 'center',
          background: 'rgba(0,0,0,0.6)', padding: '20px 32px', borderRadius: 4,
          border: '1px solid rgba(99,102,241,0.2)', whiteSpace: 'pre-line',
          minWidth: 320,
        }}>
          {bootText}<span style={{ animation: 'pulse 0.8s infinite', opacity: bootText ? 1 : 0 }}>_</span>
        </div>
      )}

      {/* Main UI - after boot */}
      {booted && (
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          opacity: booted ? 1 : 0, transition: 'opacity 0.8s',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 20 }}>
            <svg width="52" height="46" viewBox="0 0 220 195" fill="none"
              style={{ filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.8)) drop-shadow(0 0 48px rgba(239,68,68,0.4))' }}>
              <path d="M110 8 L212 187 L8 187 Z" fill="none" stroke="#6366f1" strokeWidth="20" strokeLinejoin="round"/>
              <path d="M110 55 L175 175 L45 175 Z" fill="none" stroke="#6366f1" strokeWidth="14" strokeLinejoin="round"/>
              <path d="M110 110 L148 178 L72 178 Z" fill="#ef4444"/>
            </svg>
          </div>

          {/* Title */}
          <div style={{ fontSize: 11, letterSpacing: '0.5em', color: 'rgba(99,102,241,0.7)', fontFamily: 'monospace', marginBottom: 12 }}>
            ◈ INTERNAL COMMAND CENTER ◈
          </div>
          <h1 style={{
            fontSize: 'clamp(36px,5.5vw,64px)', fontWeight: 700,
            color: '#fff', margin: 0, lineHeight: 1,
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.02em',
            textShadow: glitch
              ? '2px 0 #ef4444, -2px 0 #6366f1'
              : '0 0 40px rgba(99,102,241,0.4)',
            transition: 'text-shadow 0.05s',
          }}>
            WELC<span style={{ color: '#fff' }}>OME TO</span> ELEV<span style={{ color: '#ef4444', textShadow: '0 0 30px rgba(239,68,68,0.8)' }}>8</span>
          </h1>
          <div style={{
            fontSize: 'clamp(14px,2vw,20px)', color: 'rgba(148,163,184,0.7)',
            fontFamily: 'Space Grotesk', letterSpacing: '0.25em',
            textTransform: 'uppercase', marginTop: 8,
          }}>
            Operations
          </div>

          {/* Status line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 16, marginBottom: 32 }}>
            {[['TEAM', '6 ONLINE'], ['SYSTEM', 'SECURE'], ['STATUS', 'READY']].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'rgba(99,102,241,0.5)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{k}</div>
                <div style={{ fontSize: 11, color: '#22d3a5', letterSpacing: '0.1em', fontFamily: 'monospace', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
            opacity: showButtons ? 1 : 0, transform: showButtons ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.5s ease',
          }}>
            {[
              { label: '◈ Team Portal', color: '#6366f1', glow: 'rgba(99,102,241,0.5)', onClick: onEnterTeam },
              { label: '⬡ Admin Portal', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', onClick: onEnterAdmin },
              { label: '🔒 Client Hub', color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', onClick: onEnterClient },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                style={{
                  ...btnBase,
                  background: `rgba(${btn.color === '#6366f1' ? '99,102,241' : btn.color === '#f59e0b' ? '245,158,11' : '139,92,246'},0.1)`,
                  border: `1px solid ${btn.color}66`,
                  color: btn.color,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `rgba(${btn.color === '#6366f1' ? '99,102,241' : btn.color === '#f59e0b' ? '245,158,11' : '139,92,246'},0.25)`
                  e.currentTarget.style.boxShadow = `0 0 30px ${btn.glow}, inset 0 0 30px ${btn.glow.replace('0.5', '0.1')}`
                  e.currentTarget.style.borderColor = btn.color
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `rgba(${btn.color === '#6366f1' ? '99,102,241' : btn.color === '#f59e0b' ? '245,158,11' : '139,92,246'},0.1)`
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = `${btn.color}66`
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: 'rgba(99,102,241,0.3)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>
          ELEV<span style={{ color: '#ef4444' }}>8</span> MEDIA
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(99,102,241,0.2)' }} />
        <div style={{ fontSize: 9, color: 'rgba(99,102,241,0.3)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>
          OPS V5
        </div>
        <div style={{ width: 1, height: 12, background: 'rgba(99,102,241,0.2)' }} />
        <div style={{ fontSize: 9, color: 'rgba(239,68,68,0.4)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>
          BRAMPTON · INDIA
        </div>
      </div>
    </div>
  )
}
