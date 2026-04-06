import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const DAYS        = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS  = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' }
const SLOTS       = ['breakfast','lunch','dinner','snack']
const SLOT_ICONS  = { breakfast:'☀', lunch:'🌤', dinner:'🌙', snack:'◈' }

/* ── helpers ──────────────────────────────────────────────── */
function getMonday(d = new Date()) {
  const date = new Date(d)
  const day  = date.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  date.setDate(date.getDate() + diff)
  return date
}
function fmt(d)  { return d.toISOString().split('T')[0] }
function addWeeks(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n * 7)
  return r
}
function auth() {
  const t = localStorage.getItem('access')
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

/* ── entry map helper: { "monday|dinner": recipe } ───────── */
function buildMap(entries = []) {
  return entries.reduce((acc, e) => {
    acc[`${e.day}|${e.meal_slot}`] = e.recipe
    return acc
  }, {})
}

/* ═══════════════════════════════════════════════════════════ */
export default function MealPlannerPage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(getMonday())
  const [plan,      setPlan]      = useState(null)
  const [entryMap,  setEntryMap]  = useState({})
  const [loading,   setLoading]   = useState(false)

  // recipe picker modal
  const [picking, setPicking]     = useState(null)   // { day, meal_slot }
  const [search,  setSearch]      = useState('')
  const [results, setResults]     = useState([])
  const [srchLoading, setSL]      = useState(false)

  /* fetch plan for current week */
  const loadPlan = useCallback(async (monday) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/mealplanner/?week=${fmt(monday)}`, { headers: auth() })
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        setEntryMap(buildMap(data.entries))
      }
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadPlan(weekStart) }, [weekStart, loadPlan])

  /* week navigation */
  const prevWeek = () => setWeekStart(w => addWeeks(w, -1))
  const nextWeek = () => setWeekStart(w => addWeeks(w, +1))
  const thisWeek = () => setWeekStart(getMonday())

  /* open picker */
  const openPicker = (day, meal_slot) => {
    setPicking({ day, meal_slot })
    setSearch('')
    setResults([])
  }

  /* search recipes */
  useEffect(() => {
    if (!picking) return
    const q = search.trim()
    if (!q) { setResults([]); return }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setSL(true)
      try {
        const res = await fetch(`${API}/recipes/search/`, {
          method:  'POST',
          headers: auth(),
          body:    JSON.stringify({ query: q, filters: { number: 8 } }),
          signal:  ctrl.signal,
        })
        if (res.ok) {
          const d = await res.json()
          setResults(d.results ?? [])
        }
      } catch { }
      finally { setSL(false) }
    }, 400)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [search, picking])

  /* assign recipe to slot */
  async function assignRecipe(recipe) {
    if (!picking) return
    const key = `${picking.day}|${picking.meal_slot}`

    // Optimistic update
    setEntryMap(m => ({ ...m, [key]: recipe }))
    setPicking(null)

    try {
      const res = await fetch(`${API}/mealplanner/entry/`, {
        method:  'PUT',
        headers: auth(),
        body:    JSON.stringify({
          week_start:         fmt(weekStart),
          day:                picking.day,
          meal_slot:          picking.meal_slot,
          recipe_external_id: recipe.external_id,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPlan(data)
        setEntryMap(buildMap(data.entries))
      }
    } catch { }
  }

  /* remove recipe from slot */
  async function removeEntry(day, meal_slot) {
    const key = `${day}|${meal_slot}`
    setEntryMap(m => { const n = { ...m }; delete n[key]; return n })

    try {
      await fetch(`${API}/mealplanner/entry/`, {
        method:  'DELETE',
        headers: auth(),
        body:    JSON.stringify({ week_start: fmt(weekStart), day, meal_slot }),
      })
    } catch { }
  }

  /* week label */
  const endDate   = addWeeks(weekStart, 1)
  endDate.setDate(endDate.getDate() - 1)
  const weekLabel = `${weekStart.toLocaleDateString('en-US',{ month:'short', day:'numeric' })} – ${endDate.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}`

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <Navbar />

      <main style={{ flex:1, padding:'1.5rem 2rem', maxWidth:'72rem', margin:'0 auto', width:'100%' }}>

        {/* Page header */}
        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Inter,sans-serif', fontSize:'2rem', color:'var(--text)', lineHeight:1.2, marginBottom:'0.25rem' }}>
              Meal <span style={{ color:'var(--accent)', fontStyle:'italic' }}>Planner.</span>
            </h1>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.68rem', color:'var(--text-dim)', letterSpacing:'0.1em' }}>
              // assign recipes to each day of the week
            </p>
          </div>
          
          {/* Actions */}
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
            <button 
              onClick={() => navigate(`/grocery-list?week=${fmt(weekStart)}`)} 
              style={ghostBtn()}
              onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}
            >
              grocery list →
            </button>
          </div>
        </div>

        {/* Week navigator */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <NavBtn onClick={prevWeek}>‹</NavBtn>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.8125rem', color:'var(--text-muted)', minWidth:'16rem', textAlign:'center' }}>
            {weekLabel}
          </span>
          <NavBtn onClick={nextWeek}>›</NavBtn>
          <button onClick={thisWeek} style={{
            marginLeft:'0.5rem', padding:'0.3rem 0.75rem',
            fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
            color:'var(--text-dim)', backgroundColor:'var(--bg-hover)',
            border:'1px solid var(--border)', borderRadius:'0.25rem', cursor:'pointer',
          }}>today</button>
        </div>

        {/* Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
              <thead>
                <tr>
                  <th style={thStyle()}></th>
                  {DAYS.map(day => (
                    <th key={day} style={thStyle()}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
                        color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                        {DAY_LABELS[day]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map(slot => (
                  <tr key={slot}>
                    {/* Slot label */}
                    <td style={{ ...tdStyle(), width:'5.5rem', paddingRight:'0.75rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                        <span style={{ fontSize:'0.75rem' }}>{SLOT_ICONS[slot]}</span>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
                          color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          {slot}
                        </span>
                      </div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const key    = `${day}|${slot}`
                      const recipe = entryMap[key]
                      return (
                        <td key={day} style={tdStyle()}>
                          {recipe ? (
                            <FilledCell recipe={recipe} onRemove={() => removeEntry(day, slot)} onReplace={() => openPicker(day, slot)} />
                          ) : (
                            <EmptyCell onClick={() => openPicker(day, slot)} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Recipe picker modal */}
      {picking && (
        <RecipePicker
          day={picking.day}
          slot={picking.meal_slot}
          search={search}
          onSearch={setSearch}
          results={results}
          loading={srchLoading}
          onSelect={assignRecipe}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

/* ── sub-components ─────────────────────────────────────────── */

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

function thStyle() {
  return {
    padding:'0.5rem 0.375rem', textAlign:'left',
    borderBottom:'1px solid var(--border)', whiteSpace:'nowrap',
  }
}
function tdStyle() {
  return {
    padding:'0.3rem 0.25rem', verticalAlign:'top',
    borderBottom:'1px solid var(--border)',
  }
}

function EmptyCell({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width:'100%', minHeight:'4.5rem', display:'flex', alignItems:'center', justifyContent:'center',
        backgroundColor: hover ? 'var(--bg-hover)' : 'transparent',
        border:`1px dashed ${hover ? 'var(--border-2)' : 'var(--border)'}`,
        borderRadius:'0.25rem', cursor:'pointer',
        color: hover ? 'var(--accent)' : 'var(--text-dim)',
        fontFamily:'Inter,sans-serif', fontSize:'0.75rem',
        transition:'all 0.15s',
      }}>
      {hover ? '+ add' : '+'}
    </button>
  )
}

function FilledCell({ recipe, onRemove, onReplace }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position:'relative', minHeight:'4.5rem',
        backgroundColor:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'0.25rem', overflow:'hidden', cursor:'default',
        transition:'border-color 0.15s',
        borderColor: hover ? 'var(--border-2)' : 'var(--border)',
      }}>
      {recipe.image_url && (
        <img src={recipe.image_url} alt={recipe.title}
          style={{ width:'100%', height:'2.5rem', objectFit:'cover', display:'block', opacity: hover ? 0.6 : 1, transition:'opacity 0.15s' }} />
      )}
      <div style={{ padding:'0.3rem 0.4rem' }}>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.6875rem', color:'var(--text)',
          lineHeight:1.3, overflow:'hidden', display:'-webkit-box',
          WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {recipe.title}
        </p>
        {recipe.ready_in_minutes && (
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.5625rem', color:'var(--text-dim)', marginTop:'0.125rem' }}>
            {recipe.ready_in_minutes} min
          </p>
        )}
      </div>

      {/* hover actions */}
      {hover && (
        <div style={{
          position:'absolute', top:'0.25rem', right:'0.25rem',
          display:'flex', gap:'0.25rem',
        }}>
          <ActionBtn onClick={onReplace} title="Replace">⇄</ActionBtn>
          <ActionBtn onClick={onRemove}  title="Remove" danger>✕</ActionBtn>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:'1.25rem', height:'1.25rem', display:'flex', alignItems:'center', justifyContent:'center',
      backgroundColor:'var(--bg)', border:'1px solid var(--border)',
      borderRadius:'0.125rem', cursor:'pointer', fontSize:'0.5625rem',
      color: danger ? 'var(--error)' : 'var(--text-muted)',
    }}>{children}</button>
  )
}

function RecipePicker({ day, slot, search, onSearch, results, loading, onSelect, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.75)',
      zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }}>
      <div style={{
        backgroundColor:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'0.5rem', width:'100%', maxWidth:'28rem', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <div>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text)' }}>
              Add recipe
            </p>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.6rem', color:'var(--text-dim)', marginTop:'0.125rem', textTransform:'capitalize' }}>
              {day} · {slot}
            </p>
          </div>
          <button onClick={onClose} style={{
            width:'2rem', height:'2rem', backgroundColor:'var(--bg-hover)',
            border:'1px solid var(--border)', borderRadius:'50%', cursor:'pointer',
            color:'var(--text-dim)', fontSize:'0.75rem',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        {/* Search input */}
        <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <input
            autoFocus
            placeholder="Search recipes…"
            value={search}
            onChange={e => onSearch(e.target.value)}
            style={{
              width:'100%', padding:'0.5rem 0.75rem',
              backgroundColor:'var(--bg-input)', border:'1px solid var(--border)',
              borderRadius:'0.25rem', color:'var(--text)',
              fontFamily:'Inter,sans-serif', fontSize:'0.8125rem', outline:'none',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight:'18rem', overflowY:'auto' }}>
          {loading && (
            <div style={{ padding:'1.5rem', textAlign:'center',
              fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text-dim)' }}>
              searching…
            </div>
          )}
          {!loading && search && results.length === 0 && (
            <div style={{ padding:'1.5rem', textAlign:'center',
              fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text-dim)' }}>
              No results for "{search}"
            </div>
          )}
          {!loading && !search && (
            <div style={{ padding:'1.5rem', textAlign:'center',
              fontFamily:'Inter,sans-serif', fontSize:'0.75rem', color:'var(--text-dim)' }}>
              Type to search recipes
            </div>
          )}
          {results.map(recipe => (
            <button key={recipe.id} onClick={() => onSelect(recipe)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.625rem 1.25rem', backgroundColor:'transparent',
              border:'none', borderBottom:'1px solid var(--border)',
              cursor:'pointer', textAlign:'left',
              transition:'background-color 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
            >
              {recipe.image_url ? (
                <img src={recipe.image_url} alt={recipe.title}
                  style={{ width:'2.5rem', height:'2.5rem', objectFit:'cover', borderRadius:'0.125rem', flexShrink:0 }} />
              ) : (
                <div style={{ width:'2.5rem', height:'2.5rem', backgroundColor:'var(--bg-hover)',
                  borderRadius:'0.125rem', flexShrink:0 }} />
              )}
              <div>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.8125rem', color:'var(--text)', lineHeight:1.3 }}>
                  {recipe.title}
                </p>
                {recipe.ready_in_minutes && (
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'0.625rem', color:'var(--text-dim)', marginTop:'0.125rem' }}>
                    {recipe.ready_in_minutes} min
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      {SLOTS.map(slot => (
        <div key={slot} style={{ display:'flex', gap:'0.25rem' }}>
          <div style={{ width:'5.5rem', height:'4.5rem', backgroundColor:'var(--bg-hover)', borderRadius:'0.25rem' }} />
          {DAYS.map(d => (
            <div key={d} style={{ flex:1, height:'4.5rem', backgroundColor:'var(--bg-hover)',
              borderRadius:'0.25rem', opacity: 0.5 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ghostBtn() {
  return {
    padding:'0.375rem 0.875rem',
    fontFamily:'Inter,sans-serif', fontSize:'0.6875rem',
    color:'var(--text-dim)', backgroundColor:'var(--bg-hover)',
    border:'1px solid var(--border)', borderRadius:'0.25rem', cursor:'pointer',
    transition: 'color 0.15s'
  }
}