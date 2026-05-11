import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export default function LegalNoticePage() {
  const navigate = useNavigate();

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
          Mentions légales
        </h1>
        <p className="text-slate-400 text-sm font-medium mb-12">Dernière mise à jour : 11 mai 2026</p>

        <div className="prose prose-slate max-w-none space-y-10">
          {/* Éditeur */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">1. Éditeur du site</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <ul className="text-slate-600 space-y-2 text-sm">
                <li><strong>Raison sociale :</strong> Fydly</li>
                <li><strong>Forme juridique :</strong> Micro-entreprise</li>
                <li><strong>Responsable de la publication :</strong> Mathys Guena</li>
                <li><strong>Email :</strong> <a href="mailto:fydlypro@gmail.com" className="text-fydly-500 hover:underline">fydlypro@gmail.com</a></li>
                <li><strong>Site web :</strong> <a href="https://fydly.vercel.app" className="text-fydly-500 hover:underline">fydly.vercel.app</a></li>
              </ul>
            </div>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">2. Hébergement</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <ul className="text-slate-600 space-y-2 text-sm">
                <li><strong>Hébergeur :</strong> Vercel Inc.</li>
                <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
                <li><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-fydly-500 hover:underline">vercel.com</a></li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-4">
              <ul className="text-slate-600 space-y-2 text-sm">
                <li><strong>Base de données :</strong> Supabase Inc.</li>
                <li><strong>Localisation des serveurs :</strong> Union Européenne</li>
                <li><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-fydly-500 hover:underline">supabase.com</a></li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-slate-600 leading-relaxed">
              L'ensemble du contenu du site Fydly (textes, graphiques, images, logos, icônes, sons, logiciels, design, animations)
              est la propriété exclusive de Fydly ou de ses partenaires et est protégé par les lois françaises et internationales
              relatives à la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation
              de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans
              autorisation écrite préalable de Fydly.
            </p>
          </section>

          {/* Données personnelles */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">4. Protection des données personnelles</h2>
            <p className="text-slate-600 leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés,
              vous disposez de droits sur vos données personnelles. Pour en savoir plus, consultez notre{' '}
              <a onClick={() => navigate('/privacy')} className="text-fydly-500 hover:underline cursor-pointer">
                Politique de confidentialité
              </a>.
            </p>
            <p className="text-slate-600 leading-relaxed mt-3">
              <strong>Autorité de contrôle :</strong> CNIL (Commission Nationale de l'Informatique et des Libertés)<br />
              3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-fydly-500 hover:underline">www.cnil.fr</a>
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">5. Cookies</h2>
            <p className="text-slate-600 leading-relaxed">
              Le site Fydly utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
              de la plateforme (authentification, gestion de session). Aucun cookie à des fins publicitaires
              ou de tracking n'est déposé. Pour plus de détails, consultez notre{' '}
              <a onClick={() => navigate('/privacy')} className="text-fydly-500 hover:underline cursor-pointer">
                Politique de confidentialité
              </a>.
            </p>
          </section>

          {/* Limitation de responsabilité */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">6. Limitation de responsabilité</h2>
            <p className="text-slate-600 leading-relaxed">
              Fydly s'efforce de fournir des informations aussi précises que possible. Toutefois,
              il ne saurait être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour
              de ces informations. Fydly ne pourra être tenu responsable des dommages directs ou indirects
              causés au matériel de l'utilisateur lors de l'accès au site, résultant de l'utilisation d'un matériel
              ne répondant pas aux spécifications requises ou de l'apparition d'un bug ou d'une incompatibilité.
            </p>
          </section>

          {/* Liens */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">7. Liens hypertextes</h2>
            <p className="text-slate-600 leading-relaxed">
              Le site Fydly peut contenir des liens vers d'autres sites internet. Fydly ne dispose d'aucun contrôle
              sur le contenu de ces sites et ne saurait être tenu responsable de leur contenu ou de leurs pratiques
              en matière de protection des données personnelles.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">8. Droit applicable</h2>
            <p className="text-slate-600 leading-relaxed">
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">© 2026 Fydly — Tous droits réservés</p>
      </footer>
    </div>
  );
}
