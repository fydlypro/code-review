const SECTOR_EMOJI: Record<string, string> = {
  'Restaurant':   '🍽️',
  'Boulangerie':  '🥐',
  'Coiffeur':     '✂️',
  'Boutique':     '🛍️',
  'Café':         '☕',
  'Salon de Thé': '🍵',
  'Beauté':       '💄',
  'Autre':        '🏪',
}

interface StampCardProps {
  merchantName: string;
  sector?: string;
  balance: number;
  threshold: number;
  newStamp?: boolean;
  rewardDescription?: string;
}

export default function StampCard({
  merchantName,
  sector,
  balance,
  threshold,
  newStamp = false,
  rewardDescription,
}: StampCardProps) {
  const percentage = Math.min(Math.round((balance / threshold) * 100), 100);
  const remaining = Math.max(threshold - balance, 0);
  const sectorEmoji = (sector && SECTOR_EMOJI[sector]) || '🏪';
  const isComplete = remaining === 0;

  const stamps = Array.from({ length: threshold }).map((_, i) => {
    const isFilled = i < balance;
    const isNew = newStamp && i === balance - 1;

    return (
      <div
        key={i}
        role="img"
        aria-label={isFilled ? `Tampon ${i + 1} validé` : `Tampon ${i + 1} non validé`}
        className={[
          'w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[2px] flex items-center justify-center',
          'transition-all duration-300',
          isFilled
            ? 'bg-fydly-500 border-fydly-400 shadow-[0_4px_14px_rgba(33,150,243,0.40)] text-white'
            : 'bg-fydly-50/80 border-fydly-100',
          isNew ? 'animate-bounce-stamp scale-110 shadow-[0_6px_20px_rgba(33,150,243,0.50)]' : '',
        ].join(' ')}
      >
        {isFilled ? (
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-fydly-700/10 rounded-full" />
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/35 shadow-inner" />
          </div>
        ) : (
          <div className="w-3 h-3 rounded-full border border-fydly-200/80" />
        )}
      </div>
    );
  });

  return (
    <div
      className={[
        'relative bg-white rounded-card shadow-card overflow-hidden',
        'p-6 sm:p-8 flex flex-col gap-7',
        'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-[2px]',
        'bg-gradient-to-br from-white via-white to-fydly-50/30',
      ].join(' ')}
    >
      {/* Top gradient bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-fydly-300 via-fydly-500 to-fydly-700 rounded-t-card" />

      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-fydly-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start pt-2">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl text-fydly-900 leading-tight truncate">
            {merchantName}
          </h2>
          {sector && (
            <span className="inline-block text-fydly-500 text-xs font-bold tracking-widest uppercase mt-1.5">
              {sector}
            </span>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 w-12 h-12 bg-gradient-to-br from-fydly-50 to-fydly-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-fydly-100/80">
          {sectorEmoji}
        </div>
      </div>

      {/* Stamps grid */}
      <div
        className="flex flex-wrap gap-2.5 sm:gap-3"
        role="group"
        aria-label={`Carte de fidélité : ${balance} tampons sur ${threshold}`}
      >
        {stamps}
      </div>

      {/* Progress */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-fydly-700">
            {balance}<span className="text-fydly-300 font-medium">/{threshold}</span>
            <span className="ml-1.5 text-fydly-400 font-medium text-xs">tampons</span>
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
            isComplete
              ? 'bg-emerald-100 text-emerald-700'
              : percentage >= 75
              ? 'bg-fydly-100 text-fydly-700'
              : 'bg-fydly-50 text-fydly-500'
          }`}>
            {percentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full bg-fydly-50 rounded-full overflow-hidden border border-fydly-100/60">
          <div
            className={[
              'h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden',
              isComplete
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-fydly-400 via-fydly-500 to-fydly-600',
            ].join(' ')}
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 animate-[shimmer_2.5s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Status message */}
        <p className={`text-[14px] font-medium mt-1 ${isComplete ? 'text-emerald-600' : 'text-fydly-500'}`}>
          {isComplete
            ? `Votre récompense est prête !${rewardDescription ? ` — ${rewardDescription}` : ''}`
            : rewardDescription
              ? `Plus que ${remaining} tampon${remaining > 1 ? 's' : ''} pour : ${rewardDescription}`
              : `Plus que ${remaining} tampon${remaining > 1 ? 's' : ''} pour votre récompense !`}
        </p>
      </div>
    </div>
  );
}
