import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import Home from '../pages/Home'

vi.mock('../components/Settings', () => ({
  default: ({ onSave }) => (
    <>
      <button
        type="button"
        onClick={() => onSave?.({
          weatherLocationChanged: false,
          zodiacSignChanged: false,
          weather_location: '上海, 上海市, 中国',
          zodiac_sign: 'aries',
        })}
      >
        Mock save settings
      </button>
      <button
        type="button"
        onClick={() => onSave?.({
          weatherLocationChanged: false,
          zodiacSignChanged: true,
          weather_location: '上海, 上海市, 中国',
          zodiac_sign: 'taurus',
        })}
      >
        Mock save zodiac
      </button>
    </>
  ),
}))

describe('Home settings save refresh behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    i18n.changeLanguage('en')

    const fetchMock = vi.fn(async (url) => {
      const requestUrl = String(url)

      if (requestUrl.endsWith('/config')) {
        return {
          ok: true,
          json: async () => ({
            weather_location: '上海, 上海市, 中国',
            zodiac_sign: 'aries',
          }),
        }
      }

      if (requestUrl.includes('/weather?')) {
        return {
          ok: true,
          json: async () => ({
            temperature: 22,
            feelsLike: 23,
            condition: '晴',
            icon: '100',
            humidity: 50,
            windScale: '3',
            location: '上海, 上海市, 中国',
          }),
        }
      }

      if (requestUrl.endsWith('/wardrobe')) {
        return {
          ok: true,
          json: async () => ({
            tops: [],
            bottoms: [],
            shoes: [],
            accessories: [],
          }),
        }
      }

      if (requestUrl.includes('/horoscope/daily?')) {
        return {
          ok: true,
          json: async () => ({
            zodiac_name: 'Aries',
            summary: 'Useful day for focused decisions.',
            mood: 'steady',
            lucky_color: 'blue',
            lucky_number: 8,
            suggestion: 'Keep the outfit practical.',
            llm_status: 'done',
            is_configured: true,
            llm_reasoning: 'Configured horoscope is already available.',
          }),
        }
      }

      return { ok: false, json: async () => ({}) }
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not refetch weather or horoscope when unrelated settings are saved', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const calls = fetch.mock.calls.map(([url]) => String(url))
      expect(calls.filter((url) => url.includes('/weather?'))).toHaveLength(1)
      expect(calls.filter((url) => url.includes('/horoscope/daily?'))).toHaveLength(1)
    })

    await user.click(screen.getByRole('button', { name: 'Mock save settings' }))
    await new Promise(resolve => setTimeout(resolve, 0))

    const calls = fetch.mock.calls.map(([url]) => String(url))
    expect(calls.filter((url) => url.includes('/weather?'))).toHaveLength(1)
    expect(calls.filter((url) => url.includes('/horoscope/daily?'))).toHaveLength(1)
  })

  it('refreshes horoscope without refetching weather when only zodiac changes', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const calls = fetch.mock.calls.map(([url]) => String(url))
      expect(calls.filter((url) => url.includes('/weather?'))).toHaveLength(1)
      expect(calls.filter((url) => url.includes('/horoscope/daily?'))).toHaveLength(1)
    })

    await user.click(screen.getByRole('button', { name: 'Mock save zodiac' }))

    await waitFor(() => {
      const calls = fetch.mock.calls.map(([url]) => String(url))
      expect(calls.filter((url) => url.includes('/horoscope/daily?'))).toHaveLength(2)
    })

    const calls = fetch.mock.calls.map(([url]) => String(url))
    expect(calls.filter((url) => url.includes('/weather?'))).toHaveLength(1)
  })
})
