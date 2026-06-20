import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Users } from 'lucide-react'
import { getCustomers, createCustomer, deleteCustomer } from '../lib/api'
import { getAvatarColor, getInitials } from '../lib/utils'
import Toast from '../components/Toast'

function CustomerModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.full_name || !form.email || !form.phone) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    try {
      await createCustomer(form)
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
          <h3>Add Customer</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label>Full Name</label>
          <input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" />
        </div>
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)

  const load = () => {
    setLoading(true)
    getCustomers().then(r => setCustomers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.full_name}"? This cannot be undone.`)) return
    try {
      await deleteCustomer(c.id)
      setToast({ message: 'Customer deleted.', type: 'success' })
      load()
    } catch (e) {
      setToast({ message: e.response?.data?.detail || 'Delete failed.', type: 'error' })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <h2>Customers</h2>
          <div className="underline-bar" />
          <p>Manage your customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
          />
        </div>
        <span className="result-count">{filtered.length} result(s)</span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No customers found</h3>
            <p>Add your first customer to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar" style={{ background: getAvatarColor(c.full_name) }}>
                        {getInitials(c.full_name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.full_name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(c)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CustomerModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); setToast({ message: 'Customer added!', type: 'success' }); load() }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
