import { useEffect, useState } from 'react'
import type { LogoDimensions } from './signature-template'

type MeasuredImages = {
  dimensions: LogoDimensions
  failed: Record<string, true>
}

/**
 * Loads each image once to read its natural size. Results accumulate across
 * renders, so a URL is only measured until its first load or error.
 * `pendingCount` is how many of `urls` have neither loaded nor failed yet.
 */
export function useImageDimensions(urls: string[]) {
  const [measured, setMeasured] = useState<MeasuredImages>({ dimensions: {}, failed: {} })
  const urlsKey = urls.join('\n')

  useEffect(() => {
    if (urlsKey === '') {
      return undefined
    }

    let cancelled = false
    for (const url of urlsKey.split('\n')) {
      const image = new Image()
      image.onload = () => {
        if (cancelled) {
          return
        }
        const { naturalWidth: width, naturalHeight: height } = image
        setMeasured((previous) => {
          if (previous.dimensions[url]) {
            return previous
          }
          if (width === 0 || height === 0) {
            return { ...previous, failed: { ...previous.failed, [url]: true } }
          }
          return { ...previous, dimensions: { ...previous.dimensions, [url]: { width, height } } }
        })
      }
      image.onerror = () => {
        if (cancelled) {
          return
        }
        setMeasured((previous) =>
          previous.failed[url] ? previous : { ...previous, failed: { ...previous.failed, [url]: true } },
        )
      }
      image.src = url
    }

    return () => {
      cancelled = true
    }
  }, [urlsKey])

  const pendingCount = urls.filter(
    (url) => !measured.dimensions[url] && !measured.failed[url],
  ).length

  return { dimensions: measured.dimensions, pendingCount }
}
