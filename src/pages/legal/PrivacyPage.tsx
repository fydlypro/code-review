import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pt-[100px] pb-20">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-4">
          Politique de confidentialité
        </h1>
        <p className="text-slate-400 text-sm font-medium mb-12">Dernière mise à jour : 11 mai 2026</p>

        <div className="prose prose-slate max-w-none space-y-10">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
            <p className="text-slate-600 leading-relaxed">
              Le responsable du traitement des données personnelles collectées via la plateforme Fydly est :<br />
              <strong>Fydly</strong> — Micro-entreprise<br />
              Email : <a href="mailto:fydlypro@gmail.com" className="text-fydly-500 hover:underline">fydlypro@gmail.com</a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">2. Données collectées</h2>
            <p className="text-slate-600 leading-relaxed mb-3">Dans le cadre de l'utilisation de la plateforme Fydly, nous collectons les données suivantes :</p>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">👤 Clients (utilisateurs finaux)</h3>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Numéro de téléphone (authentification par OTP)</li>
                  <li>Prénom et nom (optionnel)</li>
                  <li>Historique des tampons et récompenses</li>
                  <li>Date et heure des visites</li>
                  <li>Identifiant de session et données techniques (navigateur, appareil)</li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">🏪 Commerçants</h3>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Nom du commerce, adresse, secteur d'activité</li>
                  <li>Nom et prénom du gérant</li>
                  <li>Adresse email et numéro de téléphone</li>
                  <li>Données de facturation (via Stripe)</li>
                  <li>Données d'utilisation de la plateforme</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">3. Finalités du traitement</h2>
            <p className="text-slate-600 leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Authentifier les utilisateurs par SMS (OTP)</li>
              <li>Permettre le fonctionnement du programme de fidélité (tampons, récompenses)</li>
              <li>Fournir des statistiques et analytics aux commerçants</li>
              <li>Envoyer des notifications de relance et communications marketing (avec consentement)</li>
              <li>Gérer la facturation et les abonnements</li>
              <li>Améliorer la plateforme et l'expérience utilisateur</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">4. Base juridique</h2>
            <p className="text-slate-600 leading-relaxed">
              Les traitements de données reposent sur les bases juridiques suivantes (RGPD, Art. 6) :
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5 mt-3">
              <li><strong>Exécution du contrat</strong> : gestion des comptes, programme de fidélité, facturation</li>
              <li><strong>Consentement</strong> : notifications marketing, cookies non essentiels</li>
              <li><strong>Intérêt légitime</strong> : amélioration de la plateforme, sécurité, analytics agrégés</li>
              <li><strong>Obligation légale</strong> : conservation des données de facturation</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">5. Partage des données</h2>
            <p className="text-slate-600 leading-relaxed mb-3">Vos données ne sont <strong>jamais vendues</strong>. Elles peuvent être partagées avec :</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5">
              <li><strong>Supabase</strong> (hébergement et base de données) — serveurs UE</li>
              <li><strong>Stripe</strong> (paiement sécurisé) — certifié PCI-DSS</li>
              <li><strong>Twilio</strong> (envoi de SMS OTP) — données minimales</li>
              <li><strong>Vercel</strong> (hébergement du site) — infrastructure mondiale CDN</li>
            </ul>
            <p className="text-slate-500 text-sm mt-3">
              Tous nos sous-traitants respectent le RGPD et disposent de clauses contractuelles appropriées.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">6. Durée de conservation</h2>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5">
              <li>Données de compte client : conservées tant que le compte est actif, puis 3 ans après la dernière activité</li>
              <li>Données de compte commerçant : conservées pendant la durée de l'abonnement, puis 5 ans (obligations comptables)</li>
              <li>Données de facturation : 10 ans (obligations légales)</li>
              <li>Logs techniques : 12 mois</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">7. Cookies</h2>
            <p className="text-slate-600 leading-relaxed">
              Fydly utilise uniquement des <strong>cookies strictement nécessaires</strong> au fonctionnement de la plateforme 
              (authentification, session). Nous n'utilisons <strong>aucun cookie publicitaire ni de tracking tiers</strong>.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">8. Vos droits (RGPD)</h2>
            <p className="text-slate-600 leading-relaxed mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { right: 'Droit d\'accès', desc: 'Obtenir une copie de vos données' },
                { right: 'Droit de rectification', desc: 'Corriger vos données inexactes' },
                { right: 'Droit à l\'effacement', desc: 'Supprimer vos données personnelles' },
                { right: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré' },
                { right: 'Droit d\'opposition', desc: 'Vous opposer au traitement marketing' },
                { right: 'Droit à la limitation', desc: 'Restreindre le traitement de vos données' },
              ].map((item, i) => (
                <div key={i} className="bg-fydly-50 rounded-xl p-4 border border-fydly-100">
                  <p className="text-sm font-bold text-slate-900">{item.right}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-sm mt-4">
              Pour exercer vos droits, contactez-nous à{' '}
              <a href="mailto:fydlypro@gmail.com" className="text-fydly-500 hover:underline">fydlypro@gmail.com</a>.
              Nous répondons sous 30 jours maximum.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">9. Sécurité</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
              chiffrement des données en transit (TLS/HTTPS), authentification sécurisée, tokens dynamiques à durée limitée,
              accès restreint aux données, et surveillance continue de la plateforme.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">10. Modifications</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
              En cas de modification substantielle, les utilisateurs seront informés par email ou notification sur la plateforme.
              La date de dernière mise à jour figure en haut de cette page.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">11. Contact & Réclamation</h2>
            <p className="text-slate-600 leading-relaxed">
              Pour toute question relative à la protection de vos données, contactez-nous à{' '}
              <a href="mailto:fydlypro@gmail.com" className="text-fydly-500 hover:underline">fydlypro@gmail.com</a>.<br /><br />
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la{' '}
              <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-fydly-500 hover:underline">www.cnil.fr</a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer mini */}
      <footer className="border-t border-slate-100 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">© 2026 Fydly — Tous droits réservés</p>
      </footer>
    </div>
  );
}
