import React from 'react'
import { TEAM_MEMBERS } from '../config.js'

const COLOR_MAP = {
  blue: { bg: 'rgba(99,102,241,0.2)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  teal: { bg: 'rgba(34,211,165,0.2)', text: '#22d3a5', border: 'rgba(34,211,165,0.3)' },
  purple: { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  pink: { bg: 'rgba(236,72,153,0.2)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
  amber: { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
}

const ROLE_COLORS = {
  'Editor': 'blue',
  'Production': 'amber',
  'Social': 'teal',
}

export default function TeamPortal({ onSelectMember }) {
  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Operations Live
          </span>
        </div>
        <h1 className="page-title">
          Who are you <span style={{ color: '#6366f1' }}>today?</span>
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15 }}>Select your profile to log your work</p>
      </div>

      {/* Team grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {TEAM_MEMBERS.map((member, i) => {
          const color = COLOR_MAP[member.color] || COLOR_MAP.blue
          const roleColor = ROLE_COLORS[member.role] || 'blue'
          return (
            <MemberCard
              key={member.name}
              member={member}
              color={color}
              roleColor={roleColor}
              delay={i * 60}
              onClick={() => onSelectMember(member)}
            />
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(99,102,241,0.06)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>🕐 Timezone aware:</span>{' '}
          India team logs in IST · Narpat logs in EST · All data is accurate to your local date.
        </p>
      </div>
    </div>
  )
}

function MemberCard({ member, color, roleColor, delay, onClick }) {
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderColor: color.border,
        boxShadow: `0 0 20px ${color.bg}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px',
        animation: `fadeIn 0.4s ease ${delay}ms both`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 30px ${color.bg}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = `0 0 20px ${color.bg}`
      }}
    >
      <div
        className="avatar"
        style={{
          width: 48,
          height: 48,
          background: color.bg,
          color: color.text,
          fontSize: 16,
          border: `1px solid ${color.border}`,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{member.name}</div>
        <span className={`badge ${roleColor}`}>{member.role}</span>
      </div>
      <div style={{ color: color.text, fontSize: 20, opacity: 0.6 }}>→</div>
    </div>
  )
}
