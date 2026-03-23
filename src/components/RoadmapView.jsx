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
  const [showAddModal, setShowAddModal] = useState(null)
  const [addLabel, setAddLabel] = useState('')

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
    if (cellData) {
      cellData.forEach(c => { cellMap[`${c.row_id}-${c.month}`] = c })
    }
    setCells(cellMap)

    const catIds = (catData || []).map(c => c.id)
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

  const handlePrevQuarter = () => {
    if (quarterIndex === 0) { setYear(y => y - 1); setQuarterIndex(3) }
    else setQuarterIndex(q => q - 1)
  }

  const handleNextQuarter = () => {
    if (quarterIndex === 3) { setYear(y => y + 1); setQuarterIndex(0) }
    else setQuarterIndex(q => q + 1)
  }

  // 추가
  const handleAdd = async () => {
    if (!addLabel.trim()) return
    const label = addLabel.trim()

    if (showAddModal === 'category') {
      const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0)
      await supabase.from('roadmap_categories').insert({
        label, project_id: projectId, user_id: user.id, sort_order: maxOrder + 1
      })
    } else if (showAddModal?.type === 'group') {
      const cat = categories.find(c => c.id === showAddModal.categoryId)
      const maxOrder = cat?.groups.reduce((max, g) => Math.max(max, g.sort_order || 0), 0) || 0
      await supabase.from('roadmap_groups').insert({
        label, category_id: showAddModal.categoryId, user_id: user.id, sort_order: maxOrder + 1
      })
    } else if (showAddModal?.type === 'row') {
      const grp = categories.flatMap(c => c.groups).find(g => g.id === showAddModal.groupId)
      const maxOrder = grp?.rows.reduce((max, r) => Math.max(max, r.sort_order || 0), 0) || 0
      await supabase.from('roadmap_rows').insert({
        label, group_id: showAddModal.groupId, user_id: user.id, sort_order: maxOrder + 1
      })
    }

    setAddLabel('')
    setShowAddModal(null)
    await fetchData()
  }

  // 삭제
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('이 항목과 하위 내용이 모두 삭제됩니다.')) return
    await supabase.from('roadmap_categories').delete().eq('id', id)
    await fetchData()
  }

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('이 항목과 하위 내용이 모두 삭제됩니다.')) return
    await supabase.from('roadmap_groups').delete().eq('id', id)
    await fetchData()
  }

  const handleDeleteRow = async (id) => {
    await supabase.from('roadmap_rows').delete().eq('id', id)
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

  // 최종산출물
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
        <input
          className="roadmap-row-input"
          value={editingLabel}
          onChange={e => setEditingLabel(e.target.value)}
          onBlur={() => handleSaveLabel(table, id)}
          onKeyDown={e => handleLabelKeyDown(e, table, id)}
          autoFocus
        />
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

      if (cat.groups.length === 0) {
        tableRows.push(
          <tr key={`cat-empty-${cat.id}`}>
            <td className="roadmap-td-category" rowSpan={1}>
              <div className="roadmap-label-wrap">
                {renderLabel('roadmap_categories', cat.id, cat.label)}
                <div className="roadmap-label-actions">
                  <button className="roadmap-mini-btn" onClick={() => setShowAddModal({ type: 'group', categoryId: cat.id })}><Plus size={11} /></button>
                  <button className="roadmap-mini-btn delete" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={11} /></button>
                </div>
              </div>
            </td>
            <td className="roadmap-td-group" colSpan={1}></td>
            <td className="roadmap-td-label"></td>
            <td className="roadmap-td-output" rowSpan={1}>
              {editingOutput === cat.id ? (
                <textarea className="roadmap-cell-input" value={editingOutputValue} onChange={e => setEditingOutputValue(e.target.value)} onBlur={() => handleSaveOutput(cat.id)} onKeyDown={e => handleOutputKeyDown(e, cat.id)} autoFocus />
              ) : (
                <div className="roadmap-cell-content" onClick={() => handleStartEditOutput(cat.id, cat.output)}>{cat.output || ''}</div>
              )}
            </td>
            {quarter.months.map(m => <td key={m} className="roadmap-td-cell"></td>)}
          </tr>
        )
        return
      }

      cat.groups.forEach(grp => {
        const grpRowspan = getGroupRowspan(grp)
        let isFirstGrpRow = true

        if (grp.rows.length === 0) {
          tableRows.push(
            <tr key={`grp-empty-${grp.id}`}>
              {isFirstCatRow && (
                <>
                  <td className="roadmap-td-category" rowSpan={catRowspan}>
                    <div className="roadmap-label-wrap">
                      {renderLabel('roadmap_categories', cat.id, cat.label)}
                      <div className="roadmap-label-actions">
                        <button className="roadmap-mini-btn" onClick={() => setShowAddModal({ type: 'group', categoryId: cat.id })}><Plus size={11} /></button>
                        <button className="roadmap-mini-btn delete" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </td>
                </>
              )}
              <td className="roadmap-td-group" rowSpan={1}>
                <div className="roadmap-label-wrap">
                  {renderLabel('roadmap_groups', grp.id, grp.label)}
                  <div className="roadmap-label-actions">
                    <button className="roadmap-mini-btn" onClick={() => setShowAddModal({ type: 'row', groupId: grp.id })}><Plus size={11} /></button>
                    <button className="roadmap-mini-btn delete" onClick={() => handleDeleteGroup(grp.id)}><Trash2 size={11} /></button>
                  </div>
                </div>
              </td>
              <td className="roadmap-td-label"></td>
              {isFirstCatRow && (
                <td className="roadmap-td-output" rowSpan={catRowspan}>
                  {editingOutput === cat.id ? (
                    <textarea className="roadmap-cell-input" value={editingOutputValue} onChange={e => setEditingOutputValue(e.target.value)} onBlur={() => handleSaveOutput(cat.id)} onKeyDown={e => handleOutputKeyDown(e, cat.id)} autoFocus />
                  ) : (
                    <div className="roadmap-cell-content" onClick={() => handleStartEditOutput(cat.id, cat.output)}>{cat.output || ''}</div>
                  )}
                </td>
              )}
              {quarter.months.map(m => <td key={m} className="roadmap-td-cell"></td>)}
            </tr>
          )
          isFirstCatRow = false
          return
        }

        grp.rows.forEach(row => {
          tableRows.push(
            <tr key={row.id}>
              {isFirstCatRow && (
                <td className="roadmap-td-category" rowSpan={catRowspan}>
                  <div className="roadmap-label-wrap">
                    {renderLabel('roadmap_categories', cat.id, cat.label)}
                    <div className="roadmap-label-actions">
                      <button className="roadmap-mini-btn" onClick={() => setShowAddModal({ type: 'group', categoryId: cat.id })}><Plus size={11} /></button>
                      <button className="roadmap-mini-btn delete" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                </td>
              )}
              {isFirstGrpRow && (
                <td className="roadmap-td-group" rowSpan={grpRowspan}>
                  <div className="roadmap-label-wrap">
                    {renderLabel('roadmap_groups', grp.id, grp.label)}
                    <div className="roadmap-label-actions">
                      <button className="roadmap-mini-btn" onClick={() => setShowAddModal({ type: 'row', groupId: grp.id })}><Plus size={11} /></button>
                      <button className="roadmap-mini-btn delete" onClick={() => handleDeleteGroup(grp.id)}><Trash2 size={11} /></button>
                    </div>
                  </div>
                </td>
              )}
              <td className="roadmap-td-label">
                <div className="roadmap-label-wrap">
                  {renderLabel('roadmap_rows', row.id, row.label)}
                  <button className="roadmap-mini-btn delete" onClick={() => handleDeleteRow(row.id)}><Trash2 size={11} /></button>
                </div>
              </td>
              {isFirstCatRow && (
                <td className="roadmap-td-output" rowSpan={catRowspan}>
                  {editingOutput === cat.id ? (
                    <textarea className="roadmap-cell-input" value={editingOutputValue} onChange={e => setEditingOutputValue(e.target.value)} onBlur={() => handleSaveOutput(cat.id)} onKeyDown={e => handleOutputKeyDown(e, cat.id)} autoFocus />
                  ) : (
                    <div className="roadmap-cell-content" onClick={() => handleStartEditOutput(cat.id, cat.output)}>{cat.output || ''}</div>
                  )}
                </td>
              )}
              {quarter.months.map(m => {
                const key = getCellKey(row.id, m)
                const cell = cells[key]
                const isEditing = editingCell === key
                return (
                  <td key={m} className="roadmap-td-cell" onClick={() => !isEditing && handleCellClick(row.id, m)}>
                    {isEditing ? (
                      <textarea className="roadmap-cell-input" value={editingCellValue} onChange={e => setEditingCellValue(e.target.value)} onBlur={() => handleCellSave(row.id, m)} onKeyDown={e => handleCellKeyDown(e, row.id, m)} autoFocus />
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

  return (
    <div className="roadmap-container">
      <div className="roadmap-toolbar">
        <div className="roadmap-nav">
          <button className="btn btn-ghost btn-sm" onClick={handlePrevQuarter}>
            <ChevronLeft size={16} />
          </button>
          <span className="roadmap-nav-label">{year}년 {quarter.label}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleNextQuarter}>
            <ChevronRight size={16} />
          </button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal('category')}>
          <Plus size={14} />
          추가
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
            <tbody>
              {buildRows()}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowAddModal(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {showAddModal === 'category' ? '항목 추가' : showAddModal?.type === 'group' ? '세부 항목 추가' : '하위 항목 추가'}
              </h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <input
                  className="form-input"
                  value={addLabel}
                  onChange={e => setAddLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd()
                    if (e.key === 'Escape') setShowAddModal(null)
                  }}
                  placeholder="이름을 입력하세요"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(null)}>취소</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!addLabel.trim()}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapView
