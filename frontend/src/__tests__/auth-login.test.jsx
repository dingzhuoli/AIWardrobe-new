import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Login from '../pages/Login'


function AuthHarness() {
  const { admin } = useAuth()
  return admin ? <p>已登录：{admin.username}</p> : <Login />
}


afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})


describe('administrator login', () => {
  it('renders the login page and authenticates with an HttpOnly-cookie API flow', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ authenticated: false, configured: true }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ authenticated: true, username: 'admin' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ))

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    expect(await screen.findByRole('heading', { name: '管理员登录' })).toBeTruthy()
    await userEvent.type(screen.getByLabelText(/管理员密码/), 'a secure password')
    await userEvent.click(screen.getByRole('button', { name: '安全登录' }))

    expect(await screen.findByText('已登录：admin')).toBeTruthy()
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    )
  })

  it('shows a fail-closed message when server credentials are not configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(
      JSON.stringify({ authenticated: false, configured: false }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    ))

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/服务器尚未配置管理员凭据/)).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: '安全登录' }).disabled).toBe(true)
  })
})
