import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, User, LogIn, Ticket } from 'lucide-react'

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isLogin) {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        onAuthSuccess(data.user)
      } else {
        // 회원가입
        let autoApprove = false

        // 초대 코드 확인
        if (inviteCode.trim()) {
          const { data: codeData } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', inviteCode.trim().toUpperCase())
            .eq('active', true)
            .single()

          if (codeData) {
            autoApprove = true
          } else {
            throw new Error('유효하지 않은 초대 코드입니다.')
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })
        if (error) throw error

        // 프로필 생성
        if (data.user) {
          await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: 'user',
              approved: autoApprove,
              invite_code: inviteCode.trim().toUpperCase() || null
            })

          if (autoApprove) {
            onAuthSuccess(data.user)
          } else {
            setMessage('가입이 완료되었습니다. 관리자 승인 후 사용 가능합니다.')
          }
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="./app-icon.png" alt="PC" className="auth-logo" />
          <h1 className="auth-title">Project Control</h1>
          <p className="auth-subtitle">
            {isLogin ? '로그인하여 시작하세요' : '계정을 만들어 시작하세요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-input-group">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                required={!isLogin}
              />
            </div>
          )}

          <div className="auth-input-group">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="auth-input-group">
              <Ticket size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="초대 코드 (선택)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="auth-input"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            <LogIn size={18} />
            {loading ? '처리중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <span>{isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}</span>
          <button 
            type="button" 
            className="auth-switch-btn"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setMessage('')
            }}
          >
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
