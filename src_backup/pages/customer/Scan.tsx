import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'
import { Camera, AlertCircle } from 'lucide-react'
import { validateQrToken, attributeStamp } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Scan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')
  const merchantParam = searchParams.get('m')
  
  const { session, customer, loading } = useAuth()
  
  const [isScanning, setIsScanning] = useState(!tokenParam)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  
  // Si on a un token via URL d'origine
  useEffect(() => {
    if (tokenParam && merchantParam && !loading) {
      processScannedQR(tokenParam, merchantParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam, merchantParam, loading])

  // Initialisation Scanner Camera
  useEffect(() => {
    if (!isScanning) return

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      false
    )
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        // decodedText = "https://fydly.app/scan?token=XYZ&m=ABC"
        try {
          const url = new URL(decodedText)
          const token = url.searchParams.get('token')
          const mId = url.searchParams.get('m')
          
          if (token && mId) {
            scanner.clear()
            setIsScanning(false)
            processScannedQR(token, mId)
          } else {
            toast.error("Format de QR code invalide.")
          }
        } catch (e) {
          toast.error("QR code illisible (URL requise).")
        }
      },
      (error) => {
        // Ignorer les avertissements de frame vide
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning])

  const processScannedQR = async (token: string, mId: string) => {
    try {
      const res = await validateQrToken(token, mId)
      
      if (!res.valid) {
        setErrorInfo("Ce QR code n'est plus valide. Demandez au commerçant le QR du jour.")
        return
      }

      // Sauvegarde params
      sessionStorage.setItem('fydly_pending_token', token)
      sessionStorage.setItem('fydly_pending_merchant_id', mId)
      if (res.merchantName) {
        sessionStorage.setItem('fydly_pending_merchant_name', res.merchantName)
      }

      // Client connecté ?
      if (session && customer) {
        // Upsert immédiat
        const stampRes = await attributeStamp({
          customerId: customer.id,
          merchantId: mId,
          qrTokenUsed: token
        })

        if (!stampRes.success) {
          if (stampRes.error === 'too_soon') {
            toast.error(`Vous avez déjà scanné récemment. Revenez dans ${stampRes.minutesLeft} minutes.`)
            navigate('/customer/card')
          } else {
            toast.error(stampRes.error || "Erreur lors de l'attribution du tampon.")
          }
          return
        }

        toast.success("+1 Tampon ajouté ! \uD83C\uDF89")
        navigate(`/customer/card?merchant=${mId}&new_stamp=true`)
      } else {
        // Redirection vers Auth
        navigate(`/customer/auth?token=${token}&m=${mId}`)
      }
    } catch (err: any) {
      setErrorInfo(err.message || 'Erreur inconnue.')
    }
  }

  return (
    <div className="min-h-screen bg-blue-700 text-white flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#1976D2' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-bold mb-2">Scanner le QR Code</h1>
          <p className="text-blue-100/80 text-sm">
            Placez le QR Code de votre commerçant dans le cadre pour gagner votre tampon.
          </p>
        </div>

        {errorInfo ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-200 mb-3" />
            <p className="text-white font-medium">{errorInfo}</p>
            <button 
              onClick={() => {
                setErrorInfo(null)
                setIsScanning(true)
              }}
              className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : (
          isScanning && (
            <div className="overflow-hidden rounded-2xl bg-black/20 shadow-xl border-4 border-white/10 relative">
              <div id="reader" className="w-full" />
              <style dangerouslySetInnerHTML={{ __html: `
                #reader__scan_region { background: black; }
                #reader__dashboard_section_csr span { color: white !important; }
                #reader__dashboard_section_csr button { display: none !important; }
                #reader a { color: white !important; }
              ` }} />
            </div>
          )
        )}
      </div>
    </div>
  )
}
