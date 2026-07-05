import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const srcRoot = path.resolve(process.cwd(), 'src')
const read = (file) => fs.readFileSync(path.join(srcRoot, file), 'utf8')

describe('OS 26 liquid glass UI contract', () => {
  it('defines global liquid glass tokens and utilities', () => {
    const css = read('index.css')

    expect(css).toContain('--glass-surface')
    expect(css).toContain('--glass-border')
    expect(css).toContain('.app-shell')
    expect(css).toContain('.liquid-glass')
    expect(css).toContain('.liquid-tabbar')
    expect(css).toContain('.liquid-chip')
  })

  it('uses liquid navigation and glass controls in shared components', () => {
    expect(read('components/TabBar.jsx')).toContain('liquid-tabbar')
    expect(read('components/FilterBar.jsx')).toContain('liquid-search')
    expect(read('components/Upload.jsx')).toContain('liquid-upload')
    expect(read('components/Settings.jsx')).toContain('liquid-sheet')
  })

  it('removes emoji UI affordances and purple decorative blobs', () => {
    const files = [
      'components/Settings.jsx',
      'pages/Wardrobe.jsx',
      'pages/Recommendation.jsx',
    ]
    const source = files.map(read).join('\n')

    expect(source).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    expect(source).not.toContain('bg-purple')
  })
})
