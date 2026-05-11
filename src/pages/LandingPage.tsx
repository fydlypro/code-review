import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, CreditCard, Bell, TrendingUp, ShieldCheck, Zap, ArrowRight, Store, Menu, X, Star, Users, BarChart3, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-fydly-100 selection:text-fydly-900">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-xl border-b border-slate-100 h-[68px] flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
              <Zap size={15} fill="currentColor" className="text-white" />
            </div>
            <span className="text-[22px] font-display font-bold text-slate-900 leading-none tracking-tight">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">À propos</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate('/merchant/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Connexion
            </button>
            <Button
              onClick={() => navigate('/merchant/register')}
              className="px-5 py-2.5 text-sm shadow-glow-blue"
            >
              Commencer gratuitement →
            </Button>
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => navigate('/customer/auth')}
              className="p-2.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-sm active:scale-95 transition-all"
            >
              <CreditCard size={18} />
            </button>
            <button onClick={toggleMenu} className="p-2 text-slate-900 active:scale-90 transition-all">
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[90] bg-white transition-all duration-500 ease-in-out lg:hidden ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-5 p-10">
          <a href="#features" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">Fonctionnalités</a>
          <a href="#pricing" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">Tarifs</a>
          <a href="#how-it-works" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">À propos</a>
          <div className="w-full h-px bg-slate-100 my-3" />
          <Button
            onClick={() => { toggleMenu(); navigate('/customer/auth'); }}
            variant="secondary"
            className="w-full py-4 text-lg"
          >
            Accès Client
          </Button>
          <Button
            onClick={() => { toggleMenu(); navigate('/merchant/login'); }}
            variant="secondary"
            className="w-full py-4 text-lg"
          >
            Connexion
          </Button>
          <Button
            onClick={() => { toggleMenu(); navigate('/merchant/register'); }}
            className="w-full py-4 text-lg shadow-glow-blue"
          >
            Commencer gratuitement →
          </Button>
        </div>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-[68px] min-h-screen flex items-center bg-gradient-to-b from-white to-blue-50/40 overflow-hidden">
        {/* Blobs décoratifs */}
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-blue-400/30 blur-[130px] rounded-full pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-violet-400/20 blur-[100px] rounded-full pointer-events-none -z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32 w-full">
          {/* Pill animée */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-bv text-white text-[11px] font-bold tracking-widest shadow">
              <span>✨</span>
              <span>NOUVEAU · Programme de fidélité 2.0</span>
            </div>
          </div>

          {/* H1 */}
          <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-display font-bold text-slate-900 text-center leading-[1.05] tracking-tight mb-6">
            La fidélisation qui
            <br />
            <span className="text-gradient-bv italic">fidélise vraiment.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-center text-lg sm:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Tampons digitaux, analytics temps réel, push notifications. Pour les commerces locaux qui veulent des clients qui reviennent.
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Button
              onClick={() => navigate('/merchant/register')}
              className="w-[240px] h-14 text-base font-semibold shadow-glow-strong"
            >
              Démarrer gratuitement →
            </Button>
            <button
              onClick={() => navigate('/scan')}
              className="w-[240px] h-14 text-base font-semibold text-slate-700 hover:bg-white/80 rounded-btn transition-all border border-slate-200 bg-white/60 active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode size={18} />
              Voir la démo
            </button>
          </div>

          {/* Social proof */}
          <p className="text-center text-sm text-slate-400 font-medium">
            Déjà 300+ commerçants · ★★★★★ 4.9/5 · Sans carte bancaire
          </p>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 divide-x-0 sm:divide-x divide-slate-700">
            {[
              { value: '300+', label: 'Commerçants' },
              { value: '50 000+', label: 'Clients fidélisés' },
              { value: '+47%', label: 'Visites en plus' },
              { value: '4.9/5', label: 'Note moyenne' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center px-4">
                <span className="text-[40px] font-mono font-bold text-gradient-bv leading-none mb-2">{stat.value}</span>
                <span className="text-sm text-slate-400 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Comment ça marche</span>
            <h2 className="text-4xl lg:text-[52px] font-display text-slate-900 leading-tight mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-slate-500">3 étapes, c'est tout.</p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                emoji: '🏪',
                iconBg: 'bg-fydly-50',
                iconColor: 'text-fydly-500',
                icon: <Store size={28} className="text-fydly-500" />,
                title: 'Inscrivez votre commerce',
                desc: 'Créez votre compte en moins de 5 minutes. Configurez votre programme de fidélité personnalisé.',
              },
              {
                num: '02',
                emoji: '📲',
                iconBg: 'bg-violet-50',
                iconColor: 'text-violet-500',
                icon: <QrCode size={28} className="text-violet-500" />,
                title: 'Affichez votre QR Code',
                desc: 'Imprimez ou affichez votre QR Code unique en caisse. Vos clients scannent en 2 secondes.',
              },
              {
                num: '03',
                emoji: '⚡',
                iconBg: 'bg-green-50',
                iconColor: 'text-green-500',
                icon: <Zap size={28} className="text-green-500" />,
                title: 'Fidélisez automatiquement',
                desc: 'Les tampons s\'accumulent, les récompenses se débloquent. Vos clients reviennent naturellement.',
              },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col bg-white border border-slate-100 rounded-card shadow-card p-8 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group">
                <div className={`w-14 h-14 ${step.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <span className="text-5xl font-display font-bold text-slate-100 absolute top-6 right-8 leading-none">{step.num}</span>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{step.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm">
                    <ArrowRight size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 lg:py-28 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Fonctionnalités</span>
            <h2 className="text-4xl lg:text-[52px] font-display text-slate-900 leading-tight mb-4">
              Tout ce dont vous avez besoin.
            </h2>
            <p className="text-xl text-slate-500 max-w-xl mx-auto">
              Une plateforme complète pour fidéliser intelligemment vos clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                emoji: '🎯',
                iconBg: 'bg-fydly-50',
                icon: <QrCode className="text-fydly-500" size={24} />,
                title: 'QR Code dynamique',
                desc: 'Quotidien, sécurisé. Changeable à tout moment depuis votre dashboard. Impossible à falsifier.',
              },
              {
                emoji: '📊',
                iconBg: 'bg-blue-50',
                icon: <BarChart3 className="text-blue-500" size={24} />,
                title: 'Analytics avancées',
                desc: 'Heatmap de fréquentation, taux de rétention, clients actifs vs inactifs. Tout en temps réel.',
              },
              {
                emoji: '🔔',
                iconBg: 'bg-amber-50',
                icon: <Bell className="text-amber-500" size={24} />,
                title: 'Push notifications',
                desc: 'Ciblez vos clients avec des messages personnalisés. Relancez les inactifs automatiquement.',
              },
              {
                emoji: '🃏',
                iconBg: 'bg-violet-50',
                icon: <CreditCard className="text-violet-500" size={24} />,
                title: 'Cartes digitales',
                desc: 'Avec animations gamifiées. Vos clients adorent voir leurs tampons s\'accumuler.',
              },
              {
                emoji: '🤖',
                iconBg: 'bg-emerald-50',
                icon: <TrendingUp className="text-emerald-500" size={24} />,
                title: 'IA & recommandations',
                desc: 'Insights intelligents sur vos meilleures heures, vos clients VIP et les opportunités à saisir.',
              },
              {
                emoji: '⚡',
                iconBg: 'bg-fydly-50',
                icon: <Zap className="text-fydly-500" size={24} />,
                title: 'Temps réel',
                desc: 'Tampons instantanés dès le scan. Zéro délai, zéro friction. L\'expérience parfaite.',
              },
            ].map((f, i) => (
              <div key={i} className="p-7 bg-white rounded-card border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 lg:py-28 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Tarifs</span>
            <h2 className="text-4xl lg:text-[52px] font-display text-slate-900 leading-tight mb-4">
              Simple. Transparent.
            </h2>
            <p className="text-xl text-slate-500 max-w-lg mx-auto">
              Commencez gratuitement, évoluez quand vous êtes prêt.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* FREE */}
            <div className="bg-white border border-slate-200 rounded-[20px] p-8 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Gratuit</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-slate-900">0 €</span>
                  <span className="text-slate-400 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">Pour démarrer sans risque</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Fonctions basiques',
                  '50 clients maximum',
                  'QR Code unique',
                  'Carte digitale standard',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle size={15} className="text-slate-300 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/merchant/register')}
                className="w-full py-3 rounded-btn border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95"
              >
                Commencer gratuitement
              </button>
            </div>

            {/* PRO */}
            <div className="relative bg-gradient-bv rounded-[20px] p-8 shadow-glow-strong overflow-hidden">
              {/* Badge Populaire */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                Populaire
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-6 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-white">29 €</span>
                  <span className="text-white/60 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-white/60 text-sm mt-2">30 jours d'essai gratuit</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                {[
                  'Tout illimité',
                  'Analytics complets',
                  'Push notifications',
                  'IA & recommandations',
                  'Support prioritaire',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                    <CheckCircle size={15} className="text-white flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/merchant/register')}
                variant="secondary"
                className="w-full py-3 bg-white text-slate-900 hover:bg-slate-50 font-semibold text-sm active:scale-95 relative z-10"
              >
                Essayer gratuitement — 30 jours
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 font-medium mt-8">
            30 jours d'essai gratuit · Sans carte bancaire
          </p>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 lg:py-36 text-center px-6 relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-fydly-400/10 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-fydly-100 text-fydly-600 text-[11px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <Sparkles size={12} />
            Sans carte bancaire requise
          </div>
          <h2 className="text-5xl lg:text-[72px] font-display text-slate-900 mb-8 leading-[0.95]">
            Prêt à transformer
            <br />
            <span className="text-gradient-bv italic">vos visites ?</span>
          </h2>
          <p className="text-xl text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez les commerçants qui ont digitalisé leur fidélité. Démarrez en moins de 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/merchant/register')}
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold active:scale-95 transition-all group shadow-glow-strong"
            >
              Démarrer gratuitement
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-slate-700 hover:bg-white rounded-btn transition-all border border-slate-200 bg-white active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode size={16} />
              Scanner un code
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 bg-gradient-bv rounded-[10px] flex items-center justify-center shadow-glow-blue">
                <Zap size={15} fill="currentColor" className="text-white" />
              </div>
              <span className="text-[22px] font-display font-bold text-white leading-none">
                Fydly<span className="text-fydly-400">·</span>
              </span>
            </div>

            <p className="text-slate-400 text-sm text-center max-w-xs">
              La fidélisation digitale pour le commerce local.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">CGV</a>
              <a href="mailto:contact@fydly.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-500 text-sm">
              © 2026 Fydly — Fait avec ❤️ pour le commerce local
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
