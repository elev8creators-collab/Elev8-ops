import { useState } from 'react'
import { C, Btn } from './ui.jsx'

export default function PINGate({ memberName, initials, onSuccess, onBack }) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function verify(finalPin) {
    setLoading(true); setError('')
    const { verifyPin } = await import('../lib/supabase.js')
    const member = await verifyPin(memberName, finalPin)
    setLoading(false)
    if (member) onSuccess(member)
    else { setError('Incorrect PIN. Try again.'); setPin('') }
  }

  function pressDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d; setPin(next)
    if (next.length === 4) verify(next)
  }

  function del() { setPin(p => p.slice(0,-1)); setError('') }

  const pad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ width:280, textAlign:'center' }} className="fade-in">
        {/* Avatar */}
        <div style={{
          width:64, height:64, borderRadius:'50%', margin:'0 auto 1rem',
          background:`linear-gradient(135deg, ${C.redDim}, rgba(191,90,242,0.1))`,
          border:`1.5px solid ${C.redBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20, fontWeight:800, color:C.red,
        }}>{initials || memberName?.slice(0,2).toUpperCase()}</div>

        <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:4 }}>{memberName}</div>
        <div style={{ fontSize:13, color:C.text3, marginBottom:'1.5rem' }}>Enter your PIN to continue</div>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:'1.5rem' }}>
          {Array.from({length:4}, (_,i) => (
            <div key={i} style={{
              width:12, height:12, borderRadius:'50%',
              background: i < pin.length ? C.red : C.surface3,
              border: `1.5px solid ${i < pin.length ? C.red : C.border2}`,
              transition:'all .15s',
              boxShadow: i < pin.length ? `0 0 8px ${C.redGlow}` : 'none',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ fontSize:12, color:C.danger, marginBottom:'1rem',
            padding:'6px 12px', background:'rgba(255,69,58,.08)',
            borderRadius:8, border:'1px solid rgba(255,69,58,.2)' }}>
            {error}
          </div>
        )}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1rem' }}>
          {pad.map((d,i) => (
            <button key={i} onClick={() => d==='⌫' ? del() : d ? pressDigit(d) : null}
              disabled={!d || loading} style={{
                height:52, fontSize:d==='⌫'?18:20, fontWeight:d==='⌫'?400:600,
                borderRadius:10, border:`1px solid ${C.border2}`,
                background: d ? C.surface2 : 'none',
                color: d==='⌫' ? C.text3 : C.text,
                cursor: d ? 'pointer' : 'default',
                fontFamily:'inherit', opacity:!d?0:1,
                transition:'background .1s',
              }}>{d}</button>
          ))}
        </div>

        <button onClick={onBack} style={{
          fontSize:12, color:C.text3, background:'none', border:'none',
          cursor:'pointer', fontFamily:'inherit',
        }}>← Switch account</button>
      </div>
    </div>
  )
}
