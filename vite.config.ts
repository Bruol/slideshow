import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, normalizePath, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const VIRTUAL_MEDIA_MODULE_ID = 'virtual:slideshow-media'
const RESOLVED_VIRTUAL_MEDIA_MODULE_ID = `\0${VIRTUAL_MEDIA_MODULE_ID}`

const IMAGE_EXTENSIONS = new Set([
  '.apng',
  '.avif',
  '.bmp',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
])

const VIDEO_EXTENSIONS = new Set([
  '.m4v',
  '.mov',
  '.mp4',
  '.ogv',
  '.webm',
])

function collectMediaPaths(rootDir: string, currentDir = rootDir): string[] {
  const entries = readdirSync(currentDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectMediaPaths(rootDir, entryPath))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!IMAGE_EXTENSIONS.has(extension) && !VIDEO_EXTENSIONS.has(extension)) {
      continue
    }

    files.push(normalizePath(path.relative(rootDir, entryPath)))
  }

  return files
}

function slideshowMediaPlugin(): Plugin {
  const publicDir = path.resolve(process.cwd(), 'public')
  const normalizedPublicDir = normalizePath(publicDir)

  function readMediaManifest() {
    if (!existsSync(publicDir)) {
      return []
    }

    return collectMediaPaths(publicDir)
      .sort()
      .map((mediaPath) => ({
        path: mediaPath,
        kind: VIDEO_EXTENSIONS.has(path.extname(mediaPath).toLowerCase())
          ? 'video'
          : 'image',
      }))
  }

  return {
    name: 'slideshow-media-plugin',
    resolveId(source) {
      if (source === VIRTUAL_MEDIA_MODULE_ID) {
        return RESOLVED_VIRTUAL_MEDIA_MODULE_ID
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MEDIA_MODULE_ID) {
        return `export default ${JSON.stringify(readMediaManifest())}`
      }
    },
    configureServer(server) {
      server.watcher.add(publicDir)
    },
    handleHotUpdate(context) {
      const normalizedFilePath = normalizePath(context.file)

      if (!normalizedFilePath.startsWith(normalizedPublicDir)) {
        return
      }

      const virtualModule = context.server.moduleGraph.getModuleById(
        RESOLVED_VIRTUAL_MEDIA_MODULE_ID,
      )

      if (virtualModule) {
        context.server.moduleGraph.invalidateModule(virtualModule)
      }

      context.server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

export default defineConfig({
  plugins: [
    slideshowMediaPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
