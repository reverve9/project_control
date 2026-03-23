import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'

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
  const [categories, setCategories] = useState([])
  const [cells, setCells] = useState({})
  const [editingCell, setEditingCell] = useState(null)
  const [editingCellValue, setEditingCellValue] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [editingOutput, setEditingOutput] = useState(null)
  const [editingOutputValue, setEditingOutputValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ category: '', group: '', row: '', output: '' })
  const [addTarget, setAddTarget] = useState(null) // null=전체, { categoryId } or { groupId }

  const quarter = QUARTERS[quarterIndex]

  const fetchData = useCallback(async () => {
    const { data: catData } = await supabase
      .from('roadmap_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    const { data: grpData } = await supabase
      .from('roadmap_groups')
      .select('*')
      .order('sort_order', { ascending: true })

    const { data: rowData } = await supabase
      .from('roadmap_rows')
      .select('*')
      .order('sort_order', { ascending: true })

    const { data: cellData } = await supabase
      .from('roadmap_cells')
      .select('*')
      .eq('year', year)

    const cellMap = {}
    if (cellData) cellData.forEach(c => { cellMap[`${c.row_id}-${c.month}`] = c })
    setCells(cellMap)

    const tree = (catData || []).map(cat => ({
      ...cat,
      groups: (grpData || [])
        .filter(g => g.category_id === cat.id)
        .map(grp => ({
          ...grp,
          rows: (rowData || []).filter(r => r.group_id === grp.id)
        }))
    }))
    setCategories(tree)
  }, [year, projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const getCategoryRowspan = (cat) =>
    cat.groups.reduce((sum, g) => sum + Math.max(g.rows.length, 1), 0) || 1

  const getGroupRowspan = (grp) => Math.max(grp.rows.length, 1)

  // 분기 이동
  const handlePrevQuarter = () => {
    if (quarterIndex === 0) { setYear(y => y - 1); setQuarterIndex(3) }
    else setQuarterIndex(q => q - 1)
  }
  const handleNextQuarter = () => {
    if (quarterIndex === 3) { setYear(y => y + 1); setQuarterIndex(0) }
    else setQuarterIndex(q => q + 1)
  }

  // 통합 추가
  const openAddModal = (target = null) => {
    setAddTarget(target)
    if (target?.groupId) {
      setAddForm({ category: '', group: '', row: '', output: '' })
    } else if (target?.categoryId) {
      setAddForm({ category: '', group: '', row: '', output: '' })
    } else {
      setAddForm({ category: '', group: '', row: '', output: '' })
    }
    setShowAddModal(true)
  }

  const handleAddSubmit = async () => {
    if (addTarget?.groupId) {
      // 소분류만 추가
      if (!addForm.row.trim()) return
      const grp = categories.flatMap(c => c.groups).find(g => g.id === addTarget.groupId)
      const maxOrder = grp?.rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) || 0
      await supabase.from('roadmap_rows').insert({
        label: addForm.row.trim(), group_id: addTarget.groupId, user_id: user.id, sort_order: maxOrder + 1
      })
    } else if (addTarget?.categoryId) {
      // 대분류 + 소분류 추가
      if (!addForm.group.trim()) return
      const cat = categories.find(c => c.id === addTarget.categoryId)
      const maxOrder = cat?.groups.reduce((max, g) => Math.max(max, g.sort_order || 0), 0) || 0
      const { data: newGrp } = await supabase.from('roadmap_groups').insert({
        label: addForm.group.trim(), category_id: addTarget.categoryId, user_id: user.id, sort_order: maxOrder + 1
      }).select().single()

      if (newGrp && addForm.row.trim()) {
        await supabase.from('roadmap_rows').insert({
          label: addForm.row.trim(), group_id: newGrp.id, user_id: user.id, sort_order: 0
        })
      }
    } else {
      // 전체 추가: 카테고리 + 대분류 + 소분류 + 산출물
      if (!addForm.category.trim()) return
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0)
      const { data: newCat } = await supabase.from('roadmap_categories').insert({
        label: addForm.category.trim(), output: addForm.output.trim() || null,
        project_id: projectId, user_id: user.id, sort_order: maxOrder + 1
      }).select().single()

      if (newCat && addForm.group.trim()) {
        const { data: newGrp } = await supabase.from('roadmap_groups').insert({
          label: addForm.group.trim(), category_id: newCat.id, user_id: user.id, sort_order: 0
        }).select().single()

        if (newGrp && addForm.row.trim()) {
          await supabase.from('roadmap_rows').insert({
            label: addForm.row.trim(), group_id: newGrp.id, user_id: user.id, sort_order: 0
          })
        }
      }
    }

    setShowAddModal(false)
    setAddForm({ category: '', group: '', row: '', output: '' })
    setAddTarget(null)
    await fetchData()
  }

  // 삭제
  const handleDelete = async (table, id, msg) => {
    if (!window.confirm(msg || '삭제할까요?')) return
    await supabase.from(table).delete().eq('id', id)
    await fetchData()
  }

  // 라벨 수정
  const handleStartEdit = (id, label) => { setEditingId(id); setEditingLabel(label) }
  const handleSaveLabel = async (table, id) => {
    if (!editingLabel.trim()) { setEditingId(null); return }
    await supabase.from(table).update({ label: editingLabel.trim() }).eq('id', id)
    setEditingId(null)
    await fetchData()
  }
  const handleLabelKeyDown = (e, table, id) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSaveLabel(table, id)
    if (e.key === 'Escape') setEditingId(null)
  }

  // 산출물 수정
  const handleStartEditOutput = (id, output) => { setEditingOutput(id); setEditingOutputValue(output || '') }
  const handleSaveOutput = async (id) => {
    await supabase.from('roadmap_categories').update({ output: editingOutputValue.trim() || null }).eq('id', id)
    setEditingOutput(null)
    await fetchData()
  }
  const handleOutputKeyDown = (e, id) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSaveOutput(id) }
    if (e.key === 'Escape') setEditingOutput(null)
  }

  // 셀
  const getCellKey = (rowId, month) => `${rowId}-${month}`
  const handleCellClick = (rowId, month) => {
    const key = getCellKey(rowId, month)
    setEditingCell(key)
    setEditingCellValue(cells[key]?.content || '')
  }
  const handleCellSave = async (rowId, month) => {
    const key = getCellKey(rowId, month)
    const existing = cells[key]
    if (editingCellValue.trim() === '' && existing) {
      await supabase.from('roadmap_cells').delete().eq('id', existing.id)
    } else if (editingCellValue.trim() !== '') {
      if (existing) {
        await supabase.from('roadmap_cells').update({ content: editingCellValue.trim() }).eq('id', existing.id)
      } else {
        await supabase.from('roadmap_cells').insert({
          row_id: rowId, year, month, content: editingCellValue.trim(), user_id: user.id
        })
      }
    }
    setEditingCell(null)
    await fetchData()
  }
  const handleCellKeyDown = (e, rowId, month) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleCellSave(rowId, month) }
    if (e.key === 'Escape') setEditingCell(null)
  }

  // 라벨 렌더
  const renderLabel = (table, id, label) => {
    if (editingId === id) {
      return (
        <input className="roadmap-row-input" value={editingLabel}
          onChange={e => setEditingLabel(e.target.value)}
          onBlur={() => handleSaveLabel(table, id)}
          onKeyDown={e => handleLabelKeyDown(e, table, id)}
          autoFocus />
      )
    }
    return <span className="roadmap-row-label" onDoubleClick={() => handleStartEdit(id, label)}>{label}</span>
  }

  // 테이블 행
  const buildRows = () => {
    const tableRows = []

    categories.forEach(cat => {
      const catRowspan = getCategoryRowspan(cat)
      let isFirstCatRow = true

      const renderCatCells = () => (
        <>
          <td className="roadmap-td-category" rowSpan={catRowspan}>
            <div className="roadmap-label-wrap">
              {renderLabel('roadmap_categories', cat.id, cat.label)}
              <div className="roadmap-label-actions">
                <button className="roadmap-mini-btn" onClick={() => openAddModal({ categoryId: cat.id })} title="대분류 추가"><Plus size={11} /></button>
                <button className="roadmap-mini-btn delete" onClick={() => handleDelete('roadmap_categories', cat.id, '이 항목과 하위 내용이 모두 삭제됩니다.')} title="삭제"><Trash2 size={11} /></button>
              </div>
            </div>
          </td>
        </>
      )

      const renderOutputCell = () => (
        <td className="roadmap-td-output" rowSpan={catRowspan}>
          {editingOutput === cat.id ? (
            <textarea className="roadmap-cell-input" value={editingOutputValue}
              onChange={e => setEditingOutputValue(e.target.value)}
              onBlur={() => handleSaveOutput(cat.id)}
              onKeyDown={e => handleOutputKeyDown(e, cat.id)} autoFocus />
          ) : (
            <div className="roadmap-cell-content roadmap-output-content" onClick={() => handleStartEditOutput(cat.id, cat.output)}>
              {cat.output || <span className="roadmap-placeholder">클릭하여 입력</span>}
            </div>
          )}
        </td>
      )

      if (cat.groups.length === 0) {
        tableRows.push(
          <tr key={`cat-empty-${cat.id}`}>
            {renderCatCells()}
            <td className="roadmap-td-group"></td>
            <td className="roadmap-td-label"></td>
            {renderOutputCell()}
            {quarter.months.map(m => <td key={m} className="roadmap-td-cell"></td>)}
          </tr>
        )
        return
      }

      cat.groups.forEach(grp => {
        const grpRowspan = getGroupRowspan(grp)
        let isFirstGrpRow = true

        const renderGrpCell = () => (
          <td className="roadmap-td-group" rowSpan={grpRowspan}>
            <div className="roadmap-label-wrap">
              {renderLabel('roadmap_groups', grp.id, grp.label)}
              <div className="roadmap-label-actions">
                <button className="roadmap-mini-btn" onClick={() => openAddModal({ groupId: grp.id })} title="소분류 추가"><Plus size={11} /></button>
                <button className="roadmap-mini-btn delete" onClick={() => handleDelete('roadmap_groups', grp.id, '이 항목과 하위 내용이 모두 삭제됩니다.')}><Trash2 size={11} /></button>
              </div>
            </div>
          </td>
        )

        if (grp.rows.length === 0) {
          tableRows.push(
            <tr key={`grp-empty-${grp.id}`}>
              {isFirstCatRow && renderCatCells()}
              {renderGrpCell()}
              <td className="roadmap-td-label"></td>
              {isFirstCatRow && renderOutputCell()}
              {quarter.months.map(m => <td key={m} className="roadmap-td-cell"></td>)}
            </tr>
          )
          isFirstCatRow = false
          return
        }

        grp.rows.forEach(row => {
          tableRows.push(
            <tr key={row.id}>
              {isFirstCatRow && renderCatCells()}
              {isFirstGrpRow && renderGrpCell()}
              <td className="roadmap-td-label">
                <div className="roadmap-label-wrap">
                  {renderLabel('roadmap_rows', row.id, row.label)}
                  <button className="roadmap-mini-btn delete" onClick={() => handleDelete('roadmap_rows', row.id)}><Trash2 size={11} /></button>
                </div>
              </td>
              {isFirstCatRow && renderOutputCell()}
              {quarter.months.map(m => {
                const key = getCellKey(row.id, m)
                const cell = cells[key]
                const isEditing = editingCell === key
                return (
                  <td key={m} className="roadmap-td-cell" onClick={() => !isEditing && handleCellClick(row.id, m)}>
                    {isEditing ? (
                      <textarea className="roadmap-cell-input" value={editingCellValue}
                        onChange={e => setEditingCellValue(e.target.value)}
                        onBlur={() => handleCellSave(row.id, m)}
                        onKeyDown={e => handleCellKeyDown(e, row.id, m)} autoFocus />
                    ) : (
                      <div className="roadmap-cell-content">{cell?.content || ''}</div>
                    )}
                  </td>
                )
              })}
            </tr>
          )
          isFirstCatRow = false
          isFirstGrpRow = false
        })
      })
    })

    return tableRows
  }

  // 모달 제목/필드 결정
  const getModalConfig = () => {
    if (addTarget?.groupId) return { title: '소분류 추가', fields: ['row'] }
    if (addTarget?.categoryId) return { title: '대분류 추가', fields: ['group', 'row'] }
    return { title: '항목 추가', fields: ['category', 'output', 'group', 'row'] }
  }

  const modalConfig = getModalConfig()

  return (
    <div className="roadmap-container">
      <div className="roadmap-toolbar">
        <div className="roadmap-nav">
          <button className="btn btn-ghost btn-sm" onClick={handlePrevQuarter}><ChevronLeft size={16} /></button>
          <span className="roadmap-nav-label">{year}년 {quarter.label}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleNextQuarter}><ChevronRight size={16} /></button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => openAddModal()}>
          <Plus size={14} /> 추가
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <div className="empty-state-title">업무추진표가 비어있어요</div>
          <div className="empty-state-desc">항목을 추가해서 시작하세요</div>
        </div>
      ) : (
        <div className="roadmap-table-wrapper">
          <table className="roadmap-table">
            <thead>
              <tr>
                <th className="roadmap-th-category"></th>
                <th className="roadmap-th-group"></th>
                <th className="roadmap-th-label"></th>
                <th className="roadmap-th-output">산출물</th>
                {quarter.months.map(m => (
                  <th key={m} className="roadmap-th-month">{MONTH_NAMES[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>{buildRows()}</tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setAddTarget(null) } }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modalConfig.title}</h2>
              <button className="modal-close-btn" onClick={() => { setShowAddModal(false); setAddTarget(null) }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {modalConfig.fields.includes('category') && (
                <div className="form-group">
                  <label className="form-label">카테고리명</label>
                  <input className="form-input" value={addForm.category}
                    onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="예: 과제총괄 및 행정업무" autoFocus />
                </div>
              )}
              {modalConfig.fields.includes('output') && (
                <div className="form-group">
                  <label className="form-label">최종 산출물 (선택)</label>
                  <input className="form-input" value={addForm.output}
                    onChange={e => setAddForm(f => ({ ...f, output: e.target.value }))}
                    placeholder="예: 최종 보고서" />
                </div>
              )}
              {modalConfig.fields.includes('group') && (
                <div className="form-group">
                  <label className="form-label">대분류 {addTarget?.categoryId ? '' : '(선택)'}</label>
                  <input className="form-input" value={addForm.group}
                    onChange={e => setAddForm(f => ({ ...f, group: e.target.value }))}
                    placeholder="예: 기산"
                    autoFocus={!!addTarget?.categoryId} />
                </div>
              )}
              {modalConfig.fields.includes('row') && (
                <div className="form-group">
                  <label className="form-label">소분류 (선택)</label>
                  <input className="form-input" value={addForm.row}
                    onChange={e => setAddForm(f => ({ ...f, row: e.target.value }))}
                    placeholder="예: 최신 산출 데이터"
                    autoFocus={!!addTarget?.groupId}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddSubmit() }} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowAddModal(false); setAddTarget(null) }}>취소</button>
              <button className="btn btn-primary" onClick={handleAddSubmit}
                disabled={addTarget?.groupId ? !addForm.row.trim() : addTarget?.categoryId ? !addForm.group.trim() : !addForm.category.trim()}>
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapView
