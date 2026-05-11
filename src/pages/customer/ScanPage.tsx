import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { AlertCircle, Zap, ScanLine, ChevronLeft } from 'lucide-react'
import { validateQrToken, attributeStamp } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { notifyRewardUnlocked } from '../../lib/notifications'
import toast from 'react-hot-toast'

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
  }, [tokenParam, merchantParam, authLoading, processScannedQR])

  const processScannedQRRef = useRef(processScannedQR)
  useEffect(() => { processScannedQRRef.current = processScannedQR }, [processScannedQR])

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
            stream.getTracks().forEach(t => t.stop())
            streamRef.current = null
            trackRef.current = null
            if (!stopped) setErrorInfo("Impossible de démarrer la caméra. Réessayez.")
            return
          }
          setIsLoaded(true)
          animFrameRef.current = requestAnimationFrame(scanFrame)
        }

        const caps = track.getCapabilities?.() as any
        if (caps?.torch) setHasFlash(true)
      } catch {
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
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1E3A8A, #1E40AF)' }}
      >
        {/* Blob central */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 320, height: 320,
            borderRadius: '50%',
            background: 'rgba(96,165,250,0.3)',
            filter: 'blur(70px)',
          }}
        />

        {/* Card blanche */}
        <div
          className="relative bg-white shadow-2xl text-center z-10"
          style={{ width: 300, borderRadius: 28, padding: 32 }}
        >
          {/* Double spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            {/* Cercle extérieur dashed */}
            <div
              className="absolute inset-0 rounded-full animate-spin-rev-slow"
              style={{
                border: '3px dashed rgba(147,197,253,0.3)',
              }}
            />
            {/* Cercle intérieur spinner */}
            <div
              className="absolute rounded-full animate-spin"
              style={{
                inset: 8,
                border: '4px solid #2563EB',
                borderTopColor: 'transparent',
              }}
            />
          </div>

          <h3
            className="text-slate-900 font-display font-bold mb-2"
            style={{ fontSize: 20 }}
          >
            Validation en cours…
          </h3>
          <p className="text-slate-500 mb-6" style={{ fontSize: 13 }}>
            On enregistre votre tampon !
          </p>

          {/* 3 dots bounce */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fydly-500 animate-dot-bounce" />
            <div className="w-2 h-2 rounded-full bg-fydly-500 animate-dot-bounce-1" />
            <div className="w-2 h-2 rounded-full bg-fydly-500 animate-dot-bounce-2" />
          </div>
        </div>
      </div>
    )
  }

  /* ── ÉTAT : ERREUR ── */
  if (errorInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div
          className="bg-white shadow-xl text-center"
          style={{ borderRadius: 28, padding: 28, width: '100%', maxWidth: 340 }}
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={36} className="text-red-400" />
          </div>

          <h3
            className="text-slate-900 font-display font-bold mb-3"
            style={{ fontSize: 22 }}
          >
            Un problème est survenu
          </h3>
          <p
            className="text-slate-600 mb-7 leading-relaxed"
            style={{ fontSize: 13 }}
          >
            {errorInfo}
          </p>

          <div className="flex flex-col gap-3">
            {session ? (
              <>
                <button
                  onClick={() => navigate('/customer/card')}
                  className="w-full bg-gradient-bv text-white font-bold rounded-btn active:scale-[0.98] transition-all"
                  style={{ height: 52 }}
                >
                  Voir ma carte
                </button>
                <button
                  onClick={() => { setErrorInfo(null); processedRef.current = false; setIsScanning(true) }}
                  className="w-full border-2 border-slate-200 text-slate-700 font-semibold rounded-btn active:scale-[0.98] transition-all bg-white"
                  style={{ height: 52 }}
                >
                  Réessayer le scan
                </button>
              </>
            ) : (
              <button
                onClick={() => { setErrorInfo(null); processedRef.current = false; setIsScanning(true) }}
                className="w-full bg-gradient-bv text-white font-bold rounded-btn active:scale-[0.98] transition-all"
                style={{ height: 52 }}
              >
                Réessayer
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

      {/* Vidéo caméra plein écran */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Canvas caché jsQR */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, transparent 100px, rgba(0,0,0,0.65) 220px)',
        }}
      />

      {/* Scan frame 240×240px centré */}
      <div
        className="absolute z-20 pointer-events-none"
        style={{
          width: 240,
          height: 240,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.8))',
        }}
      >
        {/* Coin haut-gauche */}
        <div
          className="absolute"
          style={{
            top: 0, left: 0,
            width: 40, height: 40,
            borderTop: '3px solid white',
            borderLeft: '3px solid white',
            borderTopLeftRadius: 16,
          }}
        />
        {/* Coin haut-droit */}
        <div
          className="absolute"
          style={{
            top: 0, right: 0,
            width: 40, height: 40,
            borderTop: '3px solid white',
            borderRight: '3px solid white',
            borderTopRightRadius: 16,
          }}
        />
        {/* Coin bas-gauche */}
        <div
          className="absolute"
          style={{
            bottom: 0, left: 0,
            width: 40, height: 40,
            borderBottom: '3px solid white',
            borderLeft: '3px solid white',
            borderBottomLeftRadius: 16,
          }}
        />
        {/* Coin bas-droit */}
        <div
          className="absolute"
          style={{
            bottom: 0, right: 0,
            width: 40, height: 40,
            borderBottom: '3px solid white',
            borderRight: '3px solid white',
            borderBottomRightRadius: 16,
          }}
        />

        {/* Dot grid subtle */}
        <div
          className="absolute"
          style={{
            inset: 8,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.05,
          }}
        />

        {/* Scan line animée */}
        <div
          className="absolute animate-scan"
          style={{
            left: 8,
            right: 8,
            top: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)',
            boxShadow: '0 0 20px rgba(96,165,250,1)',
            borderRadius: 2,
          }}
        />
      </div>

      {/* Header flottant */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(48px, calc(env(safe-area-inset-top, 0px) + 20px))' }}
      >
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-95 transition-all border"
          style={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.15)',
          }}
          aria-label="Retour"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Badge SCANNER */}
        <div
          className="flex items-center gap-2 border px-4 py-2 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <ScanLine size={14} className="text-white" />
          <span className="text-white font-bold tracking-widest uppercase" style={{ fontSize: 10 }}>
            SCANNER
          </span>
        </div>

        {/* Bouton torche */}
        {hasFlash && isLoaded ? (
          <button
            onClick={toggleFlash}
            aria-label="Torche"
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all border"
            style={isFlashOn ? {
              background: '#FBBF24',
              borderColor: '#FCD34D',
            } : {
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Zap
              size={18}
              className={isFlashOn ? 'text-amber-900 fill-amber-900' : 'text-white'}
              fill={isFlashOn ? '#78350F' : 'none'}
            />
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
        <h3 className="text-white font-display font-bold mb-2 drop-shadow-lg" style={{ fontSize: 22 }}>
          Pointez vers le QR Code
        </h3>
        <p className="mb-4" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
          Placez le code dans le cadre pour gagner votre tampon
        </p>

        {/* Pill état caméra */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {isLoaded ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white font-semibold" style={{ fontSize: 11 }}>Caméra active</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'white' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>Activation caméra…</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
