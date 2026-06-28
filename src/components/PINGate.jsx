import { useState } from 'react'
import { T } from './ui.jsx'

export default function PINGate({ memberName, onSuccess, onBack }) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function verify(finalPin) {
    setLoading(true)
    setError('')
    const { verifyPin } = await import('../lib/supabase.js')
    const member = await verifyPin(memberName, finalPin)
    setLoading(false)
    if (member) { onSuccess(member) }
    else { setError('Wrong PIN. Try again.'); setPin('') }
  }

  function pressDigit(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) verify(next)
  }

  function del() { setPin(p => p.slice(0, -1)); setError('') }

  const dots = Array.from({ length: 4 }, (_, i) => (
    <div key={i} style={{
      width: 14, height: 14, borderRadius: '50%',
      background: i < pin.length ? T.red : 'rgba(255,255,255,.15)',
      transition: 'background .15s',
    }} />
  ))

  const pad = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{ maxWidth: 300, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{memberName}</div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: '1.5rem' }}>Enter your 4-digit PIN</div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: '1.5rem' }}>
        {dots}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: T.danger, marginBottom: '1rem',
          padding: '6px 12px', background: 'rgba(248,113,113,.08)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '1rem' }}>
        {pad.map((d, i) => (
          <button key={i} onClick={() => d === '⌫' ? del() : d ? pressDigit(d) : null}
            disabled={!d || loading}
            style={{
              height: 56, fontSize: d === '⌫' ? 20 : 22, fontWeight: 600,
              borderRadius: 12, border: `1px solid rgba(255,255,255,.08)`,
              background: d ? '#18181F' : 'none',
              color: d === '⌫' ? T.muted : T.text,
              cursor: d ? 'pointer' : 'default',
              fontFamily: 'inherit',
              opacity: !d ? 0 : 1,
            }}>
            {d}
          </button>
        ))}
      </div>

      <button onClick={onBack} style={{
        fontSize: 12, color: T.muted, background: 'none', border: 'none',
        cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit',
      }}>
        ← Back
      </button>
    </div>
  )
}
