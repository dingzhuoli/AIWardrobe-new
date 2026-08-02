import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '../i18n'
import { ThemeProvider } from '../contexts/ThemeContext'
import Settings from '../components/Settings'

const renderSettings = (props = {}) => render(
  <ThemeProvider>
    <Settings
      isOpen
      onClose={vi.fn()}
      onSave={vi.fn()}
      {...props}
    />
  </ThemeProvider>,
)

describe('Settings save refresh metadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    i18n.changeLanguage('en')
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const fetchMock = vi.fn(async (url, options = {}) => {
      const requestUrl = String(url)

      if (requestUrl.endsWith('/config') && options.method !== 'POST') {
        return {
          ok: true,
          json: async () => ({
            api_base: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            bg_removal_method: 'local',
            tryon_provider: 'disabled',
            tryon_api_url: '',
            tryon_model: '',
            weather_location: '上海, 上海市, 中国',
            zodiac_sign: 'aries',
            has_api_key: false,
            has_removebg_key: false,
            has_tryon_api_key: false,
            local_rembg_installed: false,
          }),
        }
      }

      if (requestUrl.endsWith('/config') && options.method === 'POST') {
        return {
          ok: true,
          json: async () => ({}),
        }
      }

      return { ok: false, json: async () => ({}) }
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports no refresh-sensitive changes when weather location and zodiac are unchanged', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    renderSettings({ onSave })

    const saveButton = screen.getByRole('button', { name: 'Save Settings' })
    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[0].value).toBe('aries')
    })

    await user.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        weatherLocationChanged: false,
        zodiacSignChanged: false,
        weather_location: '上海, 上海市, 中国',
        zodiac_sign: 'aries',
      }))
    })
  })

  it('reports zodiac changes without marking weather location as changed', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    renderSettings({ onSave })

    const zodiacSelect = screen.getAllByRole('combobox')[0]
    await waitFor(() => {
      expect(zodiacSelect.value).toBe('aries')
    })
    await user.selectOptions(zodiacSelect, 'taurus')
    await user.click(screen.getByRole('button', { name: 'Save Settings' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
        weatherLocationChanged: false,
        zodiacSignChanged: true,
        weather_location: '上海, 上海市, 中国',
        zodiac_sign: 'taurus',
      }))
    })
  })

  it('shows local rembg as installed when backend reports dependencies are available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      const requestUrl = String(url)

      if (requestUrl.endsWith('/config') && options.method !== 'POST') {
        return {
          ok: true,
          json: async () => ({
            api_base: 'https://api.openai.com/v1',
            model: 'gpt-4o',
            bg_removal_method: 'local',
            tryon_provider: 'disabled',
            tryon_api_url: '',
            tryon_model: '',
            weather_location: '上海, 上海市, 中国',
            zodiac_sign: 'aries',
            has_api_key: false,
            has_removebg_key: false,
            has_tryon_api_key: false,
            local_rembg_installed: true,
          }),
        }
      }

      return { ok: false, json: async () => ({}) }
    }))

    renderSettings()

    const installedButton = await screen.findByRole('button', { name: 'rembg installed' })
    expect(installedButton.disabled).toBe(true)
  })
})
