import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type AuthUser = {
  displayName: string
  email: string
  role: string
}

type ClassSchedule = {
  id: number
  courseName: string
  classDate: string
  startTime: string
  endTime: string
  room: string
  capacity: number
  availableSlots: number
}

type LoginResponse = {
  accessToken: string
  user: AuthUser
}

const apiUrl = import.meta.env.VITE_API_URL || ''

function App() {
  const [identifier, setIdentifier] = useState('manager@sports-center.local')
  const [password, setPassword] = useState('ChangeMe123!')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [classes, setClasses] = useState<ClassSchedule[]>([])
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [registeringClassId, setRegisteringClassId] = useState<number | null>(null)
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
      setAccessToken(payload.accessToken)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể kết nối máy chủ')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
    setAccessToken('')
    setClasses([])
  }

  useEffect(() => {
    if (!user || user.role !== 'MEMBER' || !accessToken) return
    fetch(`${apiUrl}/api/classes`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải danh sách lớp học')
        setClasses((await response.json()) as ClassSchedule[])
      })
      .catch((requestError) => setRegistrationError(requestError instanceof Error ? requestError.message : 'Không thể tải danh sách lớp học'))
      .finally(() => setIsLoadingClasses(false))
  }, [accessToken, user])

  async function handleRegistration(classId: number) {
    setRegisteringClassId(classId)
    setRegistrationMessage('')
    setRegistrationError('')
    try {
      const response = await fetch(`${apiUrl}/api/class-registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })
      const payload = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(payload.message || 'Không thể đăng ký lớp học')
      setClasses((currentClasses) => currentClasses.map((classSchedule) => classSchedule.id === classId ? { ...classSchedule, availableSlots: classSchedule.availableSlots - 1 } : classSchedule))
      setRegistrationMessage('Đăng ký lớp học thành công')
    } catch (requestError) {
      setRegistrationError(requestError instanceof Error ? requestError.message : 'Không thể đăng ký lớp học')
    } finally {
      setRegisteringClassId(null)
    }
  }

  if (user) {
    if (user.role === 'MEMBER') {
      return (
        <main className="shell dashboard-shell">
          <header className="topbar">
            <div className="brand-mark">SC<span>/</span>OS</div>
            <button className="ghost-button" type="button" onClick={handleLogout}>Đăng xuất</button>
          </header>
          <section className="dashboard-content member-content" aria-live="polite">
            <p className="eyebrow">MEMBER / CLASS REGISTRATION</p>
            <h1>Chọn lớp cho buổi tập tiếp theo.</h1>
            <p className="lead">Xin chào {user.displayName}. Các lớp đang mở được kiểm tra theo gói tập, lịch đã đăng ký và số chỗ còn lại.</p>
            {registrationMessage && <p className="success-message" role="status">{registrationMessage}</p>}
            {registrationError && <p className="error-message" role="alert">{registrationError}</p>}
            {isLoadingClasses ? <p className="empty-state">Đang tải lịch lớp...</p> : classes.length === 0 ? <p className="empty-state">Hiện chưa có lớp đang mở.</p> : (
              <div className="class-list">
                {classes.map((classSchedule) => (
                  <article className="class-row" key={classSchedule.id}>
                    <div>
                      <p className="class-date">{new Date(classSchedule.startTime).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      <h2>{classSchedule.courseName}</h2>
                      <p>{classSchedule.room} · {new Date(classSchedule.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="class-action">
                      <strong>{classSchedule.availableSlots}/{classSchedule.capacity}</strong>
                      <span>chỗ còn lại</span>
                      <button className="primary-button" type="button" disabled={!classSchedule.availableSlots || registeringClassId === classSchedule.id} onClick={() => handleRegistration(classSchedule.id)}>{registeringClassId === classSchedule.id ? 'Đang đăng ký...' : 'Đăng ký'} <span aria-hidden="true">↗</span></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )
    }
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
