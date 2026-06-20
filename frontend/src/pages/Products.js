import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, SlidersHorizontal, Package } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/api'
import { getAvatarColor, getInitials, getStockStatus, formatCurrency } from '../lib/utils'
import Toast from '../components/Toast'

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

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | product obj
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    getProducts().then(r => setProducts(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

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
          <button className="btn btn-outline" style={{ gap: 6 }}>
            <SlidersHorizontal size={14} /> Filters
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
