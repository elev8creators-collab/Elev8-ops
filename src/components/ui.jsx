const T = {
  red: '#E24B4A', redDim: 'rgba(226,75,74,0.12)',
  text: '#EEEEF8', muted: '#6868A0',
  card: '#111118', card2: '#18181F',
  border: 'rgba(255,255,255,0.06)',
  success: '#4ADE80', warning: '#FBBF24', danger: '#F87171',
}

export { T }

export function Card({ children, style = {}, accent = false }) {
  return (
    <div style={{
      background: T.card, borderRadius: 12,
      border: `1px solid ${accent ? 'rgba(226,75,74,0.4)' : T.border}`,
      padding: '1rem 1.125rem', ...style,
    }}>{children}</div>
  )
}

export function Badge({ children, color = 'muted' }) {
  const map = {
    green:  { bg: 'rgba(74,222,128,.15)',  fg: '#4ADE80' },
    amber:  { bg: 'rgba(251,191,36,.15)',  fg: '#FBBF24' },
    red:    { bg: 'rgba(248,113,113,.15)', fg: '#F87171' },
    crimson:{ bg: 'rgba(226,75,74,.15)',   fg: '#E24B4A' },
    muted:  { bg: 'rgba(255,255,255,.06)', fg: '#6868A0' },
  }
  const s = map[color] || map.muted
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function Btn({ children, onClick, disabled, variant = 'primary', style = {} }) {
  const styles = {
    primary: { background: T.red, color: '#fff', border: 'none' },
    ghost:   { background: 'none', color: T.muted, border: `1px solid ${T.border}` },
    danger:  { background: 'none', color: T.danger, border: '1px solid rgba(248,113,113,.3)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      fontSize: 13, fontWeight: 700, padding: '9px 18px',
      borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, fontFamily: 'inherit',
      transition: 'opacity .15s', ...style,
    }}>{children}</button>
  )
}

export function Input({ placeholder, value, onChange, type = 'text', style = {} }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        fontSize: 13, padding: '9px 11px', borderRadius: 8,
        border: `1px solid ${T.border}`, background: T.card2,
        color: T.text, outline: 'none', width: '100%', ...style,
      }}
    />
  )
}

export function Select({ value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={onChange} style={{
      fontSize: 13, padding: '9px 11px', borderRadius: 8,
      border: `1px solid ${T.border}`, background: T.card2,
      color: T.text, outline: 'none', width: '100%', ...style,
    }}>{children}</select>
  )
}

export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const col = color || (value >= max ? T.success : T.red)
  return (
    <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 4, height: 5 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: 4, transition: 'width .4s' }} />
    </div>
  )
}

export function BarChart({ dates, values, today }) {
  const max = Math.max(...values.filter(v => v !== null), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {dates.map((d, i) => {
        const val = values[i]
        const sub = val !== null && val !== undefined
        const pct = sub ? Math.max((val / max) * 100, 6) : 0
        const isT = d === today
        const col = !sub ? 'rgba(255,255,255,.05)' : val >= 2 ? T.success : val >= 1 ? T.warning : T.danger
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {sub && <span style={{ fontSize: 9, color: T.muted }}>{val}</span>}
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 56 }}>
              <div style={{ width: '100%', borderRadius: '3px 3px 0 0', height: sub ? `${pct}%` : '5%', background: col }} />
            </div>
            <span style={{ fontSize: 9, color: isT ? T.red : T.muted, fontWeight: isT ? 700 : 400 }}>
              {['M','T','W','T','F','S','S'][i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: '2px solid rgba(226,75,74,.2)',
      borderTop: `2px solid #E24B4A`,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
      display: 'inline-block',
    }} />
  )
}

// inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('e8-spin')) {
  const s = document.createElement('style')
  s.id = 'e8-spin'
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(s)
}
