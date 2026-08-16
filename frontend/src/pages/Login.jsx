import { useState } from 'react'
import { KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { configured, login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <section className="liquid-panel relative z-10 w-full max-w-md rounded-[2rem] p-6 sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <ShieldCheck size={34} strokeWidth={2.2} />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">AI Wardrobe</p>
          <h1 className="text-2xl font-bold sm:text-3xl">管理员登录</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            登录后才能查看衣橱、照片和模型配置
          </p>
        </div>

        {!configured && (
          <div className="mb-5 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm leading-6 text-[var(--danger)]">
            服务器尚未配置管理员凭据。请先生成密码哈希和会话密钥，再重新启动容器。
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              <UserRound size={16} /> 管理员账号
            </span>
            <input
              className="input-field"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={!configured || submitting}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
              <KeyRound size={16} /> 管理员密码
            </span>
            <input
              className="input-field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!configured || submitting}
              required
              autoFocus
            />
          </label>

          {error && (
            <p role="alert" className="rounded-2xl bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}

          <button className="btn-primary w-full" type="submit" disabled={!configured || submitting}>
            {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <LockKeyhole size={18} />}
            {submitting ? '正在验证…' : '安全登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--text-tertiary)]">
          会话保存在 HttpOnly 安全 Cookie 中，网页脚本无法读取管理员凭据。
        </p>
      </section>
    </main>
  )
}
