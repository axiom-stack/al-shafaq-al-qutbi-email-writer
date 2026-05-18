import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  type BuilderFormValues,
  type TemplateId,
  DEFAULT_FORM_VALUES,
  resettableDefaults,
} from './lib/defaults'
import {
  buildMessagePreviewHtml,
  buildSignatureHtml,
} from './lib/signature-template'

type ToastState = {
  tone: 'success' | 'error'
  message: string
} | null

const TEMPLATES: Array<{
  id: TemplateId
  label: string
  description: string
}> = [
  {
    id: 'horizontal',
    label: 'Corporate horizontal',
    description: 'Default; best Gmail/Outlook compatibility',
  },
  {
    id: 'card',
    label: 'Premium card',
    description: 'Bordered card, centered logo',
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Navy header band, strongest brand',
  },
]

const htmlToPlainText = (html: string) => {
  const container = document.createElement('div')
  container.innerHTML = html
  return container.textContent ?? container.innerText ?? ''
}

const fallbackCopyHtml = async (html: string) => {
  const container = document.createElement('div')
  container.innerHTML = html
  container.contentEditable = 'true'
  container.setAttribute('aria-hidden', 'true')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.opacity = '0'
  document.body.appendChild(container)

  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(container)
  selection?.removeAllRanges()
  selection?.addRange(range)

  const copied = document.execCommand('copy')

  selection?.removeAllRanges()
  document.body.removeChild(container)

  if (!copied) {
    throw new Error('Fallback copy failed')
  }
}

const copyToClipboard = async (html: string) => {
  const plainText = htmlToPlainText(html)

  if (window.ClipboardItem && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    })

    await navigator.clipboard.write([item])
    return
  }

  await fallbackCopyHtml(html)
}

function App() {
  const [formValues, setFormValues] = useState<BuilderFormValues>(DEFAULT_FORM_VALUES)
  const [toast, setToast] = useState<ToastState>(null)

  const signatureHtml = useMemo(
    () => buildSignatureHtml(formValues.templateId, formValues),
    [formValues],
  )
  const messagePreviewHtml = useMemo(
    () => buildMessagePreviewHtml(formValues.emailBody),
    [formValues.emailBody],
  )

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const updateField = <K extends keyof BuilderFormValues>(
    key: K,
    value: BuilderFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(signatureHtml)
      setToast({
        tone: 'success',
        message:
          'Signature copied — paste into Gmail/Outlook signature settings or below your message.',
      })
    } catch {
      setToast({
        tone: 'error',
        message: 'Clipboard access failed. Please try again in a supported browser.',
      })
    }
  }

  const resetForm = () => {
    setFormValues(resettableDefaults())
    setToast({
      tone: 'success',
      message: 'Defaults restored',
    })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <img
          className="header-logo"
          src={formValues.logoUrl}
          alt={formValues.logoAlt}
          width={140}
          height={42}
        />
        <div>
          <p className="eyebrow">ALFS internal tool</p>
          <h1>ALFS Email Builder</h1>
          <p className="subtitle">
            Customize your signature, preview it above a sample message, and copy
            signature HTML only.
          </p>
        </div>
      </header>

      <main className="workspace">
        <section className="brand-card form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Compose</p>
              <h2>Signature builder</h2>
            </div>
            <button type="button" className="ghost-button" onClick={resetForm}>
              Reset defaults
            </button>
          </div>

          <div className="form-section">
            <div className="section-title">
              <span />
              <h3>Template</h3>
            </div>
            <div className="template-grid">
              {TEMPLATES.map((template) => (
                <label
                  key={template.id}
                  className={`template-option${
                    formValues.templateId === template.id ? ' active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="templateId"
                    value={template.id}
                    checked={formValues.templateId === template.id}
                    onChange={() => updateField('templateId', template.id)}
                  />
                  <strong>{template.label}</strong>
                  <span>{template.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">
              <span />
              <h3>Your details</h3>
            </div>
            <div className="field-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  type="text"
                  value={formValues.personName}
                  onChange={(event) => updateField('personName', event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Job title</span>
                <input
                  type="text"
                  value={formValues.personTitle}
                  onChange={(event) => updateField('personTitle', event.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">
              <span />
              <h3>Sample message</h3>
            </div>
            <label className="field">
              <span>For preview only</span>
              <textarea
                value={formValues.emailBody}
                onChange={(event) => updateField('emailBody', event.target.value)}
                rows={8}
                required
              />
            </label>
          </div>

          <details className="advanced-panel">
            <summary>
              <div>
                <p className="eyebrow">Advanced</p>
                <h3>Company details</h3>
              </div>
              <span className="summary-copy">Optional overrides</span>
            </summary>

            <div className="form-section advanced-fields">
              <div className="field-grid">
                <label className="field">
                  <span>Company name</span>
                  <input
                    type="text"
                    value={formValues.companyName}
                    onChange={(event) => updateField('companyName', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Logo image URL</span>
                  <input
                    type="url"
                    value={formValues.logoUrl}
                    onChange={(event) => updateField('logoUrl', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Logo alt text</span>
                  <input
                    type="text"
                    value={formValues.logoAlt}
                    onChange={(event) => updateField('logoAlt', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Phone 1 (display)</span>
                  <input
                    type="text"
                    value={formValues.phone1Display}
                    onChange={(event) => updateField('phone1Display', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Phone 1 (tel href)</span>
                  <input
                    type="text"
                    value={formValues.phone1Tel}
                    onChange={(event) => updateField('phone1Tel', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Phone 2 (display)</span>
                  <input
                    type="text"
                    value={formValues.phone2Display}
                    onChange={(event) => updateField('phone2Display', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Phone 2 (tel href)</span>
                  <input
                    type="text"
                    value={formValues.phone2Tel}
                    onChange={(event) => updateField('phone2Tel', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Website URL</span>
                  <input
                    type="url"
                    value={formValues.websiteUrl}
                    onChange={(event) => updateField('websiteUrl', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Website label</span>
                  <input
                    type="text"
                    value={formValues.websiteLabel}
                    onChange={(event) => updateField('websiteLabel', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Address line 1</span>
                  <input
                    type="text"
                    value={formValues.addressLine1}
                    onChange={(event) => updateField('addressLine1', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Address line 2</span>
                  <input
                    type="text"
                    value={formValues.addressLine2}
                    onChange={(event) => updateField('addressLine2', event.target.value)}
                  />
                </label>
              </div>

              <div className="toggle-row">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formValues.showPhone2}
                    onChange={(event) => updateField('showPhone2', event.target.checked)}
                  />
                  <span>Show second phone</span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formValues.showAddress}
                    onChange={(event) => updateField('showAddress', event.target.checked)}
                  />
                  <span>Show address</span>
                </label>
              </div>
            </div>
          </details>
        </section>

        <aside className="brand-card preview-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>Message + signature context</h2>
            </div>
            <div className="button-row">
              <button type="button" className="brand-button" onClick={handleCopy}>
                Copy signature HTML
              </button>
            </div>
          </div>

          <div className="preview-frame">
            <div className="preview-email">
              <div className="message-preview">
                <p className="message-preview-label">Message preview (not copied)</p>
                <div dangerouslySetInnerHTML={{ __html: messagePreviewHtml }} />
              </div>
              <div className="signature-divider">signature below</div>
              <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
            </div>
          </div>

          <p className="preview-helper">
            Paste into Gmail → Settings → Signature, or below your message in your
            email client.
          </p>
        </aside>
      </main>

      <footer className="app-footer">ALFS internal tool</footer>

      {toast ? (
        <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

export default App
