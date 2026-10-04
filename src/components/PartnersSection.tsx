import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'
import {
  type Partner,
  PARTNER_IMAGE_ACCEPT,
  createPartnerId,
  isCloudinaryConfigured,
  isHttpsUrl,
  parsePartnersJson,
  partnerNameFromFile,
  serializePartners,
  uploadPartnerImage,
  validatePartnerImageFile,
} from '../lib/partners'

type Tone = 'success' | 'error'

type PartnersSectionProps = {
  partners: Partner[]
  onPartnersChange: (partners: Partner[]) => void
  onNotify: (tone: Tone, message: string) => void
}

type AddMode = 'upload' | 'url'

type PreviewStatus = 'loading' | 'loaded' | 'error'

/** Tracks whether an <img> for a given URL loaded, without resetting state in an effect. */
const useImagePreviewStatus = (url: string) => {
  const [state, setState] = useState<{ url: string; status: PreviewStatus }>({
    url: '',
    status: 'loading',
  })

  const status: PreviewStatus = state.url === url ? state.status : 'loading'

  return {
    status,
    onLoad: () => setState({ url, status: 'loaded' }),
    onError: () => setState({ url, status: 'error' }),
  }
}

type PartnerRowProps = {
  partner: Partner
  index: number
  total: number
  onUpdate: (partner: Partner) => void
  onMove: (index: number, direction: -1 | 1) => void
  onDelete: (partner: Partner) => void
  onCopyUrl: (partner: Partner) => void
}

