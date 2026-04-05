import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const CATEGORY_ICONS = {
  'Proteins':                   '🥩',
  'Dairy':                      '🧀',
  'Produce — Vegetables':       '🥦',
  'Produce — Fruits':           '🍋',
  'Grains & Bread':             '🌾',
  'Oils, Sauces & Condiments':  '🫙',
  'Spices & Seasonings':        '🧂',
  'Nuts, Seeds & Dried Goods':  '🥜',
  'Canned & Packaged':          '🥫',
  'Sweeteners & Baking':        '🍯',
  'Other':                      '◈',
}

function getMonday(d = new Date()) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  return date.toISOString().split('T')[0]
}

function auth() {
  const t = localStorage.getItem('access')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function fmtAmount(amount, unit) {
  if (!amount) return unit || ''
  const n = Number.isInteger(amount) ? amount : parseFloat(amount.toFixed(2))
  return unit ? `${n} ${unit}` : `${n}`
}

function addWeeks(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n * 7)
  return d.toISOString().split('T')[0]
}

function weekLabel(iso) {
  const start = new Date(iso)
  const end   = new Date(iso)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-US',{ month:'short', day:'numeric' })} – ${end.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}`
}

/* ════════════════════════════════════════════════════════════ */
export default function GroceryListPage() {
  const navigate             = useNavigate()
  const [params, setParams]  = useSearchParams()
  const [week,   setWeek]    = useState(params.get('week') ?? getMonday())
  const [data,   setData]    = useState(null)
  const [loading,setLoading] = useState(false)
  const [checked,setChecked] = useState({})   // { "category|name": bool }
  const [collapsed,setCollapsed] = useState({})

  /* sync week into URL */
  useEffect(() => { setParams({ week }) }, [week])

  /* fetch grocery list */
  useEffect(() => {
    setChecked({})
    setCollapsed({})
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${API}/mealplanner/grocery-list/?week=${week}`, { headers: auth() })
        if (res.ok) setData(await res.json())
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [week])

  function toggleItem(cat, name) {
    const key = `${cat}|${name}`
    setChecked(c => ({ ...c, [key]: !c[key] }))
  }

  function toggleCategory(cat) {
    setCollapsed(c => ({ ...c, [cat]: !c[cat] }))
  }

  function checkAll(cat, items) {
    const updates = {}
    items.forEach(item => { updates[`${cat}|${item.name}`] = true })
    setChecked(c => ({ ...c, ...updates }))
  }

  function uncheckAll(cat, items) {
    const updates = {}
    items.forEach(item => { updates[`${cat}|${item.name}`] = false })
    setChecked(c => ({ ...c, ...updates }))
  }

  const totalItems    = data?.categories?.reduce((s, c) => s + c.items.length, 0) ?? 0
  const checkedCount  = Object.values(checked).filter(Boolean).length

  /* ── print support ── */
  function printList() {
    window.print()
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <Navbar />

      <main style={{ flex:1, padding:'1.5rem 2rem', maxWidth:'52rem', margin:'0 auto', width:'100%' }}>

        {/* Header */}
        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Inter,sans-serif', fontSize:'2rem', color:'var(--text)', lineHeight:1.2, marginBottom:'0.25rem' }}>
              Grocery <span style={{ color:'var(--accent)', fontStyle:'italic' }}>List.</span>
            </h1>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.68rem', color:'var(--text-dim)', letterSpacing:'0.1em' }}>
              // generated from your meal plan
            </p>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/meal-planner')} style={ghostBtn()}>
              ← meal planner
            </button>
            <button onClick={printList} style={ghostBtn()}>
              print
            </button>
          </div>
        </div>

        {/* Week nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <NavBtn onClick={() => setWeek(w => addWeeks(w, -1))}>‹</NavBtn>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.8125rem', color:'var(--text-muted)', minWidth:'16rem', textAlign:'center' }}>
            {weekLabel(week)}
          </span>
          <NavBtn onClick={() => setWeek(w => addWeeks(w, +1))}>›</NavBtn>
          <button onClick={() => setWeek(getMonday())} style={{
            marginLeft:'0.5rem', padding:'0.3rem 0.75rem',
            fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
            color:'var(--text-dim)', backgroundColor:'var(--bg-hover)',
            border:'1px solid var(--border)', borderRadius:'0.25rem', cursor:'pointer',
          }}>today</button>
        </div>

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Empty state */}
        {!loading && data && data.recipe_count === 0 && (
          <div style={{ textAlign:'center', padding:'5rem 0' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem', opacity:0.2 }}>🛒</div>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.375rem' }}>
              No meals planned this week
            </p>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.72rem', color:'var(--text-dim)', marginBottom:'1.5rem' }}>
              Add recipes to your meal planner to generate a grocery list
            </p>
            <button onClick={() => navigate('/meal-planner')} style={{
              padding:'0.5rem 1.25rem',
              backgroundColor:'var(--accent)', color:'#11110e',
              border:'none', borderRadius:'0.25rem', cursor:'pointer',
              fontFamily:'Inter,sans-serif', fontSize:'0.75rem', fontWeight:500,
            }}>
              Go to meal planner →
            </button>
          </div>
        )}

        {/* List */}
        {!loading && data && data.recipe_count > 0 && (
          <>
            {/* Summary bar */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0.625rem 1rem', marginBottom:'1.25rem',
              backgroundColor:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:'0.25rem',
            }}>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                <span style={{ color:'var(--accent)', fontWeight:500 }}>{data.recipe_count}</span> recipes
                &nbsp;·&nbsp;
                <span style={{ color:'var(--accent)', fontWeight:500 }}>{totalItems}</span> items
              </span>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text-dim)' }}>
                {checkedCount}/{totalItems} checked
              </span>
            </div>

            {/* Categories */}
            {data.categories.map(cat => {
              const icon       = CATEGORY_ICONS[cat.name] ?? '◈'
              const isCollapsed = collapsed[cat.name]
              const catChecked  = cat.items.filter(i => checked[`${cat.name}|${i.name}`]).length
              const allDone     = catChecked === cat.items.length

              return (
                <div key={cat.name} style={{
                  marginBottom:'0.75rem',
                  backgroundColor:'var(--bg-card)',
                  border:'1px solid var(--border)',
                  borderRadius:'0.375rem',
                  overflow:'hidden',
                }}>
                  {/* Category header */}
                  <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'0.75rem 1rem',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                    cursor:'pointer',
                    backgroundColor: allDone ? 'color-mix(in srgb, var(--success) 5%, var(--bg-card))' : 'var(--bg-card)',
                    transition:'background-color 0.2s',
                  }} onClick={() => toggleCategory(cat.name)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                      <span style={{ fontSize:'1rem' }}>{icon}</span>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.8125rem', color: allDone ? 'var(--text-dim)' : 'var(--text)', fontWeight:500 }}>
                        {cat.name}
                      </span>
                      <span style={{
                        fontFamily:'Inter,sans-serif', fontSize:'0.625rem',
                        color:'var(--text-dim)', backgroundColor:'var(--bg-hover)',
                        border:'1px solid var(--border)',
                        padding:'0.125rem 0.375rem', borderRadius:'999px',
                      }}>
                        {catChecked}/{cat.items.length}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      {/* Check/uncheck all */}
                      <button onClick={e => { e.stopPropagation(); allDone ? uncheckAll(cat.name, cat.items) : checkAll(cat.name, cat.items) }}
                        style={{
                          fontFamily:'Inter,sans-serif', fontSize:'0.5625rem',
                          color:'var(--text-dim)', background:'none', border:'none',
                          cursor:'pointer', letterSpacing:'0.04em',
                          padding:'0.25rem 0.5rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}
                      >
                        {allDone ? 'uncheck all' : 'check all'}
                      </button>
                      <span style={{ color:'var(--text-dim)', fontSize:'0.625rem', transition:'transform 0.15s', display:'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}>▾</span>
                    </div>
                  </div>

                  {/* Items */}
                  {!isCollapsed && (
                    <div>
                      {cat.items.map((item, idx) => {
                        const key      = `${cat.name}|${item.name}`
                        const isDone   = !!checked[key]
                        const isLast   = idx === cat.items.length - 1
                        return (
                          <div key={key}
                            onClick={() => toggleItem(cat.name, item.name)}
                            style={{
                              display:'flex', alignItems:'center', gap:'0.875rem',
                              padding:'0.625rem 1rem',
                              borderBottom: isLast ? 'none' : '1px solid var(--border)',
                              cursor:'pointer',
                              backgroundColor: isDone ? 'color-mix(in srgb, var(--success) 4%, transparent)' : 'transparent',
                              transition:'background-color 0.15s',
                            }}
                            onMouseEnter={e => !isDone && (e.currentTarget.style.backgroundColor='var(--bg-hover)')}
                            onMouseLeave={e => !isDone && (e.currentTarget.style.backgroundColor='transparent')}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width:'1rem', height:'1rem', flexShrink:0,
                              border:`1.5px solid ${isDone ? 'var(--success)' : 'var(--border-2)'}`,
                              borderRadius:'0.2rem',
                              backgroundColor: isDone ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'transparent',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              transition:'all 0.15s',
                            }}>
                              {isDone && <span style={{ fontSize:'0.5rem', color:'var(--success)', fontWeight:700 }}>✓</span>}
                            </div>

                            {/* Name */}
                            <span style={{
                              flex:1,
                              fontFamily:'Inter,sans-serif', fontSize:'0.8125rem',
                              color: isDone ? 'var(--text-dim)' : 'var(--text)',
                              textDecoration: isDone ? 'line-through' : 'none',
                              textDecorationColor:'var(--text-dim)',
                              transition:'color 0.15s',
                            }}>
                              {item.name}
                            </span>

                            {/* Amount */}
                            {(item.amount || item.unit) && (
                              <span style={{
                                fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
                                color: isDone ? 'var(--text-dim)' : 'var(--accent)',
                                flexShrink:0,
                              }}>
                                {fmtAmount(item.amount, item.unit)}
                              </span>
                            )}

                            {/* Used in (tooltip-style) */}
                            {item.recipes?.length > 0 && (
                              <span title={`Used in: ${item.recipes.join(', ')}`} style={{
                                fontFamily:'Inter,sans-serif', fontSize:'0.5625rem',
                                color:'var(--text-dim)', flexShrink:0,
                                borderBottom:'1px dashed var(--border-2)',
                                cursor:'help',
                              }}>
                                {item.recipes.length} recipe{item.recipes.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Done state */}
            {checkedCount === totalItems && totalItems > 0 && (
              <div style={{
                marginTop:'1.5rem', padding:'1.25rem',
                backgroundColor:'color-mix(in srgb, var(--success) 8%, var(--bg-card))',
                border:'1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                borderRadius:'0.375rem', textAlign:'center',
              }}>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.875rem', color:'var(--success)', marginBottom:'0.25rem' }}>
                  ✓ All done — happy cooking!
                </p>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.68rem', color:'var(--text-dim)' }}>
                  {totalItems} items checked off
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, button { display: none !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; border-color: #ccc !important; background: white !important; }
        }
      `}</style>
    </div>
  )
}

