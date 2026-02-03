import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, LogOut, Palette, Users, UserCheck, UserX, Copy, RefreshCw } from 'lucide-react'

function SettingsPanel({ user, userProfile, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('general')
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const isAdmin = userProfile?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchInviteCode()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    const { data: pending } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false })

    const { data: approved } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('approved', true)
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    setPendingUsers(pending || [])
    setApprovedUsers(approved || [])
  }

  const fetchInviteCode = async () => {
    const { data } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('created_by', user.id)
      .eq('active', true)
      .single()

    if (data) {
      setInviteCode(data.code)
    }
  }

  const generateInviteCode = async () => {
    setLoading(true)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()

    // 기존 코드 비활성화
    await supabase
      .from('invite_codes')
      .update({ active: false })
      .eq('created_by', user.id)

    // 새 코드 생성
    const { error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        created_by: user.id,
        active: true
      })

    if (!error) {
      setInviteCode(code)
    }
    setLoading(false)
  }

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const approveUser = async (userId) => {
    await supabase
      .from('user_profiles')
      .update({ approved: true })
      .eq('id', userId)

    fetchUsers()
  }

  const rejectUser = async (userId) => {
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    // auth.users에서도 삭제 (관리자 권한 필요 - 서버 함수로 처리해야 할 수 있음)
    fetchUsers()
  }

  const revokeUser = async (userId) => {
    await supabase
      .from('user_profiles')
      .update({ approved: false })
      .eq('id', userId)

    fetchUsers()
  }

  const handleOpenStyleGuide = () => {
    window.electronAPI?.openStyleGuide?.()
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">설정</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isAdmin && (
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              일반
            </button>
            <button
              className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              사용자 관리
            </button>
            <button
              className={`settings-tab ${activeTab === 'invite' ? 'active' : ''}`}
              onClick={() => setActiveTab('invite')}
            >
              초대
            </button>
          </div>
        )}

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="settings-info">
                <span className="settings-label">로그인 계정</span>
                <span className="settings-value">{user?.email}</span>
              </div>

              {isAdmin && (
                <button className="settings-item" onClick={handleOpenStyleGuide}>
                  <Palette size={18} />
                  <span>스타일 가이드 열기</span>
                </button>
              )}

              <button className="settings-item danger" onClick={onLogout}>
                <LogOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="settings-section">
              <h3 className="settings-section-title">
                <UserCheck size={16} />
                승인 대기 ({pendingUsers.length})
              </h3>
              {pendingUsers.length === 0 ? (
                <p className="settings-empty">승인 대기 중인 사용자가 없습니다.</p>
              ) : (
                <ul className="user-list">
                  {pendingUsers.map(u => (
                    <li key={u.id} className="user-item">
                      <span className="user-email">{u.email}</span>
                      <div className="user-actions">
                        <button
                          className="user-action-btn approve"
                          onClick={() => approveUser(u.id)}
                        >
                          <UserCheck size={14} />
                          승인
                        </button>
                        <button
                          className="user-action-btn reject"
                          onClick={() => rejectUser(u.id)}
                        >
                          <UserX size={14} />
                          거절
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="settings-section-title" style={{ marginTop: '24px' }}>
                <Users size={16} />
                승인된 사용자 ({approvedUsers.length})
              </h3>
              {approvedUsers.length === 0 ? (
                <p className="settings-empty">승인된 사용자가 없습니다.</p>
              ) : (
                <ul className="user-list">
                  {approvedUsers.map(u => (
                    <li key={u.id} className="user-item">
                      <span className="user-email">{u.email}</span>
                      <button
                        className="user-action-btn revoke"
                        onClick={() => revokeUser(u.id)}
                      >
                        권한 취소
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'invite' && isAdmin && (
            <div className="settings-section">
              <h3 className="settings-section-title">초대 코드</h3>
              <p className="settings-desc">
                초대 코드로 가입한 사용자는 자동 승인됩니다.
              </p>

              {inviteCode ? (
                <div className="invite-code-box">
                  <code className="invite-code">{inviteCode}</code>
                  <button
                    className={`invite-copy-btn ${copied ? 'copied' : ''}`}
                    onClick={copyInviteCode}
                  >
                    <Copy size={14} />
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
              ) : (
                <p className="settings-empty">활성화된 초대 코드가 없습니다.</p>
              )}

              <button
                className="btn btn-secondary"
                onClick={generateInviteCode}
                disabled={loading}
                style={{ marginTop: '12px' }}
              >
                <RefreshCw size={14} />
                {inviteCode ? '새 코드 생성' : '초대 코드 생성'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
