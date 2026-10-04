import type { BuilderFormValues, TemplateId } from './defaults'
import { escapeHtml } from './escape-html'
import { type Partner, isHttpsUrl } from './partners'

const messageParagraphStyle =
  'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1b1b20;margin:0 0 12px 0;'

const safeAddressLine = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br />')

type ImageSize = { width: number; height: number }

/** Natural pixel size of each logo image, keyed by its email src (see partnerLogoSrc). */
export type LogoDimensions = Record<string, ImageSize>

/**
 * Bounding box for a partner logo. Each logo is scaled to fit inside it at its
 * own aspect ratio, so every logo gets the same visual weight without empty
 * padding around square ones. Two wide logos fit on one row in the horizontal and
 * executive templates; the narrower card template stacks them.
 */
const PARTNER_LOGO_BOX: ImageSize = { width: 220, height: 110 }

const CLOUDINARY_UPLOAD_PATTERN =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+?)(\.[a-z0-9]+)?$/i

/**
 * The URL a partner logo is embedded with. Cloudinary uploads are trimmed of
 * blank margins, fitted to the 2x box and delivered as PNG (SVG isn't supported
 * by Gmail/Outlook). Other URLs are used as-is.
 */
export const partnerLogoSrc = (imageUrl: string) => {
  const match = CLOUDINARY_UPLOAD_PATTERN.exec(imageUrl)
  if (!match) {
    return imageUrl
  }

  const fit = `c_fit,w_${PARTNER_LOGO_BOX.width * 2},h_${PARTNER_LOGO_BOX.height * 2},q_auto`
  return `${match[1]}e_trim/${fit}/${match[2]}.png`
}

const fitInBox = (natural: ImageSize, box: ImageSize): ImageSize => {
  const scale = Math.min(box.width / natural.width, box.height / natural.height)
  return {
    width: Math.max(1, Math.round(natural.width * scale)),
    height: Math.max(1, Math.round(natural.height * scale)),
  }
}

/**
 * Logos get explicit width/height once their size is known (Outlook ignores CSS
 * sizing); until then they fall back to the box height with auto width.
 */
const partnerLogoHtml = (partner: Partner, logoDimensions: LogoDimensions, centered: boolean) => {
  const src = partnerLogoSrc(partner.imageUrl)
  const natural = logoDimensions[src]
  const box = PARTNER_LOGO_BOX
  const size = natural ? fitInBox(natural, box) : null
  const sizeAttributes = size ? `width="${size.width}" height="${size.height}"` : `height="${box.height}"`
  const sizeStyle = size
    ? `width:${size.width}px;height:${size.height}px;`
    : `width:auto;height:${box.height}px;max-width:${box.width}px;`
  const outerPadding = centered ? '0 10px 12px 10px' : '0 20px 12px 0'

  return `<span style="display:inline-block;vertical-align:middle;padding:${outerPadding};"><img src="${escapeHtml(src)}" alt="${escapeHtml(partner.name)}" title="${escapeHtml(partner.name)}" ${sizeAttributes} style="display:block;border:0;outline:none;text-decoration:none;${sizeStyle}font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:1.3;color:#1a2f7a;" /></span>`
}

