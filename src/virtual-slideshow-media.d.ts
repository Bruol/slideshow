declare module 'virtual:slideshow-media' {
  const mediaItems: readonly {
    readonly path: string
    readonly kind: 'image' | 'video'
  }[]

  export default mediaItems
}
