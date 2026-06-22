import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, SlidersHorizontal, Package, X, ChevronDown } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/api'
import { getAvatarColor, getInitials, getStockStatus, formatCurrency } from '../lib/utils'
import Toast from '../components/Toast'

function FilterModal({ filters, onApply, onClose }) {
  const [local, setLocal] = useState(filters)

  const toggleStock = (val) =>
    setLocal(f => ({
      ...f,
      stockStatus: f.stockStatus.includes(val)
        ? f.stockStatus.filter(s => s !== val)
        : [...f.stockStatus, val],
    }))

  const clear = () =>
    setLocal({ stockStatus: [], priceMin: '', priceMax: '', qtyMin: '', qtyMax: '', sortBy: 'newest' })

  const chipStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: 999,
    border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
    background: active ? 'rgba(16,185,129,0.18)' : 'transparent',
    color: active ? '#10b981' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Filter Products</h3>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="form-group">
          <label style={{ marginBottom: 10 }}>Stock status</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['out_of_stock', 'low_stock', 'healthy'].map(val => (
              <button
                key={val}
                style={chipStyle(local.stockStatus.includes(val))}
                onClick={() => toggleStock(val)}
              >
                {val === 'out_of_stock' ? 'Out of stock' : val === 'low_stock' ? 'Low stock' : 'Healthy'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Price range</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="form-input"
              type="number" min="0" placeholder="Min"
              value={local.priceMin}
              onChange={e => setLocal(f => ({ ...f, priceMin: e.target.value }))}
            />
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>to</span>
            <input
              className="form-input"
              type="number" min="0" placeholder="Max"
              value={local.priceMax}
              onChange={e => setLocal(f => ({ ...f, priceMax: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Stock quantity range</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="form-input"
              type="number" min="0" placeholder="Min"
              value={local.qtyMin}
              onChange={e => setLocal(f => ({ ...f, qtyMin: e.target.value }))}
            />
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>to</span>
            <input
              className="form-input"
              type="number" min="0" placeholder="Max"
              value={local.qtyMax}
              onChange={e => setLocal(f => ({ ...f, qtyMax: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Sort by</label>
          <div style={{ position: 'relative' }}>
            <select
              className="form-input"
              value={local.sortBy}
              onChange={e => setLocal(f => ({ ...f, sortBy: e.target.value }))}
              style={{ appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
            >
              <option value="newest">Newest first (default)</option>
              <option value="oldest">Oldest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="qty_asc">Stock: Low to High</option>
              <option value="qty_desc">Stock: High to Low</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px -24px 0', padding: '16px 24px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: '10px 4px' }}
            onClick={clear}
          >Clear all</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            onClick={() => { onApply(local); onClose() }}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
          >Apply Filters</button>
        </div>
      </div>
    </div>
  )
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    price: product?.price ?? '',
    quantity: product?.quantity ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.sku || form.price === '' || form.quantity === '') {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    try {
      const payload = { name: form.name, sku: form.sku, price: parseFloat(form.price), quantity: parseInt(form.quantity) }
      if (isEdit) {
        await updateProduct(product.id, { name: form.name, price: parseFloat(form.price), quantity: parseInt(form.quantity) })
      } else {
        await createProduct(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label>Product Name</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Mouse" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>SKU / Code</label>
            <input className="form-input" name="sku" value={form.sku} onChange={handleChange} placeholder="SKU-001" disabled={isEdit} />
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input className="form-input" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
          </div>
        </div>
        <div className="form-group">
          <label>Quantity in Stock</label>
          <input className="form-input" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} placeholder="0" />
        </div>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_FILTERS = { stockStatus: [], priceMin: '', priceMax: '', qtyMin: '', qtyMax: '', sortBy: 'newest' }

function applyFilters(products, filters) {
  let list = [...products]

  if (filters.stockStatus.length) {
    list = list.filter(p => {
      const qty = p.quantity
      if (filters.stockStatus.includes('out_of_stock') && qty === 0) return true
      if (filters.stockStatus.includes('low_stock') && qty > 0 && qty <= 10) return true
      if (filters.stockStatus.includes('healthy') && qty > 10) return true
      return false
    })
  }

  if (filters.priceMin !== '') list = list.filter(p => p.price >= parseFloat(filters.priceMin))
  if (filters.priceMax !== '') list = list.filter(p => p.price <= parseFloat(filters.priceMax))
  if (filters.qtyMin !== '')   list = list.filter(p => p.quantity >= parseInt(filters.qtyMin))
  if (filters.qtyMax !== '')   list = list.filter(p => p.quantity <= parseInt(filters.qtyMax))

  switch (filters.sortBy) {
    case 'price_asc':  list.sort((a, b) => a.price - b.price); break
    case 'price_desc': list.sort((a, b) => b.price - a.price); break
    case 'qty_asc':    list.sort((a, b) => a.quantity - b.quantity); break
    case 'qty_desc':   list.sort((a, b) => b.quantity - a.quantity); break
    case 'name_asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'name_desc':  list.sort((a, b) => b.name.localeCompare(a.name)); break
    case 'oldest':     list.sort((a, b) => a.id - b.id); break
    default: break
  }

  return list
}

function hasActiveFilters(f) {
  return f.stockStatus.length || f.priceMin || f.priceMax || f.qtyMin || f.qtyMax || f.sortBy !== 'newest'
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    getProducts().then(r => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = applyFilters(
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    ),
    filters
  )

  const activeFilters = hasActiveFilters(filters)

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(p.id)
      setToast({ message: 'Product deleted.', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.detail || 'Delete failed.', type: 'error' })
    }
  }

  const handleSaved = () => {
    setModal(null)
    setToast({ message: modal === 'add' ? 'Product added!' : 'Product updated!', type: 'success' })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Products</h2>
          <div className="underline-bar" />
          <p>Manage your product catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
          />
        </div>
        <div className="toolbar-right">
          <span className="result-count">{filtered.length} result(s)</span>
          <button
            className="btn btn-outline"
            style={activeFilters ? { borderColor: '#10b981', color: '#10b981', gap: 6 } : { gap: 6 }}
            onClick={() => setShowFilter(true)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters && (
              <span style={{
                background: '#10b981', color: '#fff',
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                padding: '1px 6px', marginLeft: 2,
              }}>●</span>
            )}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40} />
            <h3>No products found</h3>
            <p>Add your first product to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stock = getStockStatus(p.quantity)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="name-cell">
                        <div className="prod-avatar" style={{ background: getAvatarColor(p.name) }}>
                          {getInitials(p.name)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="sku-tag">{p.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td>
                      <div className="stock-badge" style={{ background: stock.bg, color: stock.color }}>
                        <span className="dot" style={{ background: stock.color }} />
                        {stock.label}
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost" onClick={() => setModal(p)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(p)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showFilter && (
        <FilterModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setShowFilter(false)}
        />
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}