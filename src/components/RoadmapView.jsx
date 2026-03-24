import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Check, X, Printer } from 'lucide-react'

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] }
]

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function RoadmapView({ projectId, user, projectName }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarterIndex, setQuarterIndex] = useState(Math.floor(new Date().getMonth() / 3))
  const [rows, setRows] = useState([])
  const [cells, setCells] = useState({})
  const [formOpen, setFormOpen] = useState(false)
  const openFlowchartWindow = useCallback(async () => {
    const rowIds = rows.map(r => r.id)
    if (!rowIds.length) return

    // 먼저 창 열기 (동기 — 팝업 차단 방지)
    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) return
    win.document.write('<html><head><title>로딩중...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#999">불러오는 중...</body></html>')

    // 전체 연도 셀 데이터 가져오기

    const { data: allCellData } = await supabase
      .from('roadmap_cells')
      .select('*')
      .in('row_id', rowIds)

    if (!allCellData || !allCellData.length) { win.close(); return }

    const allCells = {}
    allCellData.forEach(c => { allCells[`${c.row_id}-${c.year}-${c.month}`] = c })

    const hasMinorAny = rows.some(r => r.minor)

    const grouped = []
    let curMajor = null, curGroup = null
    rows.forEach(row => {
      if (row.major !== curMajor) {
        curMajor = row.major
        curGroup = { major: row.major, rows: [row] }
        grouped.push(curGroup)
      } else { curGroup.rows.push(row) }
    })

    const parseItems = (content) => {
      if (!content) return []
      try { return JSON.parse(content) }
      catch { return content ? [{ text: content, done: false }] : [] }
    }

    // 데이터 있는 연월 범위 산출
    let firstYM = null
    let lastYM = null
    allCellData.forEach(c => {
      const items = parseItems(c.content)
      if (items.length > 0) {
        const ym = c.year * 100 + c.month
        if (!firstYM || ym < firstYM) firstYM = ym
        if (!lastYM || ym > lastYM) lastYM = ym
      }
    })

    if (!firstYM) { win.close(); return }

    // 시작~끝 연월 리스트 생성
    const timeSlots = []
    const startY = Math.floor(firstYM / 100)
    const startM = firstYM % 100
    const endY = Math.floor(lastYM / 100)
    const endM = lastYM % 100
    for (let y = startY; y <= endY; y++) {
      const mFrom = (y === startY) ? startM : 1
      const mTo = (y === endY) ? endM : 12
      for (let m = mFrom; m <= mTo; m++) {
        timeSlots.push({ year: y, month: m })
      }
    }

    const getCellHtml = (rowId, y, m) => {
      const key = `${rowId}-${y}-${m}`
      const cell = allCells[key]
      if (!cell) return ''
      const items = parseItems(cell.content)
      if (!items.length) return ''
      return items.map(i =>
        `<span class="${i.done ? 'done' : ''}">${i.text}</span>`
      ).join('<br>')
    }

    const esc = (s) => (s || '').replace(/\n/g, ' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    // 월 라벨 (연도 다르면 연도 표기)
    let prevYear = null
    const makeLabel = (slot) => {
      if (slot.year !== prevYear) {
        prevYear = slot.year
        const shortY = String(slot.year).slice(2)
        return `${shortY}년 ${slot.month}월`
      }
      return `${slot.month}월`
    }

    // 헤더 1행: 구분 + 대분류
    let headerRow1 = `<th class="th-label"${hasMinorAny ? ' rowspan="2"' : ''}>구분</th>`
    grouped.forEach(g => {
      const span = g.rows.length
      const noMinor = span === 1 && !g.rows[0].minor
      const rs = !hasMinorAny ? '' : noMinor ? ' rowspan="2"' : ''
      headerRow1 += `<th class="th-major" colspan="${span}"${rs}>${esc(g.major)}</th>`
    })

    // 헤더 2행: 소분류
    let headerRow2 = ''
    if (hasMinorAny) {
      grouped.forEach(g => {
        g.rows.forEach(row => {
          if (g.rows.length === 1 && !row.minor) return
          headerRow2 += `<th class="th-minor">${esc(row.minor)}</th>`
        })
      })
    }

    // 산출물 → 담당 순서
    const outputRow = `<tr class="row-meta"><td class="td-label">최종산출물</td>${rows.map(r => `<td class="td-meta">${esc(r.output)}</td>`).join('')}</tr>`
    const assigneeRow = `<tr class="row-meta"><td class="td-label">담당</td>${rows.map(r => `<td class="td-meta">${esc(r.assignee)}</td>`).join('')}</tr>`

    // 월별 행
    const monthRows = timeSlots.map(slot =>
      `<tr><td class="td-label">${makeLabel(slot)}</td>${rows.map(r => `<td class="td-cell">${getCellHtml(r.id, slot.year, slot.month)}</td>`).join('')}</tr>`
    ).join('')

    // 타이틀 연도 범위
    const titleYear = startY === endY ? `${startY}년도` : `${startY}~${endY}년도`

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${esc(projectName)} — 업무추진 흐름도</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', sans-serif; background: #eee; color: #222; }
  .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 24px; background: #fff; border-bottom: 1px solid #ddd; }
  .toolbar-title { font-size: 13px; font-weight: 600; color: #333; }
  .toolbar button { padding: 5px 14px; font-size: 12px; font-weight: 500; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-family: inherit; color: #333; }
  .toolbar button:hover { background: #f0f0f0; }
  .toolbar .btn-print { background: #333; color: #fff; border-color: #333; }
  .toolbar .btn-print:hover { background: #555; }
  .content { padding: 32px; display: flex; justify-content: center; }
  .page { background: #fff; padding: 48px 40px; box-shadow: 0 1px 8px rgba(0,0,0,0.08); width: 100%; min-height: 210mm; }
  .title { text-align: center; font-size: clamp(13px, 1.4vw, 18px); font-weight: 700; color: #111; margin-bottom: 24px; letter-spacing: -0.3px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: clamp(8px, 1vw, 12px); line-height: 1.6; }
  th, td { border: 0.5px solid #ccc; padding: clamp(4px, 0.6vw, 10px) clamp(5px, 0.8vw, 12px); vertical-align: top; word-break: break-word; }
  tr > th:first-child, tr > td:first-child { border-left: none; }
  tr > th:last-child, tr > td:last-child { border-right: none; }
  thead tr:first-child th { border-top: none; }
  tbody tr:last-child td { border-bottom: none; }
  .th-label { width: clamp(40px, 5vw, 60px); min-width: 40px; background: #f4f4f4; font-weight: 600; text-align: center; vertical-align: middle; }
  .th-major { background: #f4f4f4; font-weight: 600; text-align: center; white-space: pre-wrap; vertical-align: middle; }
  .th-minor { background: #f7f7f7; font-weight: 500; text-align: center; white-space: pre-wrap; font-size: clamp(7px, 0.9vw, 11px); vertical-align: middle; }
  .row-meta td { background: #fafafa; }
  .td-label { background: #f4f4f4; font-weight: 600; text-align: center; white-space: nowrap; width: clamp(40px, 5vw, 60px); min-width: 40px; vertical-align: middle; }
  .td-meta { text-align: center; white-space: pre-wrap; vertical-align: middle; font-size: clamp(7px, 0.9vw, 11px); }
  .td-cell { vertical-align: top; background: #fff; }
  .done { text-decoration: line-through; color: #bbb; }
  @media print {
    .toolbar { display: none; }
    body { background: white; }
    .content { padding: 0; }
    .page { box-shadow: none; padding: 0; width: 100%; max-width: none; }
    @page { size: A4 landscape; margin: 10mm; }
    th, td { border-color: #999; }
    .title { font-size: 14px; }
  }
</style>
</head><body>
<div class="toolbar">
  <div class="toolbar-title">업무추진 흐름도</div>
  <div>
    <button class="btn-print" onclick="window.print()">PDF 출력</button>
  </div>
</div>
<div class="content">
  <div class="page">
    <h2 class="title">${esc(projectName)} — 업무추진 흐름도(${titleYear})</h2>
    <table>
      <thead>
        <tr>${headerRow1}</tr>
        ${hasMinorAny ? `<tr>${headerRow2}</tr>` : ''}
      </thead>
      <tbody>
        ${outputRow}
        ${assigneeRow}
        ${monthRows}
      </tbody>
    </table>
  </div>
</div>
</body></html>`

    win.document.open()
    win.document.write(html)
    win.document.close()
  }, [rows, projectName])

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

    const commaToNewline = (str) => str.replace(/\s*,\s*/g, '\n')

    await supabase.from('roadmap_rows').insert({
      project_id: projectId,
      major: commaToNewline(formMajor.trim()),
      minor: formMinor.trim() ? commaToNewline(formMinor.trim()) : null,
      assignee: formAssignee.trim() ? commaToNewline(formAssignee.trim()) : null,
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

  // 행 목록 인라인 수정 (blur 시 저장)
  const handleRowFieldBlur = async (id, field, value) => {
    await supabase.from('roadmap_rows')
      .update({ [field]: value.trim() || null })
      .eq('id', id)
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
            <div className="roadmap-form-hint">쉼표(,)로 구분하면 줄바꿈됩니다</div>
            {rows.length > 0 && (
              <div className="roadmap-row-list">
                {rows.map((row, idx) => (
                  <div key={row.id} className="roadmap-row-item">
                    <span className="roadmap-row-item-num">{idx + 1}</span>
                    <input className="roadmap-form-input major" defaultValue={row.major}
                      onBlur={e => handleRowFieldBlur(row.id, 'major', e.target.value)}
                      placeholder="업무 (대분류)" />
                    <input className="roadmap-form-input" defaultValue={row.minor || ''}
                      onBlur={e => handleRowFieldBlur(row.id, 'minor', e.target.value)}
                      placeholder="업무 (소분류)" />
                    <input className="roadmap-form-input" defaultValue={row.assignee || ''}
                      onBlur={e => handleRowFieldBlur(row.id, 'assignee', e.target.value)}
                      placeholder="담당자" />
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

      {/* 테이블 카드 */}
      <div className="roadmap-table-card">
        <div className="roadmap-toolbar">
          <div className="roadmap-nav">
            <button className="btn btn-ghost btn-sm" onClick={handlePrevQuarter}><ChevronLeft size={16} /></button>
            <span className="roadmap-nav-label">{year}년 {quarter.label}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleNextQuarter}><ChevronRight size={16} /></button>
          </div>
          {rows.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={openFlowchartWindow}>
              <Printer size={14} /> 흐름도
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '40px', paddingBottom: '40px' }}>
            <div className="empty-state-title">업무추진표가 비어있어요</div>
            <div className="empty-state-desc">TASK를 열어 업무를 추가하세요</div>
          </div>
        ) : (
          <div className="roadmap-table-wrapper">
            <table className="roadmap-table">
              <thead>
              <tr>
                <th className="roadmap-th-major" colSpan={2}>업무</th>
                <th className="roadmap-th-output">산출물</th>
                <th className="roadmap-th-assignee">담당</th>
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
                    <td className="roadmap-td-output">{renderField(row, 'output')}</td>
                    <td className="roadmap-td-assignee">{renderField(row, 'assignee')}</td>
                    {quarter.months.map(m => {
                      const key = getCellKey(row.id, m)
                      const cell = cells[key]
                      const items = parseCellItems(cell?.content)
                      const isEditing = editingCell === key

                      return (
                        <td key={m} className="roadmap-td-cell"
                          onClick={() => { if (!isEditing) { setEditingCell(key); setEditingCellValue('') } }}>
                          <div className="roadmap-checklist">
                            {items.map((item, idx) => (
                              <div key={idx} className={`roadmap-check-item ${item.done ? 'done' : ''}`} onClick={e => e.stopPropagation()}>
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
                            {isEditing && (
                              <textarea className="roadmap-check-input" value={editingCellValue}
                                onChange={e => setEditingCellValue(e.target.value)}
                                onKeyDown={e => handleCellInputKeyDown(e, row.id, m)}
                                onBlur={() => { if (!editingCellValue.trim()) { setEditingCell(null) } }}
                                onClick={e => e.stopPropagation()}
                                placeholder="Enter: 추가 / Shift+Enter: 줄바꿈"
                                rows={1}
                                autoFocus />
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

    </div>
  )
}

export default RoadmapView
