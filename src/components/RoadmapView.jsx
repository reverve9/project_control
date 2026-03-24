import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Check, X } from 'lucide-react'

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] }
]

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function RoadmapView({ projectId, user }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarterIndex, setQuarterIndex] = useState(Math.floor(new Date().getMonth() / 3))
  const [rows, setRows] = useState([])
  const [cells, setCells] = useState({})
  const [formOpen, setFormOpen] = useState(false)

  // 입력 폼
  const [formMajor, setFormMajor] = useState('')
  const [formMinor, setFormMinor] = useState('')
  const [formAssignee, setFormAssignee] = useState('')

  // 인라인 편집
  const [editingCell, setEditingCell] = useState(null)
  const [editingCellValue, setEditingCellValue] = useState('')
  const [editingField, setEditingField] = useState(null)
  const [editingFieldValue, setEditingFieldValue] = useState('')

  const quarter = QUARTERS[quarterIndex]

  const fetchData = useCallback(async () => {
    const { data: rowData } = await supabase
      .from('roadmap_rows')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    const { data: cellData } = await supabase
      .from('roadmap_cells')
      .select('*')
      .eq('year', year)

    setRows(rowData || [])

    const cellMap = {}
    if (cellData) cellData.forEach(c => { cellMap[`${c.row_id}-${c.month}`] = c })
    setCells(cellMap)
  }, [year, projectId])

  useEffect(() => { fetchData() }, [fetchData])

  // 분기 이동
  const handlePrevQuarter = () => {
    if (quarterIndex === 0) { setYear(y => y - 1); setQuarterIndex(3) }
    else setQuarterIndex(q => q - 1)
  }
  const handleNextQuarter = () => {
    if (quarterIndex === 3) { setYear(y => y + 1); setQuarterIndex(0) }
    else setQuarterIndex(q => q + 1)
  }

  // 행 추가
  const handleAddRow = async () => {
    if (!formMajor.trim()) return
    const maxOrder = rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0)

    await supabase.from('roadmap_rows').insert({
      project_id: projectId,
      major: formMajor.trim(),
      minor: formMinor.trim() || null,
      assignee: formAssignee.trim() || null,
      user_id: user.id,
      sort_order: maxOrder + 1
    })

    setFormMajor('')
    setFormMinor('')
    setFormAssignee('')
    await fetchData()
  }

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAddRow()
    }
  }

  // 행 순서 변경
  const handleMoveRow = async (id, direction) => {
    const idx = rows.findIndex(r => r.id === id)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= rows.length) return

    const current = rows[idx]
    const target = rows[targetIdx]

    await Promise.all([
      supabase.from('roadmap_rows').update({ sort_order: target.sort_order }).eq('id', current.id),
      supabase.from('roadmap_rows').update({ sort_order: current.sort_order }).eq('id', target.id)
    ])
    await fetchData()
  }

  // 행 삭제
  const handleDeleteRow = async (id) => {
    if (!window.confirm('이 행을 삭제할까요?')) return
    await supabase.from('roadmap_rows').delete().eq('id', id)
    await fetchData()
  }

  // 필드 인라인 수정
  const handleStartFieldEdit = (id, field, value) => {
    setEditingField({ id, field })
    setEditingFieldValue(value || '')
  }

  const handleSaveField = async () => {
    if (!editingField) return
    const { id, field } = editingField
    await supabase.from('roadmap_rows')
      .update({ [field]: editingFieldValue.trim() || null })
      .eq('id', id)
    setEditingField(null)
    await fetchData()
  }

  const handleFieldKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSaveField() }
    if (e.key === 'Escape') setEditingField(null)
  }

  const renderField = (row, field) => {
    const isEditing = editingField?.id === row.id && editingField?.field === field
    const value = row[field]

    if (isEditing) {
      return (
        <textarea className="roadmap-field-input" value={editingFieldValue}
          onChange={e => setEditingFieldValue(e.target.value)}
          onBlur={handleSaveField}
          onKeyDown={handleFieldKeyDown}
          rows={Math.max(1, (editingFieldValue || '').split('\n').length)}
          autoFocus />
      )
    }
    return (
      <span className={`roadmap-field-text ${!value ? 'empty' : ''}`}
        onClick={() => handleStartFieldEdit(row.id, field, value)}>
        {value || '-'}
      </span>
    )
  }

  // 셀 체크리스트
  const getCellKey = (rowId, month) => `${rowId}-${month}`

  const parseCellItems = (content) => {
    if (!content) return []
    try { return JSON.parse(content) }
    catch { return content ? [{ text: content, done: false }] : [] }
  }

  const saveCellContent = async (rowId, month, items) => {
    const key = getCellKey(rowId, month)
    const existing = cells[key]
    const filtered = items.filter(i => i.text.trim())

    if (filtered.length === 0 && existing) {
      await supabase.from('roadmap_cells').delete().eq('id', existing.id)
    } else if (filtered.length > 0) {
      const content = JSON.stringify(filtered)
      if (existing) {
        await supabase.from('roadmap_cells').update({ content }).eq('id', existing.id)
      } else {
        await supabase.from('roadmap_cells').insert({
          row_id: rowId, year, month, content, user_id: user.id
        })
      }
    }
    await fetchData()
  }

  const handleToggleCellItem = async (rowId, month, itemIndex) => {
    const key = getCellKey(rowId, month)
    const items = parseCellItems(cells[key]?.content)
    items[itemIndex] = { ...items[itemIndex], done: !items[itemIndex].done }
    await saveCellContent(rowId, month, items)
  }

  const handleDeleteCellItem = async (rowId, month, itemIndex) => {
    const key = getCellKey(rowId, month)
    const items = parseCellItems(cells[key]?.content)
    items.splice(itemIndex, 1)
    await saveCellContent(rowId, month, items)
  }

  const handleAddCellItem = async (rowId, month) => {
    if (!editingCellValue.trim()) return
    const key = getCellKey(rowId, month)
    const items = parseCellItems(cells[key]?.content)
    items.push({ text: editingCellValue.trim(), done: false })
    await saveCellContent(rowId, month, items)
    setEditingCellValue('')
  }

  const handleCellInputKeyDown = (e, rowId, month) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleAddCellItem(rowId, month)
    }
    if (e.key === 'Escape') {
      setEditingCell(null)
      setEditingCellValue('')
    }
  }

  // 대분류 기준 rowspan
  const groupedRows = []
  let currentMajor = null
  let currentGroup = null

  rows.forEach(row => {
    if (row.major !== currentMajor) {
      currentMajor = row.major
      currentGroup = { major: row.major, rows: [row] }
      groupedRows.push(currentGroup)
    } else {
      currentGroup.rows.push(row)
    }
  })

  return (
    <div className="roadmap-container">
      {/* TASK 아코디언 카드 */}
      <div className="roadmap-card">
        <div className="roadmap-card-header" onClick={() => setFormOpen(!formOpen)}>
          <span className="roadmap-card-title">TASK</span>
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {formOpen && (
          <div className="roadmap-card-body">
            <div className="roadmap-form">
              <input className="roadmap-form-input major" value={formMajor}
                onChange={e => setFormMajor(e.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="업무 (대분류)" />
              <input className="roadmap-form-input" value={formMinor}
                onChange={e => setFormMinor(e.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="업무 (소분류)" />
              <input className="roadmap-form-input" value={formAssignee}
                onChange={e => setFormAssignee(e.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="담당자" />
              <button className="btn btn-primary btn-sm" onClick={handleAddRow}
                disabled={!formMajor.trim()}>
                <Plus size={14} /> 추가
              </button>
            </div>
            {rows.length > 0 && (
              <div className="roadmap-row-list">
                {rows.map((row, idx) => (
                  <div key={row.id} className="roadmap-row-item">
                    <span className="roadmap-row-item-num">{idx + 1}</span>
                    <span className="roadmap-row-item-major">{row.major}</span>
                    {row.minor && <span className="roadmap-row-item-minor">{row.minor}</span>}
                    {row.assignee && <span className="roadmap-row-item-assignee">{row.assignee}</span>}
                    <div className="roadmap-row-item-actions">
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'up')} disabled={idx === 0}><ArrowUp size={11} /></button>
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'down')} disabled={idx === rows.length - 1}><ArrowDown size={11} /></button>
                      <button className="roadmap-mini-btn delete" onClick={() => handleDeleteRow(row.id)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 분기 네비게이션 */}
      <div className="roadmap-toolbar">
        <div className="roadmap-nav">
          <button className="btn btn-ghost btn-sm" onClick={handlePrevQuarter}><ChevronLeft size={16} /></button>
          <span className="roadmap-nav-label">{year}년 {quarter.label}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleNextQuarter}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* 테이블 */}
      {rows.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="empty-state-title">업무추진표가 비어있어요</div>
          <div className="empty-state-desc">TASK를 열어 업무를 추가하세요</div>
        </div>
      ) : (
        <div className="roadmap-table-wrapper">
          <table className="roadmap-table">
            <thead>
              <tr>
                <th className="roadmap-th-major" colSpan={2}>업무</th>
                <th className="roadmap-th-assignee">담당</th>
                <th className="roadmap-th-output">산출물</th>
                {quarter.months.map(m => (
                  <th key={m} className="roadmap-th-month">{MONTH_NAMES[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(group => {
                const hasMinor = group.rows.some(r => r.minor)
                return group.rows.map((row, ri) => (
                  <tr key={row.id}>
                    {ri === 0 && (
                      <td className="roadmap-td-major" rowSpan={group.rows.length} colSpan={hasMinor ? 1 : 2}>
                        {renderField(row, 'major')}
                      </td>
                    )}
                    {hasMinor && <td className="roadmap-td-minor">{renderField(row, 'minor')}</td>}
                    <td className="roadmap-td-assignee">{renderField(row, 'assignee')}</td>
                    <td className="roadmap-td-output">{renderField(row, 'output')}</td>
                    {quarter.months.map(m => {
                      const key = getCellKey(row.id, m)
                      const cell = cells[key]
                      const items = parseCellItems(cell?.content)
                      const isEditing = editingCell === key

                      return (
                        <td key={m} className="roadmap-td-cell">
                          <div className="roadmap-checklist">
                            {items.map((item, idx) => (
                              <div key={idx} className={`roadmap-check-item ${item.done ? 'done' : ''}`}>
                                <div
                                  className={`roadmap-check-box ${item.done ? 'checked' : ''}`}
                                  onClick={() => handleToggleCellItem(row.id, m, idx)}
                                >
                                  {item.done && <Check size={8} strokeWidth={2.5} />}
                                </div>
                                <span className="roadmap-check-text">{item.text}</span>
                                <div className="roadmap-popover">{item.text}</div>
                                <button className="roadmap-check-delete" onClick={() => handleDeleteCellItem(row.id, m, idx)}>
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            {isEditing ? (
                              <textarea className="roadmap-check-input" value={editingCellValue}
                                onChange={e => setEditingCellValue(e.target.value)}
                                onKeyDown={e => handleCellInputKeyDown(e, row.id, m)}
                                onBlur={() => { if (!editingCellValue.trim()) { setEditingCell(null) } }}
                                placeholder="Enter: 추가 / Shift+Enter: 줄바꿈"
                                rows={1}
                                autoFocus />
                            ) : (
                              <div className="roadmap-check-empty" onClick={() => { setEditingCell(key); setEditingCellValue('') }} />
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RoadmapView
