import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          Conditions Générales de Vente
        </h1>
        <p className="text-slate-400 text-sm font-medium mb-12">Dernière mise à jour : 11 mai 2026</p>

        <div className="prose prose-slate max-w-none space-y-10">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">1. Objet</h2>
            <p className="text-slate-600 leading-relaxed">
              Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les relations contractuelles
              entre <strong>Fydly</strong> (ci-après « le Prestataire ») et tout commerçant (ci-après « le Client »)
              souscrivant à un abonnement sur la plateforme Fydly. L'utilisation de la plateforme implique
              l'acceptation pleine et entière des présentes CGV.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">2. Services proposés</h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              Fydly est une plateforme SaaS de fidélisation digitale permettant aux commerçants de :
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5">
              <li>Créer et gérer un programme de fidélité dématérialisé (tampons digitaux)</li>
              <li>Générer un QR Code dynamique pour les clients</li>
              <li>Accéder à un tableau de bord avec analytics en temps réel</li>
              <li>Envoyer des notifications push aux clients</li>
              <li>Gérer leur base clients et segmenter leur audience</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">3. Inscription et compte</h2>
            <p className="text-slate-600 leading-relaxed">
              L'inscription est ouverte à tout professionnel disposant d'un numéro SIRET valide.
              Le Client s'engage à fournir des informations exactes et à jour. Chaque compte est personnel
              et le Client est responsable de la confidentialité de ses identifiants de connexion.
              Fydly se réserve le droit de suspendre ou supprimer tout compte en cas d'utilisation frauduleuse
              ou contraire aux présentes CGV.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">4. Tarifs et abonnements</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Offre Pro — 59,99 € / mois</h3>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>1 établissement · clients illimités</li>
                  <li>Notifications push illimitées</li>
                  <li>Analytics complets + IA</li>
                  <li>Segmentation clients (VIP / inactifs)</li>
                  <li>Support email sous 48h</li>
                </ul>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Offre Business — 109,99 € / mois</h3>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Jusqu'à 5 établissements</li>
                  <li>Dashboard centralisé multi-sites</li>
                  <li>API accès + personnalisation</li>
                  <li>Appel de lancement en visio (1h)</li>
                  <li>WhatsApp direct avec le fondateur</li>
                </ul>
              </div>
            </div>
            <p className="text-slate-600 text-sm mt-4">
              Les prix sont indiqués en euros TTC. Fydly se réserve le droit de modifier ses tarifs,
              avec notification préalable de 30 jours. Les tarifs en vigueur au moment de la souscription
              restent applicables jusqu'au prochain renouvellement.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">5. Période d'essai</h2>
            <p className="text-slate-600 leading-relaxed">
              Chaque nouvel abonnement bénéficie d'une <strong>période d'essai gratuite de 30 jours</strong>,
              sans engagement et sans carte bancaire. À l'issue de cette période, le Client peut choisir de
              souscrire à un abonnement payant ou de ne pas poursuivre. En l'absence de souscription, l'accès
              aux fonctionnalités premium est automatiquement désactivé.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">6. Paiement</h2>
            <p className="text-slate-600 leading-relaxed">
              Les paiements sont effectués par carte bancaire via notre prestataire de paiement sécurisé <strong>Stripe</strong>.
              L'abonnement est prélevé automatiquement chaque mois à la date anniversaire de la souscription.
              En cas d'échec de paiement, le Client dispose d'un délai de grâce de 7 jours pour régulariser sa situation.
              Passé ce délai, l'accès aux fonctionnalités premium peut être suspendu.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">7. Résiliation</h2>
            <p className="text-slate-600 leading-relaxed">
              Le Client peut résilier son abonnement à tout moment depuis son espace commerçant (section Facturation).
              La résiliation prend effet à la fin de la période d'abonnement en cours.
              Aucun remboursement au prorata ne sera effectué pour la période restante.
              Les données du Client sont conservées pendant 30 jours après la résiliation,
              puis supprimées de manière irréversible sauf obligation légale de conservation.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">8. Droit de rétractation</h2>
            <p className="text-slate-600 leading-relaxed">
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas
              aux contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé
              avec l'accord du consommateur. En acceptant les présentes CGV et en utilisant la plateforme,
              le Client renonce expressément à son droit de rétractation.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">9. Responsabilité</h2>
            <p className="text-slate-600 leading-relaxed">
              Fydly s'engage à fournir un service de qualité et à assurer la disponibilité de la plateforme
              dans la mesure du raisonnable. Toutefois, Fydly ne saurait être tenu responsable :
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5 mt-3">
              <li>Des interruptions de service dues à des maintenance programmées ou imprévues</li>
              <li>Des dommages indirects résultant de l'utilisation de la plateforme</li>
              <li>Des pertes de données dues à un cas de force majeure</li>
              <li>De l'utilisation frauduleuse du service par le Client ou ses utilisateurs</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">10. Propriété intellectuelle</h2>
            <p className="text-slate-600 leading-relaxed">
              L'ensemble des éléments de la plateforme Fydly (design, code, textes, logos, animations, marque)
              sont la propriété exclusive de Fydly et protégés par le droit de la propriété intellectuelle.
              Toute reproduction, modification ou utilisation non autorisée est interdite.
              Le Client conserve la propriété de ses données et contenus uploadés sur la plateforme.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">11. Données personnelles</h2>
            <p className="text-slate-600 leading-relaxed">
              Le traitement des données personnelles est détaillé dans notre{' '}
              <a onClick={() => navigate('/privacy')} className="text-fydly-500 hover:underline cursor-pointer">
                Politique de confidentialité
              </a>.
              Le Client s'engage à respecter le RGPD dans l'utilisation des données de ses propres clients
              collectées via la plateforme Fydly.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">12. Droit applicable et litiges</h2>
            <p className="text-slate-600 leading-relaxed">
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent
              à rechercher une solution amiable dans un délai de 30 jours. À défaut d'accord,
              le litige sera porté devant les tribunaux compétents du ressort du siège social du Prestataire.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-display font-bold text-slate-900 mb-3">13. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              Pour toute question relative aux présentes CGV :<br />
              Email : <a href="mailto:fydlypro@gmail.com" className="text-fydly-500 hover:underline">fydlypro@gmail.com</a>
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
