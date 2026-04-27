import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import confetti from 'canvas-confetti'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, LoyaltyCard, Merchant, Reward } from '../../lib/supabase'

type PopulatedCard = LoyaltyCard & { merchants: Pick<Merchant, 'name' | 'reward_threshold' | 'reward_description'> }

export default function Card() {
  const { customer } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const merchantParam = searchParams.get('merchant')
  const newStampParam = searchParams.get('new_stamp')
  
  const [cards, setCards] = useState<PopulatedCard[]>([])
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all cards for this customer
      const { data: cardsData, error: cardsError } = await supabase
        .from('loyalty_cards')
        .select(`
          *,
          merchants (name, reward_threshold, reward_description)
        `)
        .eq('customer_id', customer!.id)
        .order('last_scan_at', { ascending: false })

      if (cardsError) throw cardsError
      setCards(cardsData || [])

      // Load available rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('customer_id', customer!.id)
        .eq('status', 'available')
        
      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])

      // Set active card based on URL param or most recent
      if (merchantParam && cardsData) {
        const idx = cardsData.findIndex(c => c.merchant_id === merchantParam)
        if (idx !== -1) setActiveCardIndex(idx)
      } else if (cardsData && cardsData.length > 0) {
        setActiveCardIndex(0)
      }

      // Check for animation trigger
      if (newStampParam === 'true') {
        triggerConfetti()
        // Clean up URL so refresh doesn't replay animation
        window.history.replaceState({}, document.title, window.location.pathname)
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  
  // Realtime subscription for UI updates
  useEffect(() => {
    if (!customer) return
    
    const sub = supabase.channel('customer_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards', filter: `customer_id=eq.${customer.id}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards', filter: `customer_id=eq.${customer.id}` }, () => {
        loadData()
      })
      .subscribe()
      
    return () => { supabase.removeChannel(sub) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  const triggerConfetti = () => {
    const end = Date.now() + 2 * 1000
    const colors = ['#2196F3', '#FFC107', '#4CAF50']

    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) requestAnimationFrame(frame)
    }())
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="spinner border-blue-500 w-8 h-8" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🪪</span>
        </div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">Aucune carte de fidélité</h2>
        <p className="text-blue-700 mb-8 max-w-sm">Vous n'avez pas encore scanné de QR code chez nos commerçants partenaires.</p>
        <button 
          onClick={() => navigate('/scan')}
          className="bg-blue-500 text-white rounded-xl px-6 py-3 font-medium hover:bg-blue-600 shadow-md transition-all w-full max-w-xs"
        >
          Scanner un QR Code
        </button>
      </div>
    )
  }

  const activeCard = cards[activeCardIndex]
  const merchantReward = rewards.find(r => r.merchant_id === activeCard.merchant_id)

  const threshold = activeCard.merchants.reward_threshold || 10
  const renderedStamps = []
  
  for (let i = 0; i < threshold; i++) {
    const isStamped = i < activeCard.balance
    renderedStamps.push(
      <div 
        key={i} 
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border-2 transition-all duration-300
          ${isStamped ? 'bg-blue-100 border-blue-500 text-blue-500' : 'bg-white border-blue-100 text-transparent'}
        `}
      >
        <span className="text-2xl">{isStamped ? '🟡' : '·'}</span>
      </div>
    )
  }
  
  const stampsRemaining = threshold - activeCard.balance

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Multi-cards selector (Optional, simple dot indicator if many cards) */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
          {cards.map((card, idx) => (
             <button 
               key={card.id}
               onClick={() => setActiveCardIndex(idx)}
               className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                 ${idx === activeCardIndex ? 'bg-blue-900 text-white' : 'bg-white text-blue-700 border border-blue-200'}
               `}
             >
               {card.merchants.name}
             </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {merchantReward ? (
        // REWARD UNLOCKED UI
        <div className="flex-1 bg-[#0D47A1] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg transform transition-all hover:scale-[1.01]">
          <span className="text-5xl mb-4">🎁</span>
          <h2 className="text-2xl font-bold text-white mb-2">Récompense débloquée !</h2>
          <p className="text-blue-200 mb-8 max-w-xs leading-tight">
            Montrez ce QR code au commerçant pour utiliser votre <strong>{activeCard.merchants.reward_description}</strong>.
          </p>
          
          <div className="bg-white p-6 rounded-2xl shadow-inner mb-6">
             <QRCodeSVG 
               value={merchantReward.reward_qr_token} 
               size={200}
               level="H"
               fgColor="#000000"
               bgColor="#ffffff"
             />
          </div>
          
          <p className="text-sm font-medium text-blue-300">
            Expire le {new Date(merchantReward.expires_at).toLocaleDateString()}
          </p>
        </div>
      ) : (
        // STANDARD CARD UI
        <div className="flex-1 rounded-3xl bg-white shadow-[0_2px_12px_rgba(25,118,210,0.10)] p-6 border border-blue-50 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-8 z-10">
            <div>
              <h2 className="text-2xl font-bold text-[#0D47A1] leading-tight">{activeCard.merchants.name}</h2>
              <p className="text-sm font-medium text-[#1976D2] mt-1">Carte de fidélité</p>
            </div>
            {newStampParam === 'true' && (
               <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm animate-bounce shadow-sm">
                 +1 Tampon
               </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6 z-10">
             <div className="flex flex-wrap justify-center gap-4">
                {renderedStamps}
             </div>
          </div>
          
          {/* Progress bar and CTA */}
          <div className="mt-8 z-10 w-full bg-blue-50 rounded-2xl p-4 flex flex-col gap-3">
             <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#2196F3] h-full transition-all duration-700 ease-out" 
                  style={{ width: `${(activeCard.balance / threshold) * 100}%` }}
                />
             </div>
             <p className="text-center text-[#1565C0] text-sm font-medium">
               Plus que {stampsRemaining} tampon{stampsRemaining > 1 ? 's' : ''} pour votre <br/>
               <strong className="text-[#0D47A1]">{activeCard.merchants.reward_description}</strong>
             </p>
          </div>
        </div>
      )}

    </div>
  )
}
