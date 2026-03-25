import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Check, X, Printer, Link } from 'lucide-react'

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] }
]

const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function RoadmapView({ projectIds, projects, user, assignmentName }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarterIndex, setQuarterIndex] = useState(Math.floor(new Date().getMonth() / 3))
  const [rows, setRows] = useState([])
  const [cells, setCells] = useState({})
  const [formOpen, setFormOpen] = useState(false)

  // 프로젝트/태스크 데이터 다이제스트 (실제 변경 시에만 sync)
  const projectsDigest = useMemo(() => {
    if (!projects) return ''
    return projects.map(p =>
      p.id + ':' + p.name + ':' + (p.tasks || []).map(t =>
        t.id + '.' + t.title + '.' + (t.assignee || '')
      ).join(',')
    ).join(';')
  }, [projects])

  const projectsRef = useRef(projects)
  projectsRef.current = projects

  const openFlowchartWindow = useCallback(async () => {
    const rowIds = rows.map(r => r.id)
    if (!rowIds.length) return

    // 먼저 창 열기 (동기 — 팝업 차단 방지)
    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) return
    win.document.write('<html><head><title>로딩중...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#999">불러오는 중...</body></html>')

    try {

    // 전체 연도 셀 데이터 가져오기
    let allCellData = []
    if (rowIds.length > 0) {
      const { data, error } = await supabase
        .from('roadmap_cells')
        .select('*')
        .in('row_id', rowIds)
      if (!error && data) allCellData = data
    }

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

    // 데이터 있는 연월 범위 산출 (없으면 현재 연도 1~12월)
    let firstYM = null
    let lastYM = null
    ;(allCellData || []).forEach(c => {
      const items = parseItems(c.content)
      if (items.length > 0) {
        const ym = c.year * 100 + c.month
        if (!firstYM || ym < firstYM) firstYM = ym
        if (!lastYM || ym > lastYM) lastYM = ym
      }
    })

    // 셀 데이터가 없으면 현재 연도 전체 표시
    if (!firstYM) {
      const curYear = new Date().getFullYear()
      firstYM = curYear * 100 + 1
      lastYM = curYear * 100 + 12
    }

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
    const assigneeRow = `<tr class="row-meta row-assignee"><td class="td-label">담당</td>${rows.map(r => `<td class="td-meta">${esc(r.assignee)}</td>`).join('')}</tr>`

    // 월별 행
    const monthRows = timeSlots.map(slot =>
      `<tr><td class="td-label">${makeLabel(slot)}</td>${rows.map(r => `<td class="td-cell">${getCellHtml(r.id, slot.year, slot.month)}</td>`).join('')}</tr>`
    ).join('')

    // 타이틀 연도 범위
    const titleYear = startY === endY ? `${startY}년도` : `${startY}~${endY}년도`

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${esc(assignmentName)} — 업무추진 흐름도</title>
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
  th, td { border: 0.5px solid #ccc; padding: clamp(6px, 0.8vw, 12px) clamp(5px, 0.8vw, 12px); vertical-align: top; word-break: keep-all; overflow-wrap: break-word; }
  tr > th:first-child, tr > td:first-child { border-left: 0.5px solid #eee; }
  tr > th:last-child, tr > td:last-child { border-right: none; }
  thead tr:first-child th { border-top: 2px solid #000; }
  tbody tr:last-child td { border-bottom: 2px solid #000; }
  .th-label, .td-label { border-right: 1px solid #000; border-left: none; }
  .row-assignee td { border-bottom: 1px solid #000; }
  .th-label { width: clamp(68px, 7vw, 88px); min-width: 68px; background: #f0f0f0; font-weight: 600; text-align: center; vertical-align: middle; white-space: nowrap; }
  .th-major { background: #f0f0f0; font-weight: 600; text-align: center; white-space: pre-wrap; vertical-align: middle; }
  .th-minor { background: #f0f0f0; font-weight: 500; text-align: center; white-space: pre-wrap; font-size: clamp(7px, 0.9vw, 11px); vertical-align: middle; }
  .row-meta td { background: #f0f0f0; }
  .td-label { background: #f0f0f0; font-weight: 600; text-align: center; width: clamp(68px, 7vw, 88px); min-width: 68px; vertical-align: middle; white-space: nowrap; }
  .td-meta { text-align: center; white-space: pre-wrap; vertical-align: middle; font-size: clamp(7px, 0.9vw, 11px); background: #f0f0f0; }
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
    <h2 class="title">${esc(assignmentName)} — 업무추진 흐름도(${titleYear})</h2>
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

    } catch (err) {
      console.error('흐름도 생성 오류:', err)
      win.document.open()
      win.document.write(`<html><body style="font-family:sans-serif;padding:40px;color:#c00"><h3>오류 발생</h3><pre>${err.message}</pre></body></html>`)
      win.document.close()
    }
  }, [rows, assignmentName])

  // 수동 입력 폼
  const [formMajor, setFormMajor] = useState('')
  const [formMinor, setFormMinor] = useState('')
  const [formAssignee, setFormAssignee] = useState('')

  // 인라인 편집
  const [editingCell, setEditingCell] = useState(null)
  const [editingCellValue, setEditingCellValue] = useState('')
  const [editingField, setEditingField] = useState(null)
  const [editingFieldValue, setEditingFieldValue] = useState('')

  const quarter = QUARTERS[quarterIndex]

  // 자동 연동 동기화: 프로젝트→태스크 → roadmap_rows
  const syncAutoRows = useCallback(async () => {
    const currentProjects = projectsRef.current
    if (!currentProjects?.length || !projectIds?.length) return

    try {

    const { data: existingAuto, error: syncErr } = await supabase
      .from('roadmap_rows')
      .select('id, task_id, major, minor, assignee, sort_order')
      .in('project_id', projectIds)
      .not('task_id', 'is', null)

    // task_id 컬럼이 없으면 동기화 건너뜀
    if (syncErr) { console.warn('syncAutoRows skip:', syncErr.message); return }

    const existingByTaskId = {}
    ;(existingAuto || []).forEach(r => { existingByTaskId[r.task_id] = r })

    // 프로젝트→태스크에서 기대하는 자동 행 목록
    const expected = []
    currentProjects.forEach(project => {
      const tasks = project.tasks || []
      if (tasks.length === 0) {
        // 태스크 없는 프로젝트도 대분류로 표시
        expected.push({
          projectId: project.id,
          taskId: project.id,
          major: project.name,
          minor: null,
          assignee: null
        })
      } else {
        tasks.forEach(task => {
          expected.push({
            projectId: project.id,
            taskId: task.id,
            major: project.name,
            minor: task.title,
            assignee: task.assignee || null
          })
        })
      }
    })

    const expectedTaskIds = new Set(expected.map(e => e.taskId))

    // 삭제된 태스크의 자동 행 제거
    const staleIds = (existingAuto || []).filter(r => !expectedTaskIds.has(r.task_id)).map(r => r.id)
    if (staleIds.length) {
      await supabase.from('roadmap_rows').delete().in('id', staleIds)
    }

    // 새 태스크의 자동 행 추가 (프로젝트 순서에 맞춰)
    const toInsert = expected.filter(e => !existingByTaskId[e.taskId])
    if (toInsert.length) {
      await supabase.from('roadmap_rows').insert(
        toInsert.map(e => ({
          project_id: e.projectId,
          task_id: e.taskId,
          major: e.major,
          minor: e.minor,
          assignee: e.assignee,
          user_id: user.id,
          sort_order: expected.indexOf(e)
        }))
      )
    }

    // 프로젝트/태스크 이름 변경 + 순서 반영
    const updatePromises = []
    expected.forEach((e, idx) => {
      const ex = existingByTaskId[e.taskId]
      if (!ex) return
      const needsUpdate = ex.major !== e.major || ex.minor !== e.minor || ex.assignee !== e.assignee || ex.sort_order !== idx
      if (needsUpdate) {
        updatePromises.push(
          supabase.from('roadmap_rows').update({
            major: e.major, minor: e.minor, assignee: e.assignee, sort_order: idx
          }).eq('id', ex.id)
        )
      }
    })
    if (updatePromises.length) {
      await Promise.all(updatePromises)
    }

    // 수동 행은 자동 행 뒤로 배치
    const { data: manualRows } = await supabase
      .from('roadmap_rows')
      .select('id, sort_order')
      .in('project_id', projectIds)
      .is('task_id', null)
      .order('sort_order', { ascending: true })

    if (manualRows?.length) {
      const manualUpdates = []
      manualRows.forEach((r, i) => {
        const newOrder = expected.length + i
        if (r.sort_order !== newOrder) {
          manualUpdates.push(
            supabase.from('roadmap_rows').update({ sort_order: newOrder }).eq('id', r.id)
          )
        }
      })
      if (manualUpdates.length) await Promise.all(manualUpdates)
    }

    } catch (err) { console.warn('syncAutoRows error:', err) }
  }, [JSON.stringify(projectIds), user?.id])

  const fetchData = useCallback(async () => {
    if (!projectIds || projectIds.length === 0) {
      setRows([])
      setCells({})
      return
    }

    const { data: rowData } = await supabase
      .from('roadmap_rows')
      .select('*')
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true })

    const rowIds = (rowData || []).map(r => r.id)
    let cellData = []
    if (rowIds.length > 0) {
      const { data } = await supabase
        .from('roadmap_cells')
        .select('*')
        .in('row_id', rowIds)
        .eq('year', year)
      cellData = data || []
    }

    setRows(rowData || [])

    const cellMap = {}
    cellData.forEach(c => { cellMap[`${c.row_id}-${c.month}`] = c })
    setCells(cellMap)
  }, [year, JSON.stringify(projectIds)])

  // 프로젝트/태스크 변경 시 자동 동기화 후 데이터 재조회
  useEffect(() => {
    const run = async () => {
      await syncAutoRows()
      await fetchData()
    }
    run()
  }, [projectsDigest, syncAutoRows, fetchData])

  // 연도/분기 변경 시 데이터 재조회
  useEffect(() => { fetchData() }, [fetchData])

  // 자동 행 판별
  const isAutoRow = (row) => !!row.task_id

  // 분기 이동
  const handlePrevQuarter = () => {
    if (quarterIndex === 0) { setYear(y => y - 1); setQuarterIndex(3) }
    else setQuarterIndex(q => q - 1)
  }
  const handleNextQuarter = () => {
    if (quarterIndex === 3) { setYear(y => y + 1); setQuarterIndex(0) }
    else setQuarterIndex(q => q + 1)
  }

  // 수동 행 추가
  const handleAddRow = async () => {
    if (!formMajor.trim()) return
    const maxOrder = rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0)

    const commaToNewline = (str) => str.replace(/\s*,\s*/g, '\n')

    await supabase.from('roadmap_rows').insert({
      project_id: projectIds[0],
      task_id: null,
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

  // 행 삭제 (수동 행만)
  const handleDeleteRow = async (id) => {
    if (!window.confirm('이 행을 삭제할까요?')) return
    await supabase.from('roadmap_rows').delete().eq('id', id)
    await fetchData()
  }

  // 행 목록 인라인 수정 (blur 시 저장, 수동 행만)
  const handleRowFieldBlur = async (id, field, value) => {
    await supabase.from('roadmap_rows')
      .update({ [field]: value.trim() || null })
      .eq('id', id)
    await fetchData()
  }

  // 테이블 필드 인라인 수정
  const handleStartFieldEdit = (id, field, value) => {
    // 자동 행의 major/minor/assignee는 편집 불가
    const row = rows.find(r => r.id === id)
    if (row && isAutoRow(row) && ['major', 'minor', 'assignee'].includes(field)) return

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
    // 자동 행의 major/minor/assignee → 읽기 전용
    if (isAutoRow(row) && ['major', 'minor', 'assignee'].includes(field)) {
      return (
        <span className="roadmap-field-text">
          {row[field] || '-'}
        </span>
      )
    }

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

  // 자동/수동 행 분리 (아코디언 목록용)
  const autoRows = rows.filter(r => isAutoRow(r))
  const manualRows = rows.filter(r => !isAutoRow(r))

  return (
    <div className="roadmap-container">
      {/* TASK 아코디언 카드 */}
      <div className="roadmap-card">
        <div className="roadmap-card-header" onClick={() => setFormOpen(!formOpen)}>
          <span className="roadmap-card-title">PROJECT</span>
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {formOpen && (
          <div className="roadmap-card-body">
            {/* 자동 연동 행 목록 */}
            {autoRows.length > 0 && (
              <div className="roadmap-row-list">
                <div className="roadmap-section-label">
                  <Link size={12} />
                  <span>프로젝트 연동</span>
                </div>
                {autoRows.map((row, idx) => (
                  <div key={row.id} className="roadmap-row-item auto">
                    <span className="roadmap-row-item-num">{idx + 1}</span>
                    <span className="roadmap-row-item-text major">{row.major}</span>
                    <span className="roadmap-row-item-text">{row.minor || '-'}</span>
                    <span className="roadmap-row-item-text">{row.assignee || '-'}</span>
                    <div className="roadmap-row-item-actions">
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'up')}
                        disabled={rows.indexOf(row) === 0}><ArrowUp size={11} /></button>
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'down')}
                        disabled={rows.indexOf(row) === rows.length - 1}><ArrowDown size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 수동 입력 폼 */}
            <div className="roadmap-section-label manual-label">
              <Plus size={12} />
              <span>수동 입력</span>
            </div>
            <div className="roadmap-form">
              <input className="roadmap-form-input major" value={formMajor}
                onChange={e => setFormMajor(e.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="프로젝트" />
              <input className="roadmap-form-input" value={formMinor}
                onChange={e => setFormMinor(e.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="태스크" />
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

            {/* 수동 행 목록 */}
            {manualRows.length > 0 && (
              <div className="roadmap-row-list">
                {manualRows.map((row, idx) => (
                  <div key={row.id} className="roadmap-row-item">
                    <span className="roadmap-row-item-num">{autoRows.length + idx + 1}</span>
                    <input className="roadmap-form-input major" defaultValue={row.major}
                      onBlur={e => handleRowFieldBlur(row.id, 'major', e.target.value)}
                      placeholder="프로젝트" />
                    <input className="roadmap-form-input" defaultValue={row.minor || ''}
                      onBlur={e => handleRowFieldBlur(row.id, 'minor', e.target.value)}
                      placeholder="태스크" />
                    <input className="roadmap-form-input" defaultValue={row.assignee || ''}
                      onBlur={e => handleRowFieldBlur(row.id, 'assignee', e.target.value)}
                      placeholder="담당자" />
                    <div className="roadmap-row-item-actions">
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'up')}
                        disabled={rows.indexOf(row) === 0}><ArrowUp size={11} /></button>
                      <button className="roadmap-mini-btn" onClick={() => handleMoveRow(row.id, 'down')}
                        disabled={rows.indexOf(row) === rows.length - 1}><ArrowDown size={11} /></button>
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
            <div className="empty-state-desc">PROJECT를 열어 항목을 확인하거나 수동으로 추가하세요</div>
          </div>
        ) : (
          <div className="roadmap-table-wrapper">
            <table className="roadmap-table">
              <thead>
              <tr>
                <th className="roadmap-th-major">프로젝트</th>
                <th className="roadmap-th-minor">태스크</th>
                <th className="roadmap-th-output">산출물</th>
                <th className="roadmap-th-assignee">담당</th>
                {quarter.months.map(m => (
                  <th key={m} className="roadmap-th-month">{MONTH_NAMES[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(group => {
                return group.rows.map((row, ri) => (
                  <tr key={row.id}>
                    {ri === 0 && (
                      <td className="roadmap-td-major" rowSpan={group.rows.length}>
                        {renderField(row, 'major')}
                      </td>
                    )}
                    <td className="roadmap-td-minor">{renderField(row, 'minor')}</td>
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
