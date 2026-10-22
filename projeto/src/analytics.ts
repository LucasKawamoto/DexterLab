type Consent = 'granted' | 'denied' | 'unset'

const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

export const trackingStatus = {
  googleAds: GOOGLE_ADS_ID ? 'configurado' : 'aguardando ID',
  metaPixel: META_PIXEL_ID ? 'configurado' : 'aguardando ID',
}

export function initializeAdvertisingTracking(consent: Consent) {
  if (consent !== 'granted') return
  // Integrações carregam somente depois do consentimento e quando IDs verificados existem.
  // Nenhum dado pessoal ou conteúdo de formulário é enviado.
  if (!GOOGLE_ADS_ID && !META_PIXEL_ID) return
}
