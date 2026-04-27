import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { AlertCircle, Zap, ScanLine, ChevronLeft } from 'lucide-react'
import { validateQrToken, attributeStamp } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { notifyRewardUnlocked } from '../../lib/notifications'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'

export default function Scan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')
  const merchantParam = searchParams.get('m')

  const { session, customer, loading: authLoading } = useAuth()

  const [isScanning, setIsScanning] = useState(!tokenParam)
  const [isProcessing, setIsProcessing] = useState(!!tokenParam)
  const [isLoaded, setIsLoaded] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const processedRef = useRef(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  // useCallback avec [session, customer] pour éviter la closure périmée :
  // sans ça, le premier render capture session=null et customer=null,
  // et même après l'auth le QR redirige vers /customer/auth.
  const processScannedQR = useCallback(async (token: string, mId: string) => {
    setIsProcessing(true)
    try {
      const res = await validateQrToken(token, mId)
      if (!res.valid) {
        setIsProcessing(false)
        setErrorInfo(res.error === 'invalid_or_expired_token'
          ? "Ce QR code n'est plus valide. Demandez au commerçant le QR du jour."
          : `Erreur de validation : ${res.error || 'inconnue'}`)
        return
      }

      sessionStorage.setItem('fydly_pending_token', token)
      sessionStorage.setItem('fydly_pending_merchant_id', mId)
      if (res.merchantName) sessionStorage.setItem('fydly_pending_merchant_name', res.merchantName)

      if (session && customer) {
        const stampRes = await attributeStamp({
          customerId: customer.id,
          merchantId: mId,
          qrTokenUsed: token
        })

        if (!stampRes.success) {
          setIsProcessing(false)
          if (stampRes.error === 'too_soon') {
            toast.error(`⏳ Déjà scanné ! Revenez dans ${stampRes.minutesLeft} min.`)
            navigate('/customer/card')
          } else if (stampRes.error === 'subscription_expired') {
            setErrorInfo("Ce commerce ne dispose plus d'un abonnement actif.")
          } else {
            setErrorInfo(`Impossible d'enregistrer votre tampon : ${stampRes.error || 'erreur inconnue'}`)
          }
          return
        }

        if (stampRes.rewardUnlocked && customer?.id) {
          notifyRewardUnlocked(customer.id, res.merchantName || 'votre commerce', stampRes.rewardDescription || 'votre récompense')
        }

        navigate(`/customer/card?merchant=${mId}&new_stamp=true`)
      } else {
        navigate(`/customer/auth?token=${token}&m=${mId}`)
      }
    } catch {
      setIsProcessing(false)
      setErrorInfo("Une erreur est survenue. Réessayez dans quelques instants.")
    }
  }, [session, customer, navigate])

  useEffect(() => {
    if (tokenParam && merchantParam && !authLoading) {
      processScannedQR(tokenParam, merchantParam)
    }
    // processScannedQR est inclus dans les deps pour éviter une closure périmée
    // sur session/customer (qui peuvent être null au premier rendu si auth est lente).
  }, [tokenParam, merchantParam, authLoading, processScannedQR])

  // Ref toujours à jour vers processScannedQR — utilisée dans handleScanSuccess
  // pour briser la dépendance circulaire scanFrame → handleScanSuccess → processScannedQR → scanFrame.
  const processScannedQRRef = useRef(processScannedQR)
  useEffect(() => { processScannedQRRef.current = processScannedQR }, [processScannedQR])

  // Scan loop using jsQR on canvas frames
  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code?.data) {
      handleScanSuccess(code.data)
      return
    }

    animFrameRef.current = requestAnimationFrame(scanFrame)
  }, [])

  useEffect(() => {
    if (!isScanning) return

    let stopped = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (stopped) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        trackRef.current = track

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch {
            // play() peut échouer (ex: interruption Safari) — libérer le stream immédiatement
            // pour éteindre le voyant caméra, puis afficher l'erreur.
            stream.getTracks().forEach(t => t.stop())
            streamRef.current = null
            trackRef.current = null
            if (!stopped) setErrorInfo("Impossible de démarrer la caméra. Réessayez.")
            return
          }
          setIsLoaded(true)
          animFrameRef.current = requestAnimationFrame(scanFrame)
        }

        // Check torch support
        const caps = track.getCapabilities?.() as any
        if (caps?.torch) setHasFlash(true)
      } catch {
        // getUserMedia a échoué (refus permission ou appareil indisponible)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        trackRef.current = null
        setErrorInfo("Autorisez l'accès à la caméra pour gagner vos tampons.")
      }
    }

    startCamera()

    return () => {
      stopped = true
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      trackRef.current = null
      setIsLoaded(false)
    }
  }, [isScanning, scanFrame])

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (processedRef.current) return
    processedRef.current = true

    // Stop scan loop immediately
    cancelAnimationFrame(animFrameRef.current)

    try {
      let token: string | null = null
      let mId: string | null = null

      try {
        const url = new URL(decodedText)
        token = url.searchParams.get('token')
        mId = url.searchParams.get('m')
      } catch {
        try {
          const url = new URL(decodedText, window.location.origin)
          token = url.searchParams.get('token')
          mId = url.searchParams.get('m')
        } catch {}
      }

      if (token && mId) {
        // Stop camera then process
        streamRef.current?.getTracks().forEach(t => t.stop())
        setIsScanning(false)
        processScannedQRRef.current(token, mId)
      } else {
        processedRef.current = false
        toast.error("Ce QR code n'est pas un code Fydly.")
        animFrameRef.current = requestAnimationFrame(scanFrame)
      }
    } catch {
      processedRef.current = false
      toast.error("QR code illisible. Réessayez.")
      animFrameRef.current = requestAnimationFrame(scanFrame)
    }
  }, [scanFrame])

  const toggleFlash = async () => {
    if (!trackRef.current || !hasFlash) return
    try {
      const newState = !isFlashOn
      await (trackRef.current as any).applyConstraints({ advanced: [{ torch: newState }] })
      setIsFlashOn(newState)
    } catch {}
  }

  /* ── ÉTAT : TRAITEMENT EN COURS ── */
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-fydly-700 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fydly-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative bg-white rounded-card shadow-modal w-full max-w-sm p-10 text-center">
          <div className="relative w-24 h-24 mx-auto mb-7">
            <div className="absolute inset-0 rounded-full bg-fydly-50 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-fydly-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-fydly-100 animate-[spin_8s_linear_infinite]" />
          </div>

          <h2 className="text-2xl font-display text-fydly-900 mb-2">
            Validation en cours…
          </h2>
          <p className="text-fydly-500 font-medium text-sm leading-relaxed">
            On enregistre votre tampon, encore une seconde !
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-fydly-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── ÉTAT : ERREUR ── */
  if (errorInfo) {
    return (
      <div className="min-h-screen bg-fydly-50 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="bg-white rounded-card shadow-modal w-full max-w-sm p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-red-400" />
          </div>

          <h2 className="text-2xl font-display text-fydly-900 mb-2">
            Un problème est survenu
          </h2>
          <p className="text-fydly-500 mb-8 leading-relaxed font-sans text-sm">
            {errorInfo}
          </p>

          <div className="flex flex-col gap-3">
            {session ? (
              <Button onClick={() => navigate('/customer/card')} className="w-full h-12">
                Voir ma carte
              </Button>
            ) : (
              <Button
                onClick={() => { setErrorInfo(null); processedRef.current = false; setIsScanning(true) }}
                className="w-full h-12"
              >
                Réessayer
              </Button>
            )}
            {session && (
              <button
                onClick={() => { setErrorInfo(null); processedRef.current = false; setIsScanning(true) }}
                className="text-fydly-500 text-sm font-semibold hover:text-fydly-700 transition-colors py-2"
              >
                Réessayer le scan
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── ÉTAT : SCAN CAMÉRA ── */
  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* Vidéo native — plein écran */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Canvas caché pour la détection jsQR */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay sombre semi-transparent avec trou central */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: 'calc(50% - 140px)' }} />
        <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: 'calc(50% - 140px)' }} />
        <div
          className="absolute bg-black/60"
          style={{ top: 'calc(50% - 140px)', left: 0, width: 'calc(50% - 140px)', height: '280px' }}
        />
        <div
          className="absolute bg-black/60"
          style={{ top: 'calc(50% - 140px)', right: 0, width: 'calc(50% - 140px)', height: '280px' }}
        />
      </div>

      {/* Cadre de scan (au centre) */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 280 }}
      >
        {[
          'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl',
          'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
          'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl',
          'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl',
        ].map((cls, i) => (
          <div
            key={i}
            className={`absolute w-12 h-12 border-white drop-shadow-[0_0_10px_rgba(147,197,253,0.8)] ${cls}`}
          />
        ))}

        <div className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_16px_rgba(96,165,250,1)] animate-scan" />
      </div>

      {/* Header flottant */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5"
        style={{ paddingTop: 'max(48px, calc(env(safe-area-inset-top, 0px) + 20px))' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/15 active:scale-95 transition-all"
          aria-label="Retour"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
          <ScanLine size={14} className="text-white" />
          <span className="text-white text-xs font-bold tracking-widest uppercase">Scanner</span>
        </div>

        {hasFlash && isLoaded ? (
          <button
            onClick={toggleFlash}
            aria-label="Torche"
            className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center border border-white/15 active:scale-95 transition-all
              ${isFlashOn ? 'bg-amber-400 border-amber-300' : 'bg-black/30 hover:bg-black/50'}`}
          >
            <Zap size={18} className={isFlashOn ? 'text-amber-900 fill-amber-900' : 'text-white'} />
          </button>
        ) : (
          <div className="w-11 h-11" aria-hidden />
        )}
      </div>

      {/* Instructions bas */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center px-8 text-center"
        style={{ paddingBottom: 'max(64px, calc(env(safe-area-inset-bottom, 0px) + 40px))' }}
      >
        <h2 className="text-white text-2xl font-display mb-2 drop-shadow-lg">
          Pointez vers le QR Code
        </h2>
        <p className="text-white/60 text-sm font-medium leading-relaxed max-w-[260px]">
          Placez le code dans le cadre —{' '}
          <span className="text-white/90 font-semibold">le tampon s'ajoute automatiquement</span>
        </p>

        {!isLoaded && (
          <div className="mt-6 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/15">
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            <span className="text-white/70 text-xs font-semibold">Activation caméra…</span>
          </div>
        )}
      </div>
    </div>
  )
}
