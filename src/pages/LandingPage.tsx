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
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-bv text-white text-[11px] font-bold tracking-widest shadow">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
              <span>NOUVEAU — FIDÉLITÉ 100% DIGITALE</span>
              <Sparkles size={12} className="text-white/80" />
            </div>
          </div>

          {/* H1 */}
          <h1 className="text-[44px] sm:text-[60px] lg:text-[72px] font-display font-bold text-slate-900 text-center leading-[1.05] tracking-tight mb-6">
            La fidélité
            <br />
            <span className="text-gradient-bv italic">sans friction.</span>
            <br />
            <span className="text-slate-900">Sans carte.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-center text-lg sm:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Fydly connecte vos clients à votre commerce en 2 secondes chrono — un scan, un tampon digital, et ils reviennent. Toujours.
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
              Scanner un QR Code
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['#BFDBFE','#93C5FD','#60A5FA','#3B82F6'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: c, zIndex: 4 - i }}>
                  {['M','A','S','L'][i]}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">7 commerçants</span> nous font confiance
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 divide-x-0 sm:divide-x divide-slate-700">
            {[
              { value: '7', label: 'Commerçants actifs' },
              { value: '300+', label: 'Clients fidélisés' },
              { value: '96%', label: 'Taux de satisfaction' },
              { value: '+47%', label: 'Visites en plus (moy.)' },
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
              Simple comme<br />un coup de tampon.
            </h2>
            <p className="text-xl text-slate-500">Pas d'application à télécharger, pas de carte à imprimer. En trois étapes, vos clients sont fidélisés.</p>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                emoji: '📲',
                iconBg: 'bg-fydly-50',
                iconColor: 'text-fydly-500',
                icon: <QrCode size={28} className="text-fydly-500" />,
                title: 'Scan du QR Code',
                desc: "Votre client scanne le QR Code affiché en caisse. Aucune installation requise — tout se passe dans le navigateur.",
              },
              {
                num: '02',
                emoji: '⚡',
                iconBg: 'bg-violet-50',
                iconColor: 'text-violet-500',
                icon: <Zap size={28} className="text-violet-500" />,
                title: 'Tampon instantané',
                desc: "En 2 secondes, un tampon est crédité sur leur carte digitale. Une animation satisfaisante récompense l'action.",
              },
              {
                num: '03',
                emoji: '⭐',
                iconBg: 'bg-green-50',
                iconColor: 'text-green-500',
                icon: <Star size={28} className="text-green-500" />,
                title: 'Récompense débloquée',
                desc: "Une fois la carte complète, le client présente sa récompense. Vous validez, il repart heureux. Et il reviendra.",
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
              Tout ce qu'il faut.<br />Rien de superflu.
            </h2>
            <p className="text-xl text-slate-500 max-w-xl mx-auto">
              Fydly réunit dans une seule plateforme légère tout ce dont votre commerce a besoin pour fidéliser intelligemment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                emoji: '🎯',
                iconBg: 'bg-fydly-50',
                icon: <QrCode className="text-fydly-500" size={24} />,
                title: 'QR Code unique par commerce',
                desc: 'Généré automatiquement, prêt à imprimer ou afficher sur écran. Changeable à tout moment.',
              },
              {
                emoji: '🃏',
                iconBg: 'bg-violet-50',
                icon: <CreditCard className="text-violet-500" size={24} />,
                title: 'Carte 100% digitale',
                desc: 'Stockée dans le mobile, accessible depuis le navigateur sans app. Vos clients ne la perdront plus.',
              },
              {
                emoji: '🔔',
                iconBg: 'bg-amber-50',
                icon: <Bell className="text-amber-500" size={24} />,
                title: 'Notifications de relance',
                desc: 'Alertes automatiques pour rappeler à vos clients qu\'ils ont des tampons en attente.',
              },
              {
                emoji: '📊',
                iconBg: 'bg-emerald-50',
                icon: <TrendingUp className="text-emerald-500" size={24} />,
                title: 'Analytics en temps réel',
                desc: 'Suivez vos performances : nombre de visites, taux de rétention, récompenses distribuées.',
              },
              {
                emoji: '🛡️',
                iconBg: 'bg-fydly-50',
                icon: <ShieldCheck className="text-fydly-500" size={24} />,
                title: 'Anti-fraude intégré',
                desc: 'Tokens dynamiques à durée de vie limitée. Impossible de falsifier un tampon.',
              },
              {
                emoji: '⚡',
                iconBg: 'bg-violet-50',
                icon: <Zap className="text-violet-500" size={24} />,
                title: 'Expérience micro-animée',
                desc: 'Des feedbacks visuels satisfaisants à chaque tampon — vos clients veulent en reprendre un.',
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

      {/* ─── TÉMOIGNAGE ─── */}
      <section className="py-20 lg:py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-8">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={20} className="text-amber-400" fill="currentColor" />
            ))}
          </div>
          <blockquote className="text-2xl lg:text-4xl font-display text-slate-900 leading-snug mb-10 italic">
            "Depuis Fydly, mes clients reviennent 40% plus souvent. Et ils adorent l'animation quand ils gagnent un tampon — ça fait vraiment la différence."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-bv flex items-center justify-center text-white font-bold text-lg shadow-glow-blue">
              M
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-sm">Marie Fontaine</p>
              <p className="text-slate-400 text-xs font-medium">Propriétaire — Boulangerie Fontaine, Lyon</p>
            </div>
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
              Démarrez gratuitement, évoluez quand vous êtes prêt. Aucune carte bancaire requise pour commencer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro */}
            <div className="relative bg-gradient-bv rounded-[20px] p-8 shadow-glow-strong overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                Populaire
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="mb-6 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-white">59,99 €</span>
                  <span className="text-white/60 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-white/60 text-sm mt-2">30 jours gratuits — sans carte bancaire</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                {[
                  '1 établissement · clients illimités',
                  'Notifications push illimitées',
                  'Analytics complets + IA',
                  'Segmentation clients (VIP / inactifs)',
                  'Support email sous 48h',
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

            {/* Business */}
            <div className="bg-white border border-slate-200 rounded-[20px] p-8 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Business</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-slate-900">109,99 €</span>
                  <span className="text-slate-400 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">30 jours gratuits — sans carte bancaire</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Jusqu'à 5 établissements",
                  'Dashboard centralisé multi-sites',
                  'API accès + personnalisation',
                  'Appel de lancement en visio (1h)',
                  'WhatsApp direct avec le fondateur',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle size={15} className="text-fydly-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/merchant/register')}
                className="w-full py-3 rounded-btn border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95"
              >
                Essayer gratuitement — 30 jours
              </button>
            </div>
          </div>


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
            Rejoignez les premiers commerçants qui ont digitalisé leur fidélité. Démarrez en moins de 10 minutes.
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
              <a onClick={() => navigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">Confidentialité</a>
              <a onClick={() => navigate('/terms')} className="hover:text-white transition-colors cursor-pointer">CGV</a>
              <a onClick={() => navigate('/legal')} className="hover:text-white transition-colors cursor-pointer">Mentions légales</a>
              <a onClick={() => navigate('/contact')} className="hover:text-white transition-colors cursor-pointer">Contact</a>
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
