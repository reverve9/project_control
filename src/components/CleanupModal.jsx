import { useState } from 'react'
import { RefreshCw, Check, Trash2, Archive, X, ChevronLeft, ChevronRight } from 'lucide-react'

function CleanupModal({ memos, onRestart, onComplete, onDelete, onArchive, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!memos || memos.length === 0) {
    return null
  }

  const currentMemo = memos[currentIndex]
  const totalCount = memos.length

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  }

  const getDaysAgo = (dateStr) => {
    if (!dateStr) return 0
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return Math.floor((today - date) / (1000 * 60 * 60 * 24))
  }

  const handleAction = (action) => {
    switch (action) {
      case 'restart':
        onRestart(currentMemo.id)
        break
      case 'complete':
        onComplete(currentMemo.id)
        break
      case 'delete':
        onDelete(currentMemo.projectId, currentMemo.id)
        break
      case 'archive':
        onArchive && onArchive(currentMemo.id)
        break
    }

    // 다음 메모로 이동하거나 모달 닫기
    if (currentIndex < totalCount - 1) {
      // 다음으로 넘어가지 않고 같은 인덱스 유지 (삭제되어서 다음 것이 현재 위치로 옴)
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal cleanup-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            정리 필요 ({currentIndex + 1} / {totalCount})
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="cleanup-memo-info">
            <div className="cleanup-memo-title">{currentMemo.title}</div>
            <div className="cleanup-memo-meta">
              <span 
                className="project-color" 
                style={{ 
                  backgroundColor: currentMemo.projectColor,
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  marginRight: '6px'
                }}
              />
              {currentMemo.projectName} · {getDaysAgo(currentMemo.started_at)}일 전 시작
            </div>
          </div>

          <div className="cleanup-actions">
            <button 
              className="cleanup-btn restart"
              onClick={() => handleAction('restart')}
            >
              <RefreshCw />
              <span>다시 시작</span>
            </button>
            <button 
              className="cleanup-btn complete"
              onClick={() => handleAction('complete')}
            >
              <Check />
              <span>완료 처리</span>
            </button>
            <button 
              className="cleanup-btn delete"
              onClick={() => handleAction('delete')}
            >
              <Trash2 />
              <span>삭제</span>
            </button>
            <button 
              className="cleanup-btn archive"
              onClick={() => handleAction('archive')}
            >
              <Archive />
              <span>보관</span>
            </button>
          </div>
        </div>

        {totalCount > 1 && (
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button 
              className="btn btn-ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
              이전
            </button>
            <button 
              className="btn btn-ghost"
              onClick={handleNext}
              disabled={currentIndex === totalCount - 1}
            >
              다음
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CleanupModal
