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

type MembershipPackage = {
  id: number
  code: string
  name: string
  description: string | null
  price: number
  durationDays: number
  sessionLimit: number | null
  sportType: string
  benefits: string[]
  isBestSeller: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  activeSubscribers: number
  createdAt: string
  updatedAt: string
}

type LoginResponse = {
  accessToken: string
  user: AuthUser
}

const apiUrl = import.meta.env.VITE_API_URL || ''

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' đ'
}

function formatDuration(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)} Năm`
  if (days >= 30) return `${Math.round(days / 30)} Tháng`
  return `${days} Ngày`
}

const SPORT_OPTIONS = ['Gym', 'Yoga', 'Boxing', 'Bơi lội', 'Pilates', 'Zumba', 'Toàn diện']
const STATUS_FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Đang bán', value: 'ACTIVE' },
  { label: 'Tạm dừng', value: 'INACTIVE' },
]

function PackageManagement({ accessToken }: { accessToken: string }) {
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sportFilter, setSportFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formSessionLimit, setFormSessionLimit] = useState('')
  const [formSportType, setFormSportType] = useState('Gym')
  const [formBenefits, setFormBenefits] = useState('')
  const [formBestSeller, setFormBestSeller] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function fetchPackages() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (sportFilter) params.set('sportType', sportFilter)
      if (search.trim()) params.set('search', search.trim())

      const response = await fetch(`${apiUrl}/api/packages?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error('Không thể tải danh mục gói tập')
      setPackages((await response.json()) as MembershipPackage[])
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi kết nối' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [statusFilter, sportFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreateModal() {
    setEditingPackage(null)
    setFormCode('')
    setFormName('')
    setFormDescription('')
    setFormPrice('')
    setFormDuration('')
    setFormSessionLimit('')
    setFormSportType('Gym')
    setFormBenefits('')
    setFormBestSeller(false)
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(pkg: MembershipPackage) {
    setEditingPackage(pkg)
    setFormCode(pkg.code)
    setFormName(pkg.name)
    setFormDescription(pkg.description || '')
    setFormPrice(String(pkg.price))
    setFormDuration(String(pkg.durationDays))
    setFormSessionLimit(pkg.sessionLimit ? String(pkg.sessionLimit) : '')
    setFormSportType(pkg.sportType)
    setFormBenefits(pkg.benefits.join(', '))
    setFormBestSeller(pkg.isBestSeller)
    setFormError('')
    setModalOpen(true)
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    const price = Number(formPrice)
    const durationDays = Number(formDuration)
    if (!price || price <= 0) { setFormError('Giá gói tập phải lớn hơn 0'); setIsSubmitting(false); return }
    if (!durationDays || durationDays <= 0) { setFormError('Thời hạn sử dụng phải lớn hơn 0 ngày'); setIsSubmitting(false); return }

    const benefits = formBenefits
      .split(/[,;\n]/)
      .map((b) => b.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
      name: formName,
      description: formDescription || null,
      price,
      durationDays,
      sessionLimit: formSessionLimit ? Number(formSessionLimit) : null,
      sportType: formSportType,
      benefits,
      isBestSeller: formBestSeller,
    }

    try {
      let response: Response
      if (editingPackage) {
        response = await fetch(`${apiUrl}/api/packages/${editingPackage.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        payload.code = formCode
        response = await fetch(`${apiUrl}/api/packages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.message || 'Không thể lưu gói tập')
      }

      setModalOpen(false)
      setFeedback({ type: 'success', message: editingPackage ? 'Cập nhật gói tập thành công' : 'Tạo gói tập mới thành công' })
      fetchPackages()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi hệ thống')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function togglePackageStatus(pkg: MembershipPackage) {
    setTogglingId(pkg.id)
    const endpoint = pkg.status === 'ACTIVE' ? 'deactivate' : 'activate'
    try {
      const response = await fetch(`${apiUrl}/api/packages/${pkg.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error('Không thể chuyển đổi trạng thái')
      setFeedback({
        type: 'success',
        message: endpoint === 'activate' ? `Đã kích hoạt gói "${pkg.name}"` : `Đã tạm dừng gói "${pkg.name}"`,
      })
      fetchPackages()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi hệ thống' })
    } finally {
      setTogglingId(null)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    fetchPackages()
  }

  // Auto-clear feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  return (
    <section className="packages-section" aria-live="polite">
      <div className="packages-header">
        <div>
          <p className="eyebrow">MANAGER / PACKAGE CATALOG</p>
          <h1 className="packages-title">Danh mục Gói tập</h1>
          <p className="lead">Cấu hình và quản lý danh mục gói tập, giá bán, thời hạn sử dụng và bộ môn áp dụng.</p>
        </div>
        <button className="primary-button create-btn" type="button" onClick={openCreateModal} id="btn-create-package">
          + Tạo gói tập mới
        </button>
      </div>

      {feedback && (
        <div className={`feedback-bar ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

      <div className="packages-toolbar">
        <div className="filter-chips" role="group" aria-label="Lọc trạng thái">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`chip ${statusFilter === f.value ? 'chip-active' : ''}`}
              type="button"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="sport-select"
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          aria-label="Lọc bộ môn"
        >
          <option value="">Tất cả bộ môn</option>
          {SPORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            className="search-input"
            type="text"
            placeholder="Tìm kiếm tên, mã gói..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm kiếm gói tập"
          />
        </form>
      </div>

      {isLoading ? (
        <p className="empty-state">Đang tải danh mục gói tập...</p>
      ) : packages.length === 0 ? (
        <p className="empty-state">Không tìm thấy gói tập nào.</p>
      ) : (
        <div className="package-grid" id="package-grid">
          {packages.map((pkg) => (
            <article className={`package-card ${pkg.status === 'INACTIVE' ? 'card-inactive' : ''}`} key={pkg.id} data-package-id={pkg.id}>
              <div className="card-top">
                <span className={`sport-badge sport-${pkg.sportType.toLowerCase().replace(/\s+/g, '-')}`}>
                  {pkg.sportType}
                </span>
                {pkg.isBestSeller && <span className="bestseller-badge">⭐ Bán chạy nhất</span>}
                <span className={`status-badge status-${pkg.status.toLowerCase()}`}>{pkg.status === 'ACTIVE' ? 'Đang bán' : pkg.status === 'INACTIVE' ? 'Tạm dừng' : 'Lưu trữ'}</span>
              </div>

              <div className="card-body">
                <p className="pkg-code">{pkg.code}</p>
                <h2 className="pkg-name">{pkg.name}</h2>
                {pkg.description && <p className="pkg-desc">{pkg.description}</p>}
                <p className="pkg-price">{formatVND(pkg.price)}</p>
                <div className="pkg-meta">
                  <span>⏱ {formatDuration(pkg.durationDays)}</span>
                  <span>🏋️ {pkg.sessionLimit ? `${pkg.sessionLimit} buổi` : 'Không giới hạn'}</span>
                </div>
                {pkg.benefits.length > 0 && (
                  <ul className="pkg-benefits">
                    {pkg.benefits.map((b, i) => (
                      <li key={i}>✓ {b}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card-actions">
                <label className="toggle-label" htmlFor={`toggle-${pkg.id}`}>
                  <input
                    id={`toggle-${pkg.id}`}
                    type="checkbox"
                    className="toggle-input"
                    checked={pkg.status === 'ACTIVE'}
                    disabled={togglingId === pkg.id}
                    onChange={() => togglePackageStatus(pkg)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button className="edit-btn" type="button" onClick={() => openEditModal(pkg)}>
                  ✏️ Chỉnh sửa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <h2 id="modal-title">{editingPackage ? 'Chỉnh sửa gói tập' : 'Tạo gói tập mới'}</h2>
              <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="modal-form">
              {!editingPackage && (
                <>
                  <label htmlFor="pkg-code">Mã gói tập</label>
                  <input id="pkg-code" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="PKG-GYM-3M" required />
                </>
              )}
              <label htmlFor="pkg-name">Tên gói tập</label>
              <input id="pkg-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Gym Standard 3 Tháng" required />

              <label htmlFor="pkg-desc">Mô tả</label>
              <textarea id="pkg-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Mô tả ngắn gọn gói tập..." rows={2} />

              <div className="form-row">
                <div>
                  <label htmlFor="pkg-price">Giá niêm yết (VND)</label>
                  <input id="pkg-price" type="number" min="1" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="2500000" required />
                </div>
                <div>
                  <label htmlFor="pkg-duration">Thời hạn (ngày)</label>
                  <input id="pkg-duration" type="number" min="1" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="90" required />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label htmlFor="pkg-session">Số buổi tập tối đa</label>
                  <input id="pkg-session" type="number" min="1" value={formSessionLimit} onChange={(e) => setFormSessionLimit(e.target.value)} placeholder="Để trống = không giới hạn" />
                </div>
                <div>
                  <label htmlFor="pkg-sport">Bộ môn áp dụng</label>
                  <select id="pkg-sport" value={formSportType} onChange={(e) => setFormSportType(e.target.value)} required>
                    {SPORT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label htmlFor="pkg-benefits">Tiện ích tích hợp (phân tách bằng dấu phẩy)</label>
              <input id="pkg-benefits" value={formBenefits} onChange={(e) => setFormBenefits(e.target.value)} placeholder="Tủ đồ thông minh, Nước uống điện giải, Khăn tập" />

              <label className="checkbox-label" htmlFor="pkg-bestseller">
                <input id="pkg-bestseller" type="checkbox" checked={formBestSeller} onChange={(e) => setFormBestSeller(e.target.checked)} />
                Đánh dấu "Bán chạy nhất" (Best Seller)
              </label>

              {formError && <p className="error-message" role="alert">{formError}</p>}

              <button className="primary-button submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : editingPackage ? 'Cập nhật gói tập' : 'Phát hành gói tập'}{' '}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'packages'>('dashboard')

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
    setActiveTab('dashboard')
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

    // CENTER_MANAGER and other roles
    const isManager = user.role === 'CENTER_MANAGER'

    return (
      <main className="shell dashboard-shell">
        <header className="topbar">
          <div className="brand-mark">SC<span>/</span>OS</div>
          <nav className="topbar-nav">
            {isManager && (
              <>
                <button
                  className={`tab-btn ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`tab-btn ${activeTab === 'packages' ? 'tab-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('packages')}
                  id="tab-packages"
                >
                  Gói tập
                </button>
              </>
            )}
          </nav>
          <button className="ghost-button" type="button" onClick={handleLogout}>Đăng xuất</button>
        </header>

        {activeTab === 'packages' && isManager ? (
          <PackageManagement accessToken={accessToken} />
        ) : (
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
        )}
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
