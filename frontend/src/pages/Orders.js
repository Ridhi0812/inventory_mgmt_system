import { useState, useEffect } from 'react'
import { Plus, Search, Eye, Trash2, ShoppingCart, X } from 'lucide-react'
import { getOrders, createOrder, deleteOrder, getProducts, getCustomers } from '../lib/api'
import { getAvatarColor, getInitials, formatCurrency, formatDate } from '../lib/utils'
import Toast from '../components/Toast'

function OrderDetailModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Order #{order.id}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="order-detail-section">
          <h4>Customer</h4>
          <div className="order-detail-item">
            <div className="name-cell">
              <div className="avatar avatar-sm" style={{ background: getAvatarColor(order.customer?.full_name || '') }}>
                {getInitials(order.customer?.full_name || '')}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customer?.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.customer?.email}</div>
              </div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className="order-detail-section">
          <h4>Items ({order.items?.length})</h4>
          {order.items?.map((item, i) => (
            <div className="order-detail-item" key={i}>
              <div className="name-cell">
                <div className="prod-avatar" style={{ background: getAvatarColor(item.product?.name || '') }}>
                  {getInitials(item.product?.name || '')}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.product?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </div>
                </div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                {formatCurrency(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="order-total-row">
          <span>Total Amount</span>
          <span>{formatCurrency(order.total_amount)}</span>
        </div>
      </div>
    </div>
  )
}

function CreateOrderModal({ onClose, onSaved }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()]).then(([c, p]) => {
      setCustomers(c.data)
      setProducts(p.data)
    })
  }, [])

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }])
  const removeItem = (idx) => setItems(i => i.filter((_, ii) => ii !== idx))
  const updateItem = (idx, field, value) => setItems(i => i.map((item, ii) => ii === idx ? { ...item, [field]: value } : item))

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find(p => p.id === parseInt(item.product_id))
      return sum + (prod ? prod.price * parseInt(item.quantity || 0) : 0)
    }, 0)
  }

  const handleSubmit = async () => {
    setError('')
    if (!customerId) { setError('Please select a customer.'); return }
    if (items.some(i => !i.product_id || !i.quantity)) { setError('All items must have a product and quantity.'); return }
    setSaving(true)
    try {
      await createOrder({
        customer_id: parseInt(customerId),
        items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) }))
      })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Create Order</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div className="form-group">
          <label>Customer</label>
          <select className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Order Items</label>
          <div className="order-items-list">
            {items.map((item, idx) => (
              <div className="order-item-row" key={idx}>
                <select className="form-input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity}) — {formatCurrency(p.price)}</option>
                  ))}
                </select>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                />
                {items.length > 1 && (
                  <button className="btn btn-danger" onClick={() => removeItem(idx)} style={{ padding: '8px' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="add-item-btn" onClick={addItem}>
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="order-total-row">
          <span>Estimated Total</span>
          <span>{formatCurrency(calcTotal())}</span>
        </div>

        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewOrder, setViewOrder] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    getOrders().then(r => setOrders(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o =>
    o.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.id).includes(search)
  )

  const handleDelete = async (o) => {
    if (!window.confirm(`Cancel order #${o.id}? Stock will be restored.`)) return
    try {
      await deleteOrder(o.id)
      setToast({ message: `Order #${o.id} cancelled and stock restored.`, type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.detail || 'Delete failed.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Orders</h2>
          <div className="underline-bar" />
          <p>Track and manage orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or order #..."
          />
        </div>
        <span className="result-count">{filtered.length} result(s)</span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={40} />
            <h3>No orders yet</h3>
            <p>Create your first order to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>
                    <div className="name-cell">
                      <div className="avatar avatar-sm" style={{ background: getAvatarColor(o.customer?.full_name || '') }}>
                        {getInitials(o.customer?.full_name || '')}
                      </div>
                      {o.customer?.full_name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {o.items?.length} {o.items?.length === 1 ? 'item' : 'items'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(o.total_amount)}</td>
                  <td>
                    <span className="badge badge-green">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block' }} />
                      Completed
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(o.created_at)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-ghost" onClick={() => setViewOrder(o)} title="View details">
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(o)} title="Cancel order">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); setToast({ message: 'Order placed!', type: 'success' }); load() }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
