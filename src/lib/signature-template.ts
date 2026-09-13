import type { BuilderFormValues, TemplateId } from './defaults'
import { escapeHtml } from './escape-html'

const messageParagraphStyle =
  'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1b1b20;margin:0 0 12px 0;'

const safeAddressLine = (value: string) => escapeHtml(value).replace(/\r?\n/g, '<br />')

const addressFull = (params: BuilderFormValues) =>
  `${escapeHtml(params.addressLine1)} ${escapeHtml(params.addressLine2)}`.trim()

const fiataMembershipHtml = (width: number, centered = false) => `
  <table${centered ? ' align="center"' : ''} cellpadding="0" cellspacing="0" border="0" width="${width}" role="presentation" style="border-collapse:collapse;width:${width}px;">
    <tr>
      <td align="center" style="font-family:Arial,Helvetica,sans-serif;padding:5px 0 0 0;mso-line-height-rule:exactly;">
        <table align="center" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
          <tr>
            <td style="border-bottom:3px solid #f47920;color:#1a2f7a;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.07em;line-height:1.2;padding:0 3px 2px 3px;text-transform:uppercase;mso-line-height-rule:exactly;">FIATA Member</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="color:#5c6374;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:600;line-height:1.2;padding:5px 0 0 0;mso-line-height-rule:exactly;">
        International Federation of Freight Forwarders Associations
      </td>
    </tr>
  </table>`

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

function buildHorizontalSignatureHtml(params: BuilderFormValues): string {
  const phoneTwoHtml = params.showPhone2
    ? `
            <span style="color:#c5c5d3;">&nbsp;/&nbsp;</span>
            <a href="tel:${escapeHtml(params.phone2Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone2Display)}</a>`
    : ''

  const addressHtml = params.showAddress
    ? `
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.55;color:#757682;padding:4px 0 0 0;mso-line-height-rule:exactly;">
            ${safeAddressLine(params.addressLine1)}<br />${safeAddressLine(params.addressLine2)}
          </td>
        </tr>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;max-width:520px;">
  <tr>
    <td width="170" align="center" style="padding:0 20px 0 0;vertical-align:middle;">
      <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="140" height="42" style="display:block;border:0;outline:none;text-decoration:none;width:140px;height:auto;max-width:140px;margin:0 auto;" />
      ${fiataMembershipHtml(170, true)}
    </td>
    <td style="width:3px;padding:0;vertical-align:middle;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td>
    <td style="padding:0 0 0 20px;vertical-align:middle;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.3;color:#1a2f7a;padding:0 0 2px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;line-height:1.4;color:#454651;padding:0 0 6px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personTitle)}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;line-height:1.3;color:#1b1b20;padding:0;mso-line-height-rule:exactly;">${escapeHtml(params.companyName)}</td>
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
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#454651;padding:0 0 3px 0;mso-line-height-rule:exactly;">
            <span style="color:#1a2f7a;font-weight:700;">E</span>&nbsp;
            <a href="mailto:${escapeHtml(params.email)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#454651;padding:0 0 3px 0;mso-line-height-rule:exactly;">
            <span style="color:#1a2f7a;font-weight:700;">T</span>&nbsp;
            <a href="tel:${escapeHtml(params.phone1Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone1Display)}</a>${phoneTwoHtml}
          </td>
        </tr>
        <tr>
          <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.65;color:#454651;padding:0 0 3px 0;mso-line-height-rule:exactly;">
            <span style="color:#1a2f7a;font-weight:700;">W</span>&nbsp;
            <a href="${escapeHtml(params.websiteUrl)}" style="color:#f47920;text-decoration:none;font-weight:600;">${escapeHtml(params.websiteLabel)}</a>
          </td>
        </tr>${addressHtml}
      </table>
    </td>
  </tr>
</table>`
}