function PartnerRow({
  partner,
  index,
  total,
  onUpdate,
  onMove,
  onDelete,
  onCopyUrl,
}: PartnerRowProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(partner.name)
  const [draftUrl, setDraftUrl] = useState(partner.imageUrl)
  const [editError, setEditError] = useState<string | null>(null)
  const preview = useImagePreviewStatus(editing ? draftUrl.trim() : partner.imageUrl)

  const startEditing = () => {
    setDraftName(partner.name)
    setDraftUrl(partner.imageUrl)
    setEditError(null)
    setEditing(true)
  }

  const saveEdit = () => {
    const name = draftName.trim()
    const imageUrl = draftUrl.trim()

    if (!name) {
      setEditError('Enter a partner name.')
      return
    }
    if (!isHttpsUrl(imageUrl)) {
      setEditError('The image URL must start with https://')
      return
    }

    onUpdate({ ...partner, name, imageUrl })
    setEditing(false)
  }

  const thumbnailUrl = editing ? draftUrl.trim() : partner.imageUrl

  return (
    <li className={`partner-item${partner.enabled ? '' : ' partner-item-disabled'}`}>
      <div className="partner-thumb">
        {isHttpsUrl(thumbnailUrl) && preview.status !== 'error' ? (
          <img
            src={thumbnailUrl}
            alt={partner.name}
            onLoad={preview.onLoad}
            onError={preview.onError}
          />
        ) : (
          <span>No image</span>
        )}
      </div>

      <div className="partner-body">
        {editing ? (
          <div className="partner-edit">
            <label className="field field-compact">
              <span>Name</span>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </label>
            <label className="field field-compact">
              <span>Image URL</span>
              <input
                type="url"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
              />
            </label>
            {editError ? <p className="field-error">{editError}</p> : null}
            <div className="partner-actions">
              <button type="button" className="small-button small-button-primary" onClick={saveEdit}>
                Save
              </button>
              <button type="button" className="small-button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="partner-heading">
              <strong title={partner.name}>{partner.name}</strong>
              <span className={`partner-badge${partner.enabled ? ' partner-badge-on' : ''}`}>
                {partner.enabled ? 'In signature' : 'Hidden'}
              </span>
            </div>
            <p className="partner-url" title={partner.imageUrl}>
              {partner.imageUrl}
            </p>
            {preview.status === 'error' ? (
              <p className="field-error">This image could not be loaded.</p>
            ) : null}
            <div className="partner-actions">
              <label className="toggle toggle-compact">
                <input
                  type="checkbox"
                  checked={partner.enabled}
                  onChange={(event) => onUpdate({ ...partner, enabled: event.target.checked })}
                />
                <span>Show in signature</span>
              </label>
              <button type="button" className="small-button" onClick={() => onCopyUrl(partner)}>
                Copy URL
              </button>
              <button type="button" className="small-button" onClick={startEditing}>
                Edit
              </button>
              <button
                type="button"
                className="small-button"
                onClick={() => onMove(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${partner.name} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="small-button"
                onClick={() => onMove(index, 1)}
                disabled={index === total - 1}
                aria-label={`Move ${partner.name} down`}
              >
                ↓
              </button>
              <button
                type="button"
                className="small-button small-button-danger"
                onClick={() => onDelete(partner)}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  )
}

export function PartnersSection({ partners, onPartnersChange, onNotify }: PartnersSectionProps) {
  const [addMode, setAddMode] = useState<AddMode>('upload')
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newUrl, setNewUrl] = useState('')
  const trimmedNewUrl = newUrl.trim()
  const urlPreview = useImagePreviewStatus(trimmedNewUrl)

  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const cloudinaryReady = isCloudinaryConfigured()
  const uploading = uploadProgress !== null
  const enabledCount = partners.filter((partner) => partner.enabled).length

  const filePreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  )

  useEffect(
    () => () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl)
      }
    },
    [filePreviewUrl],
  )

  const resetAddForm = () => {
    setNewName('')
    setNewUrl('')
    setSelectedFile(null)
    setAddError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addPartner = (name: string, imageUrl: string) => {
    onPartnersChange([...partners, { id: createPartnerId(), name, imageUrl, enabled: true }])
    onNotify('success', `${name} added to partners.`)
    resetAddForm()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setAddError(null)

    if (!file) {
      setSelectedFile(null)
      return
    }

    const fileError = validatePartnerImageFile(file)
    if (fileError) {
      setSelectedFile(null)
      setAddError(fileError)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    if (!newName.trim()) {
      setNewName(partnerNameFromFile(file.name))
    }
  }

  const handleUpload = async () => {
    const name = newName.trim()
    if (!selectedFile) {
      setAddError('Choose an image to upload.')
      return
    }
    if (!name) {
      setAddError('Enter a partner name.')
      return
    }

    setAddError(null)
    setUploadProgress(0)
    try {
      const secureUrl = await uploadPartnerImage(selectedFile, setUploadProgress)
      addPartner(name, secureUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.'
      setAddError(message)
      onNotify('error', message)
    } finally {
      setUploadProgress(null)
    }
  }

  const handleAddByUrl = () => {
    const name = newName.trim()
    if (!name) {
      setAddError('Enter a partner name.')
      return
    }
    if (!isHttpsUrl(trimmedNewUrl)) {
      setAddError('The image URL must start with https://')
      return
    }
    if (urlPreview.status !== 'loaded') {
      setAddError(
        urlPreview.status === 'error'
          ? 'This image could not be loaded. Check the URL.'
          : 'Wait for the preview to load before adding.',
      )
      return
    }

    addPartner(name, trimmedNewUrl)
  }

  const updatePartner = (updated: Partner) => {
    onPartnersChange(partners.map((partner) => (partner.id === updated.id ? updated : partner)))
  }

  const movePartner = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= partners.length) {
      return
    }
    const next = [...partners]
    ;[next[index], next[target]] = [next[target], next[index]]
    onPartnersChange(next)
  }

  const deletePartner = (partner: Partner) => {
    if (!window.confirm(`Delete "${partner.name}" from your partners?`)) {
      return
    }
    onPartnersChange(partners.filter((item) => item.id !== partner.id))
    onNotify('success', `${partner.name} deleted.`)
  }

  const copyPartnerUrl = async (partner: Partner) => {
    try {
      await copyText(partner.imageUrl)
      onNotify('success', `Image URL for ${partner.name} copied.`)
    } catch {
      onNotify('error', 'Could not copy the URL. Please copy it manually.')
    }
  }

  const copyPartnersList = async () => {
    try {
      await copyText(serializePartners(partners))
      onNotify('success', `Partners list copied (${partners.length} partners).`)
    } catch {
      onNotify('error', 'Could not copy the partners list.')
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    try {
      setImportText(await file.text())
      setImportError(null)
    } catch {
      setImportError('Could not read that file.')
    }
  }

  const handleImport = () => {
    const result = parsePartnersJson(importText)
    if (!result.ok) {
      setImportError(result.error)
      onNotify('error', 'Import failed — see the error below the text box.')
      return
    }

    const confirmed = window.confirm(
      `Replace your current ${partners.length} partner(s) with ${result.partners.length} imported partner(s)? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    onPartnersChange(result.partners)
    setImportText('')
    setImportError(null)
    onNotify('success', `Imported ${result.partners.length} partners.`)
  }

  return (
    <div className="form-section partners-section">
      <div className="section-title">
        <span />
        <h3>Partners</h3>
      </div>
      <p className="section-help">
        Enabled partner logos appear in a “Partners” row at the bottom of every template.
        Partners are saved in this browser only (localStorage). They are not shared with other
        people, browsers or devices, so use “Copy partners list” to move them elsewhere.
      </p>

      <div className="partners-add">
        <div className="segmented" role="tablist" aria-label="Add partner method">
          <button
            type="button"
            role="tab"
            aria-selected={addMode === 'upload'}
            className={addMode === 'upload' ? 'active' : ''}
            onClick={() => {
              setAddMode('upload')
              setAddError(null)
            }}
          >
            Upload image
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={addMode === 'url'}
            className={addMode === 'url' ? 'active' : ''}
            onClick={() => {
              setAddMode('url')
              setAddError(null)
            }}
          >
            Image URL
          </button>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Partner name</span>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Maersk"
              disabled={uploading}
            />
          </label>

          {addMode === 'upload' ? (
            <label className="field">
              <span>Logo file (PNG, JPG, SVG, WebP · max 5 MB)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept={PARTNER_IMAGE_ACCEPT}
                onChange={handleFileChange}
                disabled={uploading || !cloudinaryReady}
              />
            </label>
          ) : (
            <label className="field">
              <span>Image URL (https)</span>
              <input
                type="url"
                value={newUrl}
                onChange={(event) => {
                  setNewUrl(event.target.value)
                  setAddError(null)
                }}
                placeholder="https://…/logo.png"
              />
            </label>
          )}
        </div>

        {addMode === 'upload' && !cloudinaryReady ? (
          <p className="field-error">
            Uploads are disabled: set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET
            in your .env file and restart the dev server. You can still add partners by URL.
          </p>
        ) : null}

        {addMode === 'upload' && filePreviewUrl ? (
          <div className="partner-preview">
            <img src={filePreviewUrl} alt="Selected logo preview" />
            <span>{selectedFile?.name}</span>
          </div>
        ) : null}

        {addMode === 'url' && isHttpsUrl(trimmedNewUrl) ? (
          <div className="partner-preview">
            {urlPreview.status === 'error' ? (
              <span className="field-error">Preview failed — this image could not be loaded.</span>
            ) : (
              <>
                <img
                  src={trimmedNewUrl}
                  alt="Logo preview"
                  onLoad={urlPreview.onLoad}
                  onError={urlPreview.onError}
                />
                <span>{urlPreview.status === 'loaded' ? 'Preview' : 'Loading preview…'}</span>
              </>
            )}
          </div>
        ) : null}

        {addMode === 'url' && trimmedNewUrl.toLowerCase().split('?')[0].endsWith('.svg') ? (
          <p className="field-hint">
            SVG images are not displayed by Gmail or Outlook. Upload the file instead; uploaded
            logos are delivered as PNG automatically.
          </p>
        ) : null}

        {uploading ? (
          <div className="upload-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
            <span>Uploading… {uploadProgress}%</span>
          </div>
        ) : null}

        {addError ? <p className="field-error">{addError}</p> : null}

        <div className="partner-actions">
          {addMode === 'upload' ? (
            <button
              type="button"
              className="brand-button"
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !cloudinaryReady}
            >
              {uploading ? 'Uploading…' : 'Upload & add partner'}
            </button>
          ) : (
            <button
              type="button"
              className="brand-button"
              onClick={handleAddByUrl}
              disabled={urlPreview.status !== 'loaded' || !isHttpsUrl(trimmedNewUrl)}
            >
              Add partner
            </button>
          )}
        </div>
      </div>

      <div className="partners-list-header">
        <p>
          <strong>{enabledCount}</strong> of {partners.length} partner
          {partners.length === 1 ? '' : 's'} will appear in the signature.
        </p>
        <button
          type="button"
          className="ghost-button"
          onClick={copyPartnersList}
          disabled={partners.length === 0}
        >
          Copy partners list
        </button>
      </div>

      {partners.length === 0 ? (
        <p className="partners-empty">No partners yet. Add one above.</p>
      ) : (
        <ul className="partners-list">
          {partners.map((partner, index) => (
            <PartnerRow
              key={partner.id}
              partner={partner}
              index={index}
              total={partners.length}
              onUpdate={updatePartner}
              onMove={movePartner}
              onDelete={deletePartner}
              onCopyUrl={copyPartnerUrl}
            />
          ))}
        </ul>
      )}

      <details className="partners-import">
        <summary>Import partners list</summary>
        <p className="section-help">
          Paste JSON copied with “Copy partners list”, or load a .json file. It is validated
          first, and your current list is replaced only after you confirm.
        </p>
        <label className="field">
          <span>Partners JSON</span>
          <textarea
            className="import-textarea"
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value)
              setImportError(null)
            }}
            rows={6}
            spellCheck={false}
            placeholder='[{ "id": "…", "name": "…", "imageUrl": "https://…", "enabled": true }]'
          />
        </label>
        {importError ? <p className="field-error">{importError}</p> : null}
        <div className="partner-actions">
          <button
            type="button"
            className="brand-button"
            onClick={handleImport}
            disabled={importText.trim() === ''}
          >
            Validate &amp; replace list
          </button>
          <label className="ghost-button file-button">
            Load .json file
            <input type="file" accept="application/json,.json" onChange={handleImportFile} />
          </label>
        </div>
      </details>
    </div>
  )
}
