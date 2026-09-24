export type Partner = {
  id: string
  name: string
  imageUrl: string
  enabled: boolean
}

export const PARTNERS_STORAGE_KEY = 'alfs-email-builder-partners'

export const MAX_PARTNER_IMAGE_BYTES = 5 * 1024 * 1024

export const ACCEPTED_PARTNER_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/gif',
]

const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']

export const PARTNER_IMAGE_ACCEPT = [
  ...ACCEPTED_PARTNER_IMAGE_TYPES,
  ...ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`),
].join(',')

export const createPartnerId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `partner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const isHttpsUrl = (value: string) => {
  try {
    return new URL(value.trim()).protocol === 'https:'
  } catch {
    return false
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

type PartnerCheck = { ok: true; partner: Partner } | { ok: false; error: string }

const checkPartner = (raw: unknown): PartnerCheck => {
  if (!isRecord(raw)) {
    return { ok: false, error: 'must be an object' }
  }

  const { id, name, imageUrl, enabled } = raw

  if (typeof id !== 'string' || id.trim() === '') {
    return { ok: false, error: '"id" must be a non-empty string' }
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return { ok: false, error: '"name" must be a non-empty string' }
  }
  if (typeof imageUrl !== 'string' || !isHttpsUrl(imageUrl)) {
    return { ok: false, error: '"imageUrl" must be an https:// URL' }
  }
  if (typeof enabled !== 'boolean') {
    return { ok: false, error: '"enabled" must be true or false' }
  }

  return {
    ok: true,
    partner: { id: id.trim(), name: name.trim(), imageUrl: imageUrl.trim(), enabled },
  }
}

/**
 * Reads the saved partners list. Invalid records are skipped individually so
 * one bad entry never wipes out the rest; unreadable storage yields [].
 */
export const loadPartners = (): Partner[] => {
  try {
    const stored = window.localStorage.getItem(PARTNERS_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    const seenIds = new Set<string>()
    const partners: Partner[] = []
    for (const raw of parsed) {
      const result = checkPartner(raw)
      if (result.ok && !seenIds.has(result.partner.id)) {
        seenIds.add(result.partner.id)
        partners.push(result.partner)
      }
    }
    return partners
  } catch {
    return []
  }
}

export const savePartners = (partners: Partner[]): boolean => {
  try {
    window.localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners))
    return true
  } catch {
    return false
  }
}

export const serializePartners = (partners: Partner[]) =>
  JSON.stringify(
    partners.map(({ id, name, imageUrl, enabled }) => ({ id, name, imageUrl, enabled })),
    null,
    2,
  )

export type ParsePartnersResult =
  | { ok: true; partners: Partner[] }
  | { ok: false; error: string }

/** Strictly validates an exported partners JSON list before it is imported. */
export const parsePartnersJson = (text: string): ParsePartnersResult => {
  if (text.trim() === '') {
    return { ok: false, error: 'Paste the exported partners JSON first.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This is not valid JSON. Paste the list exactly as it was copied.' }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Expected a JSON array of partners, e.g. [{ "id": … }].' }
  }

  const seenIds = new Set<string>()
  const partners: Partner[] = []
  for (const [index, raw] of parsed.entries()) {
    const result = checkPartner(raw)
    if (!result.ok) {
      return { ok: false, error: `Partner #${index + 1}: ${result.error}.` }
    }
    if (seenIds.has(result.partner.id)) {
      return { ok: false, error: `Partner #${index + 1}: duplicate id "${result.partner.id}".` }
    }
    seenIds.add(result.partner.id)
    partners.push(result.partner)
  }

  return { ok: true, partners }
}

/** Returns an error message, or null when the file can be uploaded. */
export const validatePartnerImageFile = (file: File): string | null => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const typeAccepted = file.type
    ? ACCEPTED_PARTNER_IMAGE_TYPES.includes(file.type)
    : ACCEPTED_EXTENSIONS.includes(extension)

  if (!typeAccepted) {
    return 'Unsupported file type. Use PNG, JPG, SVG, WebP or GIF.'
  }
  if (file.size === 0) {
    return 'This file is empty.'
  }
  if (file.size > MAX_PARTNER_IMAGE_BYTES) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return `This image is ${sizeMb} MB. The maximum is ${MAX_PARTNER_IMAGE_BYTES / 1024 / 1024} MB.`
  }
  return null
}

export const partnerNameFromFile = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()

const cloudinaryConfig = () => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() ?? ''
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() ?? ''
  return { cloudName, uploadPreset }
}

export const isCloudinaryConfigured = () => {
  const { cloudName, uploadPreset } = cloudinaryConfig()
  return cloudName !== '' && uploadPreset !== ''
}

/**
 * Uploads an image with an unsigned preset and resolves with its secure_url.
 * Uses XHR (not fetch) so upload progress can be reported.
 */
export const uploadPartnerImage = (
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> => {
  const { cloudName, uploadPreset } = cloudinaryConfig()

  if (!cloudName || !uploadPreset) {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
      ),
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    )

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    request.onload = () => {
      let body: unknown = null
      try {
        body = JSON.parse(request.responseText)
      } catch {
        // handled below
      }

      if (request.status >= 200 && request.status < 300) {
        const secureUrl = isRecord(body) ? body.secure_url : undefined
        if (typeof secureUrl === 'string' && isHttpsUrl(secureUrl)) {
          onProgress(100)
          resolve(secureUrl)
          return
        }
        reject(new Error('Cloudinary did not return an image URL.'))
        return
      }

      const cloudinaryMessage =
        isRecord(body) && isRecord(body.error) && typeof body.error.message === 'string'
          ? body.error.message
          : null
      reject(
        new Error(
          cloudinaryMessage
            ? `Upload failed: ${cloudinaryMessage}`
            : `Upload failed (HTTP ${request.status}).`,
        ),
      )
    }

    request.onerror = () =>
      reject(new Error('Network error while uploading. Check your connection and try again.'))
    request.ontimeout = () => reject(new Error('The upload timed out. Please try again.'))
    request.timeout = 60_000

    request.send(formData)
  })
}
