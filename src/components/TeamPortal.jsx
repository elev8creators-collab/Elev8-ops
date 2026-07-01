import React, { useEffect, useState } from 'react'
import { TEAM_MEMBERS, WEEKLY_TARGETS } from '../config.js'
import { getLogsInRange, getWeekRange } from '../data.js'

const COLOR_MAP = {
  blue: { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)', solid: '#6366f1' },
  teal: { bg: 'rgba(34,211,165,0.15)', text: '#22d3a5', border: 'rgba(34,211,165,0.3)', solid: '#22d3a5' },
  purple: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)', solid: '#8b5cf6' },
  pink: { bg: 'rgba(236,72,153,0.15)', text: '#f472b6', border: 'rgba(236,72,153,0.3)', solid: '#ec4899' },
  amber: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)', solid: '#f59e0b' },
}

export default function TeamPortal({ onSelectMember }) {
  const [weekLogs, setWeekLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const weekRange = getWeekRange()

  useEffect(() => {
    const load = async () => {
      try {
        const logs = await getLogsInRange(weekRange.start, weekRange.end)
        setWeekLogs(logs)
      } catch(e) { console.warn(e) }
      setLoading(false)
    }
    load()
  }, [])

  const ranked = TEAM_MEMBERS.map(m => {
    const ml = weekLogs.filter(l => l.member_name === m.name)
    return {
      ...m,
      points: ml.reduce((s,l) => s + (parseFloat(l.total_points)||0), 0),
      videos: ml.reduce((s,l) => s + (parseInt(l.total_videos)||0), 0),
      days: new Set(ml.map(l=>l.log_date)).size,
    }
  }).sort((a,b) => b.points - a.points)

  const maxPts = ranked[0]?.points || 1
  const medals = ['🥇','🥈','🥉']

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div className="live-dot" />
          <span style={{ fontSize:11, color:'var(--text2)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Operations Live</span>
        </div>
        <h1 className="page-title">Who are you <span style={{ color:'#6366f1' }}>today?</span></h1>
        <p style={{ color:'var(--text2)', fontSize:15 }}>Select your profile to log your work</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', className:'team-layout', gap:24, alignItems:'start' }}>
        {/* Left: Member Cards */}
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
            {TEAM_MEMBERS.map((member, i) => {
              const color = COLOR_MAP[member.color] || COLOR_MAP.blue
              const memberRank = ranked.findIndex(r => r.name === member.name)
              const memberData = ranked[memberRank] || { points:0, videos:0 }
              return (
                <div
                  key={member.name}
                  onClick={() => onSelectMember(member)}
                  className="card"
                  style={{
                    cursor:'pointer', borderColor:color.border,
                    boxShadow:`0 0 20px ${color.bg}`,
                    display:'flex', alignItems:'center', gap:14, padding:'18px 20px',
                    animation:`fadeIn 0.4s ease ${i*60}ms both`,
                    transition:'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${color.bg}` }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 0 20px ${color.bg}` }}
                >
                  <div style={{ position:'relative' }}>
                    <div className="avatar" style={{ width:44, height:44, background:color.bg, color:color.text, fontSize:14, border:`1px solid ${color.border}` }}>
                      {member.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    {memberRank < 3 && memberData.points > 0 && (
                      <div style={{ position:'absolute', top:-6, right:-6, fontSize:14 }}>{medals[memberRank]}</div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>{member.name}</div>
                    <span className={`badge ${member.color}`}>{member.role}</span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>this week</div>
                    <div style={{ fontSize:18, fontWeight:700, color:color.solid }}>{memberData.videos}<span style={{ fontSize:11, color:'var(--text3)', marginLeft:3 }}>vids</span></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(99,102,241,0.06)', borderRadius:10, border:'1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ fontSize:13, color:'var(--text2)' }}>
              <span style={{ color:'#818cf8', fontWeight:600 }}>🕐 Timezone aware:</span>{' '}
              India team logs in IST · Narpat logs in EST
            </p>
          </div>
        </div>

        {/* Right: Leaderboard */}
        <div>
          <div className="card purple" style={{ position:'sticky', top:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <span style={{ fontSize:20 }}>🏆</span>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>Leaderboard</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>This week · {weekRange.start} → {weekRange.end}</div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:30, color:'var(--text2)' }}>Loading...</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {ranked.map((m, i) => {
                  const color = COLOR_MAP[m.color] || COLOR_MAP.blue
                  const pct = maxPts > 0 ? (m.points / maxPts) * 100 : 0
                  const target = WEEKLY_TARGETS[m.role] || 14
                  const targetPct = Math.min((m.points/target)*100, 100)

                  return (
                    <div key={m.name} style={{
                      background: i===0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                      borderRadius:10, padding:'12px 14px',
                      border:`1px solid ${i===0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      animation:`slideIn 0.3s ease ${i*60}ms both`,
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <div style={{ fontSize:18, width:24, textAlign:'center', flexShrink:0 }}>
                          {medals[i] || <span style={{ color:'var(--text3)', fontSize:13 }}>#{i+1}</span>}
                        </div>
                        <div className="avatar" style={{ width:28, height:28, fontSize:10, background:color.bg, color:color.text, border:`1px solid ${color.border}`, flexShrink:0 }}>
                          {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:16, fontWeight:700, color:color.solid }}>{m.points}<span style={{ fontSize:10, color:'var(--text3)', marginLeft:2 }}>pts</span></div>
                          <div style={{ fontSize:10, color:'#22d3a5' }}>🎬{m.videos}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ flex:1, height:4 }}>
                          <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${color.solid}, ${color.solid}88)`, height:'100%' }} />
                        </div>
                        <span style={{ fontSize:10, color: targetPct>=80?'#22d3a5':targetPct>=50?'#f59e0b':'#f87171', minWidth:30, textAlign:'right' }}>
                          {Math.round(targetPct)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--border)', fontSize:11, color:'var(--text3)', textAlign:'center' }}>
              Updates when team members log work
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
