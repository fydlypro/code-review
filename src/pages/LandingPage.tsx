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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-fydly-100 selection:text-fydly-900">

      {/* ─── NAVIGATION ─── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-gradient-bv rounded-xl flex items-center justify-center shadow-glow-blue">
              <Zap size={18} fill="currentColor" className="text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-slate-900 leading-none tracking-tight">
              Fydly<span className="text-fydly-500">·</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <div className="w-px h-5 bg-slate-200" />
            <button
              onClick={() => navigate('/customer/auth')}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Espace Client
            </button>
            <button
              onClick={() => navigate('/merchant/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Espace Pro
            </button>
            <Button
              onClick={() => navigate('/merchant/register')}
              className="px-6 py-2.5 text-sm"
            >
              Démarrer gratuitement
            </Button>
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/auth')}
              className="p-2.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-sm active:scale-95 transition-all"
            >
              <CreditCard size={18} />
            </button>
            <button
              onClick={() => navigate('/scan')}
              className="p-2.5 rounded-full bg-gradient-bv text-white shadow-md active:scale-95 transition-all"
            >
              <QrCode size={18} />
            </button>
            <button onClick={toggleMenu} className="p-2 text-slate-900 active:scale-90 transition-all">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[90] bg-white transition-all duration-500 ease-in-out lg:hidden ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-5 p-10">
          <a href="#features" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">Fonctionnalités</a>
          <a href="#how-it-works" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">Comment ça marche</a>
          <a href="#pricing" onClick={toggleMenu} className="text-3xl font-display text-slate-900 hover:text-fydly-500 transition-colors">Tarifs</a>
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
            className="w-full py-4 text-lg bg-fydly-50"
          >
            Espace Commerçant
          </Button>
          <Button
            onClick={() => { toggleMenu(); navigate('/merchant/register'); }}
            className="w-full py-4 text-lg"
          >
            Démarrer gratuitement
          </Button>
        </div>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-28 px-6 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-fydly-300/15 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-violet-400/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center lg:justify-start mb-8">
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white border border-fydly-100 text-fydly-600 text-[11px] font-bold uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 rounded-full bg-fydly-500 animate-pulse flex-shrink-0" />
              Nouveau — Fidélité 100% digitale
              <Sparkles size={12} className="text-fydly-400" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left — Copy */}
            <div className="w-full lg:w-[55%] text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-[80px] xl:text-[90px] font-display text-slate-900 leading-[0.92] mb-7 lg:mb-8">
                La fidélité
                <br />
                <span className="text-gradient-bv italic">sans friction.</span>
                <br />
                <span className="text-slate-900">Sans carte.</span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Fydly connecte vos clients à votre commerce en 2 secondes chrono — un scan, un tampon digital, et ils reviennent. Toujours.
              </p>

              {/* Social proof inline */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-10">
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

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate('/merchant/register')}
                  className="w-full sm:w-auto min-h-[52px] px-8 py-4 text-base font-semibold group active:scale-95 transition-all"
                >
                  Démarrer gratuitement
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <button
                  onClick={() => navigate('/scan')}
                  className="w-full sm:w-auto min-h-[52px] px-8 py-4 text-base font-semibold text-slate-700 hover:bg-white rounded-btn transition-all border border-slate-200 bg-white/50 active:scale-95 active:opacity-80 touch-manipulation flex items-center justify-center gap-2"
                >
                  <QrCode size={16} />
                  Scanner un QR Code
                </button>
              </div>
            </div>

            {/* Right — Visual Dashboard */}
            <div className="w-full lg:w-[45%] relative">
              <div className="relative mx-auto max-w-[380px] lg:max-w-none">
                {/* Main card */}
                <div className="bg-white rounded-[28px] shadow-modal p-6 lg:p-8 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Votre carte Fydly</p>
                      <p className="text-lg font-display font-bold text-slate-900">Café Le Marché</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-bv rounded-xl flex items-center justify-center shadow-glow-blue">
                      <Store size={18} className="text-white" />
                    </div>
                  </div>

                  {/* Stamps grid */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tampons</p>
                      <p className="text-xs font-bold text-slate-900">8 / 10</p>
                    </div>
                    <div className="grid grid-cols-5 gap-2.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                            i < 8
                              ? 'bg-fydly-500 shadow-sm shadow-fydly-500/30'
                              : 'bg-slate-50 border-2 border-slate-200 border-dashed'
                          }`}
                        >
                          {i < 8 && <Zap size={14} className="text-white" fill="currentColor" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-bv rounded-full" style={{ width: '80%' }} />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-2">Plus que 2 tampons pour votre récompense !</p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-3 bg-fydly-50 rounded-2xl border border-fydly-100">
                    <Star size={14} className="text-fydly-500" fill="currentColor" />
                    <p className="text-xs font-semibold text-fydly-700">Récompense : 1 café offert</p>
                  </div>
                </div>

                {/* Floating badge — notification */}
                <div className="absolute -top-4 -right-4 bg-fydly-500 text-white rounded-2xl px-4 py-2.5 shadow-lg shadow-fydly-500/40 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Bell size={14} fill="currentColor" />
                  <span className="text-xs font-bold">+1 tampon !</span>
                </div>

                {/* Floating badge — stats */}
                <div className="absolute -bottom-4 -left-4 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-modal flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Taux de retour</p>
                    <p className="text-sm font-bold text-slate-900">+34% ce mois</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAND ─── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-card px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x-0 sm:divide-x divide-slate-100">
              {[
                { value: '7', label: 'Commerçants actifs', icon: <Store size={18} className="text-fydly-400" /> },
                { value: '300+', label: 'Clients fidélisés', icon: <Users size={18} className="text-fydly-400" /> },
                { value: '96%', label: 'Taux de satisfaction', icon: <Star size={18} className="text-fydly-400" /> },
                { value: '+47%', label: 'Visites en plus (moy.)', icon: <BarChart3 size={18} className="text-fydly-400" /> },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center px-2 sm:px-4 py-2 gap-1">
                  <div className="mb-1">{stat.icon}</div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900">{stat.value}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider leading-tight">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Comment ça marche</span>
            <h2 className="text-4xl lg:text-[56px] font-display text-slate-900 leading-tight mb-5">
              Simple comme<br />un coup de tampon.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Pas d'application à télécharger, pas de carte à imprimer. En trois étapes, vos clients sont fidélisés.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <QrCode size={28} className="text-fydly-500" />,
                title: 'Scan du QR Code',
                desc: "Votre client scanne le QR Code affiché en caisse. Aucune installation requise — tout se passe dans le navigateur.",
                bg: 'bg-fydly-50',
              },
              {
                step: '02',
                icon: <Zap size={28} className="text-violet-500" />,
                title: 'Tampon instantané',
                desc: "En 2 secondes, un tampon est crédité sur leur carte digitale. Une animation satisfaisante récompense l'action.",
                bg: 'bg-white',
              },
              {
                step: '03',
                icon: <Star size={28} className="text-fydly-500" />,
                title: 'Récompense débloquée',
                desc: "Une fois la carte complète, le client présente sa récompense. Vous validez, il repart heureux. Et il reviendra.",
                bg: 'bg-fydly-50',
              },
            ].map((item, i) => (
              <div key={i} className={`relative p-8 lg:p-10 ${item.bg} rounded-card border border-slate-100 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group`}>
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-card flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="text-5xl font-display font-bold text-slate-200 leading-none">{item.step}</span>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center shadow-sm">
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-20 lg:py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Fonctionnalités</span>
            <h2 className="text-4xl lg:text-[56px] font-display text-slate-900 leading-tight mb-5">
              Tout ce qu'il faut.<br />Rien de superflu.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Fydly réunit dans une seule plateforme légère tout ce dont votre commerce a besoin pour fidéliser intelligemment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <QrCode className="text-fydly-500" size={24} />,
                iconBg: 'bg-fydly-50',
                title: 'QR Code unique par commerce',
                desc: 'Généré automatiquement, prêt à imprimer ou afficher sur écran. Changeable à tout moment.',
              },
              {
                icon: <CreditCard className="text-violet-500" size={24} />,
                iconBg: 'bg-violet-50',
                title: 'Carte 100% digitale',
                desc: 'Stockée dans le mobile, accessible depuis le navigateur sans app. Vos clients ne la perdront plus.',
              },
              {
                icon: <Bell className="text-fydly-500" size={24} />,
                iconBg: 'bg-fydly-50',
                title: 'Notifications de relance',
                desc: 'Alertes automatiques pour rappeler à vos clients qu\'ils ont des tampons en attente.',
              },
              {
                icon: <TrendingUp className="text-emerald-500" size={24} />,
                iconBg: 'bg-emerald-50',
                title: 'Analytics en temps réel',
                desc: 'Suivez vos performances : nombre de visites, taux de rétention, récompenses distribuées.',
              },
              {
                icon: <ShieldCheck className="text-fydly-500" size={24} />,
                iconBg: 'bg-fydly-50',
                title: 'Anti-fraude intégré',
                desc: 'Tokens dynamiques à durée de vie limitée. Impossible de falsifier un tampon.',
              },
              {
                icon: <Zap className="text-violet-500" size={24} />,
                iconBg: 'bg-violet-50',
                title: 'Expérience micro-animée',
                desc: 'Des feedbacks visuels satisfaisants à chaque tampon — vos clients veulent en reprendre un.',
              },
            ].map((f, i) => (
              <div key={i} className="p-7 bg-slate-50 rounded-card border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
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
      <section className="py-20 lg:py-24 px-6 bg-slate-50">
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

      {/* ─── POUR LES COMMERÇANTS ─── */}
      <section id="merchants" className="py-16 lg:py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[24px] lg:rounded-[40px] overflow-hidden relative shadow-2xl">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-violet-600/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-fydly-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -top-20 right-1/4 w-64 h-64 bg-violet-600/15 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
              {/* Left content */}
              <div className="p-8 lg:p-14 xl:p-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest mb-8 border border-white/10">
                  <Store size={12} />
                  Pour les professionnels
                </div>
                <h2 className="text-3xl lg:text-5xl xl:text-6xl font-display leading-tight mb-8 text-white">
                  Redécouvrez<br />votre clientèle.
                </h2>
                <div className="space-y-5 mb-10">
                  {[
                    { icon: <TrendingUp size={16} />, text: "Tableau de bord avec analytics de fidélisation en temps réel." },
                    { icon: <Bell size={16} />, text: "Relances automatiques et notifications push pour reconquérir les clients inactifs." },
                    { icon: <ShieldCheck size={16} />, text: "Sécurité maximale avec tokens dynamiques et anti-fraude natif." },
                    { icon: <Zap size={16} />, text: "Déploiement en moins de 10 minutes, sans matériel supplémentaire." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 mt-0.5">
                        {item.icon}
                      </div>
                      <span className="text-white/80 text-[15px] leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/merchant/register')}
                    variant="secondary"
                    className="bg-white text-slate-900 hover:bg-slate-50 px-7 py-3.5 font-semibold shadow-xl active:scale-95"
                  >
                    Ouvrir mon compte Pro
                  </Button>
                  <button
                    onClick={() => navigate('/merchant/login')}
                    className="px-7 py-3.5 text-white/50 font-semibold hover:text-white transition-colors text-sm flex items-center gap-2 justify-center"
                  >
                    Déjà un compte <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Right — dashboard mockup */}
              <div className="hidden lg:flex items-center justify-center p-8 lg:p-10">
                <div className="w-full bg-white/5 backdrop-blur-sm rounded-[28px] p-8 border border-white/10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Tableau de bord</p>
                      <p className="text-white font-display text-xl font-bold">Café du Coin</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-[11px] font-bold tracking-wider">LIVE</span>
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Clients ce mois', value: '247', trend: '+12%' },
                      { label: 'Cartes complètes', value: '38', trend: '+8%' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/5">
                        <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-2">{s.label}</p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-display font-bold text-white">{s.value}</span>
                          <span className="text-emerald-400 text-xs font-bold mb-0.5">{s.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Activity bar */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-4">Activité — 7 jours</p>
                    <div className="flex items-end gap-2 h-16">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-fydly-400/30 rounded-t-lg hover:bg-fydly-400/50 transition-colors" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING TEASER ─── */}
      <section id="pricing" className="py-20 lg:py-28 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-fydly-50 text-fydly-600 border border-fydly-100 text-xs font-bold uppercase tracking-widest mb-5">Tarifs</span>
            <h2 className="text-4xl lg:text-[52px] font-display text-slate-900 leading-tight mb-5">
              Un prix simple.<br />Zéro surprise.
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-lg">
              Démarrez gratuitement, évoluez quand vous êtes prêt. Aucune carte bancaire requise pour commencer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro */}
            <div className="bg-slate-900 rounded-[20px] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-fydly-500 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Populaire
              </div>
              <div className="mb-6 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-fydly-400 mb-2">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold text-white">59,99 €</span>
                  <span className="text-white/40 text-sm font-medium">/ mois</span>
                </div>
                <p className="text-white/40 text-sm mt-2">30 jours gratuits — sans carte bancaire</p>
              </div>
              <ul className="space-y-3 mb-8 relative z-10">
                {[
                  '1 établissement · clients illimités',
                  'Notifications push illimitées',
                  'Analytics complets + IA',
                  'Segmentation clients (VIP / inactifs)',
                  'Support email sous 48h',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle size={15} className="text-fydly-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate('/merchant/register')}
                className="w-full py-3 bg-white text-slate-900 hover:bg-slate-50 font-semibold text-sm active:scale-95"
                variant="secondary"
              >
                Essayer gratuitement — 30 jours
              </Button>
            </div>

            {/* Business */}
            <div className="bg-white rounded-[20px] border border-slate-100 p-8 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
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
                className="w-full py-3 rounded-btn border border-slate-200 text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-colors active:scale-95"
              >
                Essayer gratuitement — 30 jours
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 lg:py-36 text-center px-6 relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-fydly-400/10 blur-[130px] rounded-full" />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-violet-400/8 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-fydly-100 text-fydly-600 text-[11px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <Sparkles size={12} />
            Sans carte bancaire requise
          </div>
          <h2 className="text-5xl lg:text-[72px] xl:text-[80px] font-display text-slate-900 mb-8 leading-[0.95]">
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
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold active:scale-95 transition-all group"
            >
              Démarrer gratuitement
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-btn transition-all border border-slate-200 bg-white active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode size={16} />
              Scanner un code
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-14 border-t border-slate-100 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-6 lg:flex-row items-center justify-between lg:gap-8">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 bg-gradient-bv rounded-lg flex items-center justify-center text-white">
                <Zap size={16} fill="currentColor" />
              </div>
              <span className="text-xl font-display font-bold text-slate-900">
                Fydly<span className="text-fydly-500">·</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400">
              <a href="#features" className="hover:text-slate-900 transition-colors uppercase tracking-widest">Fonctionnalités</a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors uppercase tracking-widest">Tarifs</a>
              <a href="#" className="hover:text-slate-900 transition-colors uppercase tracking-widest">Confidentialité</a>
              <a href="#" className="hover:text-slate-900 transition-colors uppercase tracking-widest">CGV</a>
              <a href="mailto:contact@fydly.com" className="hover:text-slate-900 transition-colors uppercase tracking-widest">Support</a>
            </div>

            <p className="text-slate-400 text-xs font-medium">
              © 2026 Fydly — Fait pour le commerce local.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