function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width:'2rem', height:'2rem', display:'flex', alignItems:'center', justifyContent:'center',
      backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)',
      borderRadius:'0.25rem', cursor:'pointer', color:'var(--text-muted)',
      fontFamily:'Inter,sans-serif', fontSize:'1rem',
    }}
      onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
    >{children}</button>
  )
}

function ghostBtn() {
  return {
    padding:'0.375rem 0.875rem',
    fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
    color:'var(--text-dim)', backgroundColor:'var(--bg-hover)',
    border:'1px solid var(--border)', borderRadius:'0.25rem', cursor:'pointer',
  }
}

function LoadingSkeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {[3,5,4,2].map((n,i) => (
        <div key={i} style={{
          backgroundColor:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'0.375rem', overflow:'hidden',
        }}>
          <div style={{ height:'2.75rem', backgroundColor:'var(--bg-hover)', opacity:0.6 }} />
          {Array.from({length:n}).map((_,j) => (
            <div key={j} style={{
              height:'2.625rem', borderTop:'1px solid var(--border)',
              display:'flex', alignItems:'center', padding:'0 1rem', gap:'0.875rem',
            }}>
              <div style={{ width:'1rem', height:'1rem', backgroundColor:'var(--bg-hover)', borderRadius:'0.2rem' }} />
              <div style={{ flex:1, height:'0.625rem', backgroundColor:'var(--bg-hover)', borderRadius:'0.25rem', width:`${50+j*10}%` }} />
              <div style={{ width:'3rem', height:'0.625rem', backgroundColor:'var(--bg-hover)', borderRadius:'0.25rem' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