const partnersSectionHtml = (
  partners: Partner[],
  logoDimensions: LogoDimensions,
  { centered = false, divider = true }: { centered?: boolean; divider?: boolean } = {},
) => {
  const visiblePartners = partners.filter(
    (partner) => partner.enabled && partner.name.trim() !== '' && isHttpsUrl(partner.imageUrl),
  )

  if (visiblePartners.length === 0) {
    return ''
  }

  const align = centered ? 'center' : 'left'

  return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td align="${align}" style="text-align:${align};${divider ? 'border-top:1px solid #e8e4ef;' : ''}padding:14px 0 0 0;font-size:0;line-height:0;">
            ${visiblePartners.map((partner) => partnerLogoHtml(partner, logoDimensions, centered)).join('')}
          </td>
        </tr>
      </table>`
}

const brandBarHtml = (colspan?: number) => `
  <tr>
    <td${colspan ? ` colspan="${colspan}"` : ''} style="padding:16px 0 0 0;font-size:0;line-height:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td width="64" style="width:64px;height:3px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td>
          <td style="height:3px;background-color:#1a2f7a;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>`

/** Orange badge icons (PNG, 2x) hosted on Cloudinary; SVG isn't supported by Gmail/Outlook. */
const CONTACT_ICONS = {
  website: { src: 'https://res.cloudinary.com/dmppnpaab/image/upload/v1791123797/mylc3and8n2afskwv8qa.png', alt: 'W' },
  address: { src: 'https://res.cloudinary.com/dmppnpaab/image/upload/v1791123798/vvyvndlerpncc6sncf3j.png', alt: 'A' },
  email: { src: 'https://res.cloudinary.com/dmppnpaab/image/upload/v1791123799/owfl2zgevotjqo5di4rd.png', alt: 'E' },
  phone: { src: 'https://res.cloudinary.com/dmppnpaab/image/upload/v1791123800/m4yc9rpoiwog2ob1uplw.png', alt: 'T' },
} as const

const CONTACT_ICON_SIZE = 22

/** One grid cell: icon on the left, its first text line centred against it (line-height = icon size). */
const contactCellHtml = (icon: keyof typeof CONTACT_ICONS, valueHtml: string, valueStyle = '') => `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
            <tr>
              <td width="${CONTACT_ICON_SIZE}" style="width:${CONTACT_ICON_SIZE}px;vertical-align:top;padding:0 8px 0 0;"><img src="${CONTACT_ICONS[icon].src}" alt="${CONTACT_ICONS[icon].alt}" width="${CONTACT_ICON_SIZE}" height="${CONTACT_ICON_SIZE}" style="display:block;border:0;outline:none;text-decoration:none;width:${CONTACT_ICON_SIZE}px;height:${CONTACT_ICON_SIZE}px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:${CONTACT_ICON_SIZE}px;color:#f47920;text-align:center;" /></td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:${CONTACT_ICON_SIZE}px;color:#454651;vertical-align:top;padding:0;mso-line-height-rule:exactly;${valueStyle}">${valueHtml}</td>
            </tr>
          </table>`

const phoneLinkHtml = (tel: string, display: string) =>
  `<a href="tel:${escapeHtml(tel)}" style="color:#1a2f7a;text-decoration:none;font-weight:600;letter-spacing:0.02em;white-space:nowrap;">${escapeHtml(display)}</a>`

/** 2x2 contact grid: website and address on the left, email and phone numbers on the right. */
const contactGridHtml = (params: BuilderFormValues) => {
  const phonesHtml = `${phoneLinkHtml(params.phone1Tel, params.phone1Display)}${
    params.showPhone2 ? `<br />${phoneLinkHtml(params.phone2Tel, params.phone2Display)}` : ''
  }`
  const addressHtml = params.showAddress
    ? contactCellHtml(
        'address',
        `${safeAddressLine(params.addressLine1)}<br />${safeAddressLine(params.addressLine2)}`,
        'font-size:10px;line-height:15px;color:#757682;padding-top:3px;',
      )
    : ''
  const leftCell = 'width:50%;vertical-align:top;padding:0 16px 10px 0;'
  const rightCell = 'width:50%;vertical-align:top;padding:0 0 10px 0;'

  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td width="50%" style="${leftCell}">${contactCellHtml(
            'website',
            `<a href="${escapeHtml(params.websiteUrl)}" style="color:#f47920;text-decoration:none;font-weight:700;">${escapeHtml(params.websiteLabel)}</a>`,
          )}</td>
          <td width="50%" style="${rightCell}">${contactCellHtml(
            'email',
            `<a href="mailto:${escapeHtml(params.email)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.email)}</a>`,
          )}</td>
        </tr>
        <tr>
          <td width="50%" style="${leftCell}">${addressHtml}</td>
          <td width="50%" style="${rightCell}">${contactCellHtml('phone', phonesHtml)}</td>
        </tr>
      </table>`
}

export function buildMessagePreviewHtml(body: string): string {
  const blocks = body
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return `<p style="${messageParagraphStyle}"></p>`
  }

  return blocks
    .map((block) => {
      const html = escapeHtml(block).replace(/\n/g, '<br />')
      return `<p style="${messageParagraphStyle}">${html}</p>`
    })
    .join('')
}

function buildHorizontalSignatureHtml(
  params: BuilderFormValues,
  partners: Partner[],
  logoDimensions: LogoDimensions,
): string {
  const partnersHtml = partnersSectionHtml(partners, logoDimensions)
  const partnersRowHtml = partnersHtml
    ? `
  <tr>
    <td colspan="3" style="padding:12px 0 0 0;">${partnersHtml}
    </td>
  </tr>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;max-width:540px;">
  <tr>
    <td width="180" align="center" style="width:180px;padding:0 20px 0 0;vertical-align:middle;">
      <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="160" height="48" style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:auto;max-width:160px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:1.3;color:#1a2f7a;" />
    </td>
    <td style="width:3px;padding:0;vertical-align:middle;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td>
    <td style="padding:2px 0 2px 20px;vertical-align:middle;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:1.25;color:#1a2f7a;padding:0 0 3px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;line-height:1.4;color:#454651;padding:0 0 8px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personTitle)}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.06em;line-height:1.35;color:#757682;padding:0;mso-line-height-rule:exactly;">${escapeHtml(params.companyName.toUpperCase())}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding:14px 0 0 0;font-size:0;line-height:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
        <tr><td style="border-top:1px solid #e8e4ef;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding:12px 0 0 0;">
      ${contactGridHtml(params)}
    </td>
  </tr>${partnersRowHtml}${brandBarHtml(3)}
</table>`
}

function buildCardSignatureHtml(
  params: BuilderFormValues,
  partners: Partner[],
  logoDimensions: LogoDimensions,
): string {
  const partnersHtml = partnersSectionHtml(partners, logoDimensions, { centered: true })
  const partnersRowHtml = partnersHtml
    ? `
              <tr>
                <td style="padding:14px 0 0 0;">${partnersHtml}
                </td>
              </tr>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;max-width:440px;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;border:1px solid #e8e4ef;background-color:#ffffff;">
        <tr>
          <td style="background-color:#1a2f7a;padding:0;font-size:0;line-height:0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr><td style="height:4px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="#fbf8ff" style="background-color:#fbf8ff;padding:16px 20px 14px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:0 0 12px 0;">
                  <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="170" height="51" style="display:block;border:0;outline:none;text-decoration:none;width:170px;height:auto;max-width:170px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:1.3;color:#1a2f7a;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;line-height:1.3;color:#1a2f7a;padding:0 0 3px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
              </tr>
              <tr>
                <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;line-height:1.45;color:#454651;padding:0 0 8px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personTitle)}</td>
              </tr>
              <tr>
                <td align="center" style="padding:0 0 10px 0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin:0 auto;">
                    <tr><td style="width:32px;height:2px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.06em;line-height:1.3;color:#1b1b20;padding:0 0 12px 0;mso-line-height-rule:exactly;">${escapeHtml(params.companyName.toUpperCase())}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 20px 16px 20px;background-color:#ffffff;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="border-top:1px solid #ebe8f3;padding:12px 0 0 0;">
                  ${contactGridHtml(params)}
                </td>
              </tr>${partnersRowHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:4px;background-color:#1a2f7a;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

function buildExecutiveSignatureHtml(
  params: BuilderFormValues,
  partners: Partner[],
  logoDimensions: LogoDimensions,
): string {
  const partnersHtml = partnersSectionHtml(partners, logoDimensions, { divider: false })
  const partnersRowHtml = partnersHtml
    ? `
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 20px 14px 20px;border:1px solid #e8e4ef;border-top:none;">${partnersHtml}
          </td>
        </tr>`
    : ''

  const phoneTwoHtml = params.showPhone2
    ? `
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#454651;padding:0;">
                        <a href="tel:${escapeHtml(params.phone2Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone2Display)}</a>
                      </td>
                    </tr>`
    : ''

  const addressHtml = params.showAddress
    ? `
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.5;color:#757682;">
                        ${safeAddressLine(params.addressLine1)}<br />${safeAddressLine(params.addressLine2)}
                      </td>
                    </tr>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;max-width:520px;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="height:4px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td bgcolor="#0d1f5c" style="background-color:#0d1f5c;padding:16px 20px 14px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;padding:0 16px 0 0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;background-color:#ffffff;border-radius:6px;">
                    <tr>
                      <td style="padding:8px 10px;">
                        <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="140" height="42" style="display:block;border:0;outline:none;text-decoration:none;width:140px;height:auto;max-width:140px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;line-height:1.3;color:#1a2f7a;" />
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;line-height:1.25;color:#ffffff;padding:0 0 3px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;line-height:1.4;color:#c8d0e8;padding:0;mso-line-height-rule:exactly;">${escapeHtml(params.personTitle)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="#1a2f7a" style="background-color:#1a2f7a;padding:10px 20px 12px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.05em;line-height:1.3;color:#ffffff;mso-line-height-rule:exactly;">${escapeHtml(params.companyName)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="#fbf8ff" style="background-color:#fbf8ff;padding:14px 20px 16px 20px;border:1px solid #e8e4ef;border-top:none;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td width="50%" style="vertical-align:top;padding:0 12px 0 0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;color:#1a2f7a;padding:0 0 6px 0;">WEB &amp; OFFICE</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;padding:0 0 8px 0;">
                        <a href="${escapeHtml(params.websiteUrl)}" style="color:#f47920;text-decoration:none;font-weight:700;">${escapeHtml(params.websiteLabel)}</a>
                      </td>
                    </tr>${addressHtml}
                  </table>
                </td>
                <td width="50%" style="vertical-align:top;padding:0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;color:#1a2f7a;padding:0 0 6px 0;">CONTACT</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#454651;padding:0 0 4px 0;">
                        <a href="mailto:${escapeHtml(params.email)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.email)}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#454651;padding:0 0 4px 0;">
                        <a href="tel:${escapeHtml(params.phone1Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone1Display)}</a>
                      </td>
                    </tr>${phoneTwoHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>${partnersRowHtml}
        <tr>
          <td style="height:4px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

/**
 * Drops the source indentation so the copied HTML stays well under Gmail's
 * 10,000-character signature limit. Only whitespace between tags is removed;
 * whitespace inside text is collapsed to a single space, so rendering is unchanged.
 */
const minifyHtml = (html: string) =>
  html
    .replace(/>\s+</g, '><')
    .replace(/\s*\n\s*/g, ' ')
    .trim()

export function buildSignatureHtml(
  templateId: TemplateId,
  params: BuilderFormValues,
  partners: Partner[] = [],
  logoDimensions: LogoDimensions = {},
): string {
  switch (templateId) {
    case 'card':
      return minifyHtml(buildCardSignatureHtml(params, partners, logoDimensions))
    case 'executive':
      return minifyHtml(buildExecutiveSignatureHtml(params, partners, logoDimensions))
    case 'horizontal':
    default:
      return minifyHtml(buildHorizontalSignatureHtml(params, partners, logoDimensions))
  }
}
