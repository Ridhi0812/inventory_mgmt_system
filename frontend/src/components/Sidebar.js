import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ShoppingCart, Sun, Moon, Box, X } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export default function Sidebar({ isOpen, onClose }) {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight)
  }, [isLight])

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-wrap">
          <div className="logo-icon">
            <Box size={20} />
          </div>
          <div className="logo-text">
            <h1>Inventory</h1>
            <p>Order Management System</p>
          </div>
        </div>
        <button className="theme-btn" title="Toggle theme" onClick={() => setIsLight(l => !l)}>
          {isLight ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Menu</p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">RS</div>
          <div className="user-info">
            <h4>Ridhi Sambhor</h4>
            <p>Admin</p>
          </div>
        </div>
        <div className="status-bar">
          <span className="status-dot" />
          <span className="status-text">All systems operational</span>
        </div>
      </div>
    </aside>
  )
}