# Slideshow

Minimal full-screen React slideshow viewer for local media in `public/`.

## Usage

1. Put image or video files anywhere under `public/`.
2. Run `bun dev`.
3. Use the left and right arrow keys to move through the slideshow.

Media files are sorted lexicographically by path before display.

## Supported formats

Images:

- `apng`
- `avif`
- `bmp`
- `gif`
- `jpeg`
- `jpg`
- `png`
- `webp`

Videos:

- `m4v`
- `mov`
- `mp4`
- `ogv`
- `webm`

Playback uses the browser's native image and video support. If a file does not decode in the browser, it will not render correctly even if the extension is listed here.

## Notes

- The viewer fills the viewport with a black background.
- There are no visible controls or buttons.
- Videos loop automatically and try to play with sound after your first arrow-key interaction.
- Changing files under `public/` during development triggers a reload so the media list stays up to date.
