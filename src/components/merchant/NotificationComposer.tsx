import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Send, Users, AlertTriangle, Sparkles } from 'lucide-react';

interface NotificationComposerProps {
  onSend: (message: string, segment: 'all' | 'active' | 'inactive') => Promise<void>;
  activeClientsCount: number;
  inactiveClientsCount: number;
  className?: string;
}

export default function NotificationComposer({ 
  onSend, 
  activeClientsCount, 
  inactiveClientsCount,
  className = '' 
}: NotificationComposerProps) {
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    try {
      await onSend(message, segment);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className={`p-6 sm:p-8 flex flex-col gap-6 bg-white overflow-hidden shadow-modal ${className}`}
      variant="base"
    >
      <div className="flex items-center gap-4 border-b border-fydly-100 pb-5">
        <div className="w-12 h-12 rounded-xl bg-fydly-500 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(33,150,243,0.35)]">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="font-display text-xl sm:text-2xl text-fydly-900 leading-tight">
            Campagne Push
          </h3>
          <p className="text-fydly-400 text-xs font-semibold uppercase tracking-widest mt-1">
            ENVOYER UNE NOTIFICATION EN DIRECT
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-fydly-500 uppercase tracking-widest ml-1">
            Segment Cible
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSegment('all')}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl border-2 transition-all gap-1 min-h-[72px] ${
                segment === 'all' 
                  ? 'border-fydly-500 bg-fydly-50 text-fydly-900' 
                  : 'border-fydly-100 bg-white text-fydly-400 hover:border-fydly-200'
              }`}
            >
              <Users size={16} className="shrink-0" />
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center">Tous</span>
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center opacity-70">({activeClientsCount + inactiveClientsCount})</span>
            </button>
            <button
              onClick={() => setSegment('active')}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl border-2 transition-all gap-1 min-h-[72px] ${
                segment === 'active' 
                  ? 'border-success bg-success-light text-success' 
                  : 'border-fydly-100 bg-white text-fydly-400 hover:border-fydly-200'
              }`}
            >
              <Users size={16} className="shrink-0" />
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center">Actifs</span>
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center opacity-70">({activeClientsCount})</span>
            </button>
            <button
              onClick={() => setSegment('inactive')}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl border-2 transition-all gap-1 min-h-[72px] ${
                segment === 'inactive' 
                  ? 'border-warning-DEFAULT bg-warning-light text-warning-DEFAULT' 
                  : 'border-fydly-100 bg-white text-fydly-400 hover:border-fydly-200'
              }`}
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center">Inactifs</span>
              <span className="font-bold text-[10px] sm:text-xs leading-tight text-center opacity-70">({inactiveClientsCount})</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-fydly-800 uppercase tracking-[2px]">
                Message de la notification
              </span>
              <span className={`text-xs font-bold tabular-nums ${message.length > 120 ? message.length >= 140 ? 'text-error' : 'text-warning-DEFAULT' : 'text-fydly-300'}`}>
                {message.length}/140
              </span>
            </div>
            <Input
              placeholder="Ex: -20% sur votre prochain passage !"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={140}
              className="w-full"
            />
          </div>

          <div className="bg-fydly-50 rounded-xl p-4 border border-fydly-100 flex items-start gap-3">
            <div className="text-fydly-400 mt-0.5">💡</div>
            <p className="text-xs text-fydly-700 leading-relaxed font-medium italic opacity-70">
              Conseil : Les messages courts et avec des emojis obtiennent 30% d'engagement en plus.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSend}
          className="w-full mt-2 group"
          isLoading={isLoading}
          disabled={!message.trim()}
        >
          <div className="flex items-center justify-center gap-3">
            <span>Envoyer la campagne</span>
            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        </Button>
      </div>
    </Card>
  );
}
