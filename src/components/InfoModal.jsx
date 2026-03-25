import { useState, useEffect } from 'react'
import { Link, FileText, Paperclip } from 'lucide-react'

function InfoModal({ info, onSave, onClose }) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [attachment, setAttachment] = useState('')

  useEffect(() => {
    if (info) {
      setLabel(info.label || '')
      setUrl(info.value || '')
      setMemo(info.memo || '')
      setAttachment(info.attachment || '')
    } else {
      setLabel('')
      setUrl('')
      setMemo('')
      setAttachment('')
    }
  }, [info])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim()) return

    onSave({
      type: 'info',
      label: label.trim(),
      value: url.trim() || null,
      memo: memo.trim() || null,
      attachment: attachment.trim() || null
    })
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
                placeholder="예: GitHub, 스테이징 서버, API 문서"
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
                placeholder="https://..."
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
                placeholder="아이디, 비밀번호, 참고사항 등"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Paperclip size={14} strokeWidth={1.5} />
                첨부 링크
                <span className="form-label-optional">선택</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={attachment}
                onChange={e => setAttachment(e.target.value)}
                placeholder="NAS 경로 또는 파일 URL"
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
