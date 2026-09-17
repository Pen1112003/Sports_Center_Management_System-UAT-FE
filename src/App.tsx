import { useState, type FormEvent } from 'react'
import './App.css'

type AuthUser = {
  displayName: string
  email: string
  role: string
}

type LoginResponse = {
  accessToken: string
  user: AuthUser
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function App() {
  const [identifier, setIdentifier] = useState('manager@sports-center.local')
  const [password, setPassword] = useState('ChangeMe123!')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      })
      const payload = (await response.json()) as LoginResponse | { message?: string }
      if (!response.ok || !('user' in payload)) throw new Error('message' in payload ? payload.message : 'Đăng nhập không thành công')
      setUser(payload.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể kết nối máy chủ')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  if (user) {
    return (
      <main className="shell dashboard-shell">
        <header className="topbar">
          <div className="brand-mark">SC<span>/</span>OS</div>
          <button className="ghost-button" type="button" onClick={handleLogout}>Đăng xuất</button>
        </header>
        <section className="dashboard-content" aria-live="polite">
          <p className="eyebrow">SPORTS CENTER / SECURE SESSION</p>
          <h1>Chào mừng, {user.displayName}</h1>
          <p className="lead">Bạn đang truy cập khu vực dành cho <strong>{user.role}</strong>.</p>
          <div className="status-grid">
            <div><span>Session</span><strong>Active</strong></div>
            <div><span>Identity</span><strong>{user.email}</strong></div>
            <div><span>Access</span><strong>RBAC verified</strong></div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="shell login-shell">
      <section className="login-intro">
        <div className="brand-mark">SC<span>/</span>OS</div>
        <div className="intro-copy">
          <p className="eyebrow">SPORTS CENTER OPERATING SYSTEM</p>
          <h1>Every session starts with a secure welcome.</h1>
          <p>One access point for members, coaches, reception and center managers.</p>
        </div>
        <div className="signal"><span /> Protected access / RBAC enabled</div>
      </section>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="panel-kicker">01 / IDENTITY</div>
        <h2 id="login-title">Sign in to your center</h2>
        <p className="panel-copy">Use your email or phone number to continue.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier">Email or phone</label>
          <input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? 'Checking access...' : 'Continue'} <span aria-hidden="true">↗</span></button>
        </form>
        <p className="demo-note">Demo account: manager@sports-center.local / ChangeMe123!</p>
      </section>
    </main>
  )
}

export default App
