import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react'
import mediaItems from 'virtual:slideshow-media'
import './App.css'

type MediaItem = (typeof mediaItems)[number]
type TransitionSlide = {
  item: MediaItem
  version: number
}

const SLIDE_DURATION_MS = 420

function getMediaUrl(path: string) {
  return encodeURI(`${import.meta.env.BASE_URL}${path}`)
}

function renderMedia(
  item: MediaItem,
  src: string,
  audioEnabled: boolean,
  videoRef?: RefObject<HTMLVideoElement | null>,
) {
  if (item.kind === 'image') {
    return (
      <img
        className="slide-media"
        src={src}
        alt={item.path}
        draggable={false}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className="slide-media"
      src={src}
      autoPlay
      loop
      muted={!audioEnabled}
      playsInline
      preload="auto"
    />
  )
}

function App() {
  const [index, setIndex] = useState(0)
  const [slideVersion, setSlideVersion] = useState(0)
  const [exitingSlide, setExitingSlide] = useState<TransitionSlide | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const clearExitTimeoutRef = useRef<number | null>(null)
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)

  const activeItem = mediaItems[index]
  const activeSrc = activeItem ? getMediaUrl(activeItem.path) : null

  const clearExitSlide = useEffectEvent(() => {
    setExitingSlide(null)
    clearExitTimeoutRef.current = null
  })

  const playActiveVideo = useEffectEvent(async () => {
    const video = activeVideoRef.current

    if (!video) {
      return
    }

    video.muted = !audioEnabled

    try {
      await video.play()
    } catch {
      // Browsers can still block autoplay with sound until after interaction.
    }
  })

  const navigate = useEffectEvent((direction: number) => {
    if (mediaItems.length === 0) {
      return
    }

    const nextIndex = (index + direction + mediaItems.length) % mediaItems.length

    if (clearExitTimeoutRef.current !== null) {
      window.clearTimeout(clearExitTimeoutRef.current)
    }

    setAudioEnabled(true)
    setExitingSlide({
      item: mediaItems[index],
      version: slideVersion + 1,
    })
    setIndex(nextIndex)
    setSlideVersion((currentVersion) => currentVersion + 1)
    clearExitTimeoutRef.current = window.setTimeout(
      clearExitSlide,
      SLIDE_DURATION_MS,
    )
  })

  useEffect(() => {
    if (mediaItems.length === 0) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
      }

      event.preventDefault()
      navigate(event.key === 'ArrowRight' ? 1 : -1)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    void playActiveVideo()
  }, [index, slideVersion, audioEnabled])

  useEffect(() => {
    return () => {
      if (clearExitTimeoutRef.current !== null) {
        window.clearTimeout(clearExitTimeoutRef.current)
      }
    }
  }, [])

  if (mediaItems.length === 0) {
    return (
      <main className="slideshow slideshow--empty">
        <p>No supported media files found in `public`.</p>
      </main>
    )
  }

  return (
    <main className="slideshow">
      {exitingSlide ? (
        <div
          key={`exit-${exitingSlide.item.path}-${exitingSlide.version}`}
          className="slide-frame slide-frame--exit"
        >
          {renderMedia(
            exitingSlide.item,
            getMediaUrl(exitingSlide.item.path),
            false,
          )}
        </div>
      ) : null}

      <div
        key={`active-${activeItem.path}-${slideVersion}`}
        className={`slide-frame ${slideVersion === 0 ? 'slide-frame--static' : 'slide-frame--enter'}`}
      >
        {renderMedia(activeItem, activeSrc ?? '', audioEnabled, activeVideoRef)}
      </div>
    </main>
  )
}

export default App
