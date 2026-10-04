import { useEffect, useState } from 'react'
import type { LogoDimensions } from './signature-template'

/**
 * Loads each image once to read its natural size. Results accumulate across
 * renders, so a URL is only ever measured until its first successful load.
 */
export function useImageDimensions(urls: string[]): LogoDimensions {
  const [dimensions, setDimensions] = useState<LogoDimensions>({})
  const urlsKey = urls.join('\n')

  useEffect(() => {
    if (urlsKey === '') {
      return undefined
    }

    let cancelled = false
    for (const url of urlsKey.split('\n')) {
      const image = new Image()
      image.onload = () => {
        if (cancelled || image.naturalWidth === 0 || image.naturalHeight === 0) {
          return
        }
        setDimensions((previous) =>
          previous[url]
            ? previous
            : { ...previous, [url]: { width: image.naturalWidth, height: image.naturalHeight } },
        )
      }
      image.src = url
    }

    return () => {
      cancelled = true
    }
  }, [urlsKey])

  return dimensions
}