function buildCardSignatureHtml(params: BuilderFormValues): string {
  const phoneTwoHtml = params.showPhone2
    ? `<span style="color:#c5c5d3;"> / </span><a href="tel:${escapeHtml(params.phone2Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone2Display)}</a>`
    : ''

  const addressHtml = params.showAddress
    ? `
                    <tr>
                      <td width="18" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#f47920;vertical-align:top;padding:0 6px 0 0;">A</td>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.5;color:#757682;vertical-align:top;">${addressFull(params)}</td>
                    </tr>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;font-family:Arial,Helvetica,sans-serif;max-width:400px;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;border:1px solid #e8e4ef;background-color:#ffffff;">
        <tr>
          <td style="background-color:#1a2f7a;padding:0;font-size:0;line-height:0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr><td style="height:3px;background-color:#f47920;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td bgcolor="#fbf8ff" style="background-color:#fbf8ff;padding:16px 20px 14px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:0 0 12px 0;">
                  <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="150" height="45" style="display:block;border:0;outline:none;text-decoration:none;width:150px;height:auto;max-width:150px;margin:0 auto;" />
                  ${fiataMembershipHtml(150, true)}
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1.3;color:#1a2f7a;padding:0 0 3px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
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
                <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;line-height:1.3;color:#1b1b20;padding:0 0 12px 0;mso-line-height-rule:exactly;">${escapeHtml(params.companyName)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 20px 16px 20px;background-color:#ffffff;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
              <tr>
                <td style="border-top:1px solid #ebe8f3;padding:12px 0 0 0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td width="18" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#f47920;vertical-align:top;padding:0 6px 6px 0;">@</td>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#454651;padding:0 0 6px 0;vertical-align:top;">
                        <a href="mailto:${escapeHtml(params.email)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.email)}</a>
                      </td>
                    </tr>
                    <tr>
                      <td width="18" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#f47920;vertical-align:top;padding:0 6px 6px 0;">T</td>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#454651;padding:0 0 6px 0;vertical-align:top;">
                        <a href="tel:${escapeHtml(params.phone1Tel)}" style="color:#1e3da8;text-decoration:none;">${escapeHtml(params.phone1Display)}</a>${phoneTwoHtml}
                      </td>
                    </tr>
                    <tr>
                      <td width="18" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#f47920;vertical-align:top;padding:0 6px 6px 0;">W</td>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#454651;padding:0 0 6px 0;vertical-align:top;">
                        <a href="${escapeHtml(params.websiteUrl)}" style="color:#f47920;text-decoration:none;font-weight:600;">${escapeHtml(params.websiteLabel)}</a>
                      </td>
                    </tr>${addressHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

function buildExecutiveSignatureHtml(params: BuilderFormValues): string {
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
                      <td style="padding:6px 8px;">
                        <img src="${escapeHtml(params.logoUrl)}" alt="${escapeHtml(params.logoAlt)}" width="120" height="36" style="display:block;border:0;outline:none;text-decoration:none;width:120px;height:auto;max-width:120px;" />
                        ${fiataMembershipHtml(120)}
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.25;color:#ffffff;padding:0 0 2px 0;mso-line-height-rule:exactly;">${escapeHtml(params.personName)}</td>
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
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a2f7a;padding:0 0 6px 0;">Contact</td>
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
                <td width="50%" style="vertical-align:top;padding:0;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1a2f7a;padding:0 0 6px 0;">Web &amp; Office</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;padding:0 0 8px 0;">
                        <a href="${escapeHtml(params.websiteUrl)}" style="color:#f47920;text-decoration:none;font-weight:700;">${escapeHtml(params.websiteLabel)}</a>
                      </td>
                    </tr>${addressHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

export function buildSignatureHtml(
  templateId: TemplateId,
  params: BuilderFormValues,
): string {
  switch (templateId) {
    case 'card':
      return buildCardSignatureHtml(params)
    case 'executive':
      return buildExecutiveSignatureHtml(params)
    case 'horizontal':
    default:
      return buildHorizontalSignatureHtml(params)
  }
}
