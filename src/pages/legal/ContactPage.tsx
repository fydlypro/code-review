import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft, Mail, MessageCircle, MapPin, Send, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function ContactPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success (could integrate with a form service later)
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 h-[68px] flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
              <Zap size={15} fill="currentColor" className="text-white" />
            </div>
            <span className="text-[22px] font-display font-bold text-slate-900 leading-none tracking-tight">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-[100px] pb-20">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-4">
          Contactez-nous
        </h1>
        <p className="text-slate-500 text-lg mb-12 max-w-xl">
          Une question, une suggestion, un partenariat ? On vous répond sous 24h.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left — Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-5">
              {[
                {
                  icon: <Mail size={20} className="text-fydly-500" />,
                  label: 'Email',
                  value: 'contact@fydly.com',
                  href: 'mailto:contact@fydly.com',
                },
                {
                  icon: <MessageCircle size={20} className="text-fydly-500" />,
                  label: 'Support',
                  value: 'Réponse sous 24h',
                  href: 'mailto:contact@fydly.com',
                },
                {
                  icon: <MapPin size={20} className="text-fydly-500" />,
                  label: 'Localisation',
                  value: 'France',
                  href: null,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-fydly-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-semibold text-slate-900 hover:text-fydly-500 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-bv-soft rounded-2xl p-6 border border-fydly-100 mt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-2">💡 Astuce</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pour les questions sur votre abonnement ou votre compte,
                utilisez la section <strong>Support</strong> directement depuis votre tableau de bord commerçant
                pour un traitement plus rapide.
              </p>
            </div>
          </div>

          {/* Right — Contact form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white rounded-[20px] border border-slate-100 shadow-card p-10 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">
                  Message envoyé !
                </h2>
                <p className="text-slate-500 mb-8">
                  Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-[20px] border border-slate-100 shadow-card p-8 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-fydly-500/20 focus:border-fydly-400 transition-all"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-fydly-500/20 focus:border-fydly-400 transition-all"
                      placeholder="jean@moncommerce.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sujet
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-fydly-500/20 focus:border-fydly-400 transition-all bg-white"
                  >
                    <option value="">Choisir un sujet…</option>
                    <option value="question">Question générale</option>
                    <option value="support">Support technique</option>
                    <option value="billing">Facturation</option>
                    <option value="partnership">Partenariat</option>
                    <option value="bug">Signaler un bug</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-fydly-500/20 focus:border-fydly-400 transition-all resize-none"
                    placeholder="Décrivez votre demande en détail…"
                  />
                </div>

                <Button type="submit" className="w-full py-3.5 text-sm shadow-glow-blue">
                  <Send size={15} className="mr-2" />
                  Envoyer le message
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  En envoyant ce formulaire, vous acceptez notre{' '}
                  <a onClick={() => navigate('/privacy')} className="text-fydly-500 hover:underline cursor-pointer">
                    politique de confidentialité
                  </a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">© 2026 Fydly — Tous droits réservés</p>
      </footer>
    </div>
  );
}
