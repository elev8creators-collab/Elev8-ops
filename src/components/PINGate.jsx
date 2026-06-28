import { useState } from 'react'
import { C, Btn } from './ui.jsx'

export default function PINGate({ memberName, initials, onSuccess, onBack }) {
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function verify(p) {
    setLoading(true); setError('')
    const { verifyPin } = await import('../lib/supabase.js')
    const member = await verifyPin(memberName, p)
    setLoading(false)
    if (member) onSuccess(member)
    else { setError('Wrong PIN — try again.'); setPin('') }
  }

  function press(d) {
    if (pin.length >= 4) return
    const next = pin + d; setPin(next)
    if (next.length === 4) verify(next)
  }
  function del() { setPin(p => p.slice(0,-1)); setError('') }

  const pad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh' }}>
      <div style={{ width:300, textAlign:'center' }} className="fade-in">

        {/* Avatar */}
        <div style={{
          width:72, height:72, borderRadius:'50%', margin:'0 auto 1rem',
          background: C.redDim, border:`2px solid ${C.redBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, fontWeight:800, color:C.red,
        }}>{initials}</div>

        <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>{memberName}</div>
        <div style={{ fontSize:13, color:C.text3, marginBottom:'2rem' }}>Enter your 4-digit PIN</div>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:'1.5rem' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:14, height:14, borderRadius:'50%',
              background: i < pin.length ? C.red : C.surface3,
              border:`2px solid ${i < pin.length ? C.red : C.border2}`,
              transition:'all .15s',
              boxShadow: i < pin.length ? `0 0 8px ${C.redGlow}` : 'none',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ fontSize:12, color:C.danger, marginBottom:'1rem',
            padding:'8px 14px', background:'#FEE2E2', borderRadius:8,
            border:'1px solid rgba(217,48,37,0.2)' }}>
            {error}
          </div>
        )}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.25rem' }}>
          {pad.map((d,i) => (
            <button key={i}
              onClick={() => d==='⌫' ? del() : d ? press(d) : null}
              disabled={!d || loading}
              style={{
                height:54, fontSize:d==='⌫'?18:22, fontWeight:d==='⌫'?400:600,
                borderRadius:10,
                border:`1px solid ${C.border2}`,
                background: d ? C.bg : 'none',
                color: d==='⌫' ? C.text3 : C.text,
                cursor: d ? 'pointer' : 'default',
                fontFamily:'inherit', opacity:!d?0:1,
                boxShadow: d ? C.shadowSm : 'none',
                transition:'background .1s, transform .1s',
              }}>
              {d}
            </button>
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
