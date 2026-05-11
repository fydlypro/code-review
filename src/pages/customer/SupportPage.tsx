import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: "Comment gagner des tampons ?",
    a: "Scannez le QR Code chez votre commerçant à chaque visite.",
  },
  {
    q: "Où trouver ma récompense ?",
    a: "Quand votre carte est complète, un bouton apparaît sur votre page principale pour afficher votre récompense.",
  },
  {
    q: "Comment activer les notifications ?",
    a: "Allez dans Mon compte → Notifications et activez le toggle pour recevoir vos alertes en temps réel.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Oui — Fydly utilise un chiffrement AES-256 et ne revend jamais vos données à des tiers.",
  },
  {
    q: "Puis-je supprimer mon compte ?",
    a: "Oui, dans Mon compte → Supprimer. Toutes vos données seront supprimées sous 48h conformément au RGPD.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9',
      marginBottom: 8, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12
        }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, lineHeight: 1.4 }}>
          {q}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: open ? '#2563EB' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <ChevronDown size={15} style={{ color: open ? '#fff' : '#94a3b8' }} />
        </div>
      </button>

      {open && (
        <div style={{
          padding: '0 16px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 12
        }}>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function SupportPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 18px 100px' }}>

      {/* H1 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 0 }}>Aide & Support</h1>

      {/* ACTIONS RAPIDES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
        {[
          { emoji: '🔍', label: 'Trouver un commerçant', bg: '#EFF6FF', color: '#2563EB' },
          { emoji: '📧', label: 'Nous contacter', bg: '#F5F3FF', color: '#7C3AED' },
          { emoji: '📖', label: "Guide d'utilisation", bg: '#F8FAFC', color: '#64748b' },
          { emoji: '⭐', label: 'Donner un avis', bg: '#FFFBEB', color: '#D97706' },
        ].map(item => (
          <button
            key={item.label}
            style={{
              background: item.bg, borderRadius: 16, padding: '14px 12px', border: 'none',
              cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8
            }}
          >
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <p style={{ fontSize: 12, fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.label}</p>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Questions fréquentes</h2>
        {FAQ.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </div>

      {/* CONTACT CARD */}
      <div style={{
        marginTop: 20, borderRadius: 20, padding: 20, color: '#fff',
        background: 'linear-gradient(135deg, #2563EB, #7C3AED)'
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Une question ? On est là 😊</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Réponse en moins de 2h.</p>
        <a
          href="mailto:support@fydly.app"
          style={{
            display: 'block', marginTop: 12, padding: '11px 0', borderRadius: 12,
            background: '#fff', color: '#2563EB', fontSize: 13, fontWeight: 700,
            textAlign: 'center', textDecoration: 'none'
          }}
        >
          support@fydly.app
        </a>
      </div>
    </div>
  )
}
