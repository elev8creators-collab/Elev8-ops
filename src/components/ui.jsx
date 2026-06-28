export const C = {
  bg:'#07070E', surface:'#0F0F1A', surface2:'#161623', surface3:'#1E1E2E',
  red:'#E5484D', redDim:'rgba(229,72,77,0.10)', redGlow:'rgba(229,72,77,0.20)',
  redBorder:'rgba(229,72,77,0.30)',
  text:'#F2F2F8', text2:'#A0A0C0', text3:'#60607A',
  border:'rgba(255,255,255,0.06)', border2:'rgba(255,255,255,0.10)',
  success:'#30D158', warning:'#FFD60A', danger:'#FF453A',
  blue:'#0A84FF', purple:'#BF5AF2',
}

export function Card({ children, style={}, glow=false, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.surface, border: `1px solid ${glow ? C.redBorder : C.border}`,
      borderRadius: 12, padding: '1rem 1.125rem',
      boxShadow: glow ? `0 0 24px ${C.redGlow}` : 'none',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow .2s, border-color .2s',
      ...style,
    }}>{children}</div>
  )
}

export function MetricCard({ label, value, sub, color, trend, icon }) {
  const col = color || C.text
  return (
    <Card style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:600, color:C.text3, textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</span>
        {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:32, fontWeight:800, color:col, lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.text3 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize:11, fontWeight:600, color: trend >= 0 ? C.success : C.danger, marginTop:4 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
        </div>
      )}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${col}, transparent)`, opacity:.4 }} />
    </Card>
  )
}

export function Badge({ children, color='muted', size='sm' }) {
  const map = {
    green:  { bg:'rgba(48,209,88,.12)',  fg:'#30D158' },
    amber:  { bg:'rgba(255,214,10,.12)', fg:'#FFD60A' },
    red:    { bg:'rgba(255,69,58,.12)',  fg:'#FF453A' },
    crimson:{ bg:'rgba(229,72,77,.12)',  fg:'#E5484D' },
    blue:   { bg:'rgba(10,132,255,.12)', fg:'#0A84FF' },
    purple: { bg:'rgba(191,90,242,.12)', fg:'#BF5AF2' },
    muted:  { bg:'rgba(255,255,255,.06)',fg:'#A0A0C0' },
  }
  const s = map[color] || map.muted
  const pad = size === 'lg' ? '5px 14px' : '3px 10px'
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:pad, borderRadius:20, background:s.bg, color:s.fg, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:4 }}>
      {children}
    </span>
  )
}

export function Btn({ children, onClick, disabled, variant='primary', size='md', style={} }) {
  const styles = {
    primary: { background:C.red, color:'#fff', border:'none' },
    ghost:   { background:'none', color:C.text2, border:`1px solid ${C.border}` },
    surface: { background:C.surface2, color:C.text, border:`1px solid ${C.border}` },
    danger:  { background:'none', color:C.danger, border:'1px solid rgba(255,69,58,.3)' },
  }
  const sizes = {
    sm: { fontSize:12, padding:'6px 12px', borderRadius:8 },
    md: { fontSize:13, padding:'9px 18px', borderRadius:10 },
    lg: { fontSize:14, padding:'12px 24px', borderRadius:12 },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], ...sizes[size],
      fontWeight:700, cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?.5:1, fontFamily:'inherit',
      transition:'opacity .15s, background .15s',
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      ...style,
    }}>{children}</button>
  )
}

export function Input({ placeholder, value, onChange, type='text', style={} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ fontSize:13, padding:'9px 12px', borderRadius:8,
        border:`1px solid ${C.border2}`, background:C.surface2,
        color:C.text, outline:'none', width:'100%',
        transition:'border-color .15s',
        ...style,
      }}
    />
  )
}

export function Select({ value, onChange, children, style={} }) {
  return (
    <select value={value} onChange={onChange}
      style={{ fontSize:13, padding:'9px 12px', borderRadius:8,
        border:`1px solid ${C.border2}`, background:C.surface2,
        color:C.text, outline:'none', width:'100%', ...style,
      }}>{children}</select>
  )
}

export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value/max)*100 : 0)
  const col = color || (value >= max ? C.success : C.red)
  return (
    <div style={{ background:'rgba(255,255,255,.06)', borderRadius:4, height:4, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:4, transition:'width .4s ease' }} />
    </div>
  )
}

export function ProgressRing({ value, max, size=56, stroke=4, color }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  const col = color || (pct >= 1 ? C.success : pct >= .5 ? C.red : C.warning)
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset .4s ease' }} />
    </svg>
  )
}

export function Skeleton({ width='100%', height=16, radius=6, style={} }) {
  return (
    <div style={{ width, height, borderRadius:radius, background:C.surface3,
      animation:'pulse 1.5s ease infinite', ...style }} />
  )
}

export function Divider({ style={} }) {
  return <div style={{ height:1, background:C.border, width:'100%', ...style }} />
}

export function Spinner({ size=18 }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid rgba(229,72,77,.2)`,
      borderTop:`2px solid ${C.red}`, borderRadius:'50%',
      animation:'spin .7s linear infinite', display:'inline-block' }} />
  )
}

export function Tooltip({ children, tip }) {
  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={e => {
        const t = e.currentTarget.querySelector('.tip')
        if (t) t.style.opacity = '1'
      }}
      onMouseLeave={e => {
        const t = e.currentTarget.querySelector('.tip')
        if (t) t.style.opacity = '0'
      }}>
      {children}
      <div className="tip" style={{
        position:'absolute', bottom:'calc(100% + 6px)', left:'50%',
        transform:'translateX(-50%)', background:C.surface3,
        color:C.text2, fontSize:11, padding:'4px 8px', borderRadius:6,
        whiteSpace:'nowrap', opacity:0, transition:'opacity .15s',
        border:`1px solid ${C.border2}`, pointerEvents:'none', zIndex:100,
      }}>{tip}</div>
    </div>
  )
}
