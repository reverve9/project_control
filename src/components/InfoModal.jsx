import { useState, useEffect } from 'react'
import { Link, FileText } from 'lucide-react'

function InfoModal({ info, onSave, onClose }) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (info) {
      setLabel(info.label || '')
      setUrl(info.value || '')
      setMemo(info.memo || '')
    } else {
      setLabel('')
      setUrl('')
      setMemo('')
    }
  }, [info])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('InfoModal handleSubmit called, label:', label)
    if (!label.trim()) return

    const data = {
      type: 'info',
      label: label.trim(),
      value: url.trim() || null,
      memo: memo.trim() || null
    }
    console.log('InfoModal onSave data:', data)
    onSave(data)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {info ? '인포 수정' : '새 인포'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">제목</label>
              <input
                type="text"
                className="form-input"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="제목을 입력하세요"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Link size={14} strokeWidth={1.5} />
                URL
                <span className="form-label-optional">선택</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={14} strokeWidth={1.5} />
                메모
                <span className="form-label-optional">선택</span>
              </label>
              <textarea
                className="form-input form-textarea"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="참고사항을 입력하세요"
                rows={4}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!label.trim()}
            >
              {info ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InfoModal
