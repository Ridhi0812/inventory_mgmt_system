import { useState, useEffect } from 'react'
import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'
import {
  getDashboardStats, getOrdersLast7Days, getStockHealth,
  getTopProducts, getLowStockProducts
} from '../lib/api'
import { formatCurrency, getGreeting, getAvatarColor, getInitials } from '../lib/utils'

const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [stockHealth, setStockHealth] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getOrdersLast7Days(),
      getStockHealth(),
      getTopProducts(),
      getLowStockProducts()
    ]).then(([s, c, sh, tp, ls]) => {
      setStats(s.data)
      setChartData(c.data.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }) })))
      setStockHealth(sh.data)
      setTopProducts(tp.data)
      setLowStock(ls.data)
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
  const weekOrders = chartData.reduce((a, d) => a + d.count, 0)

  const statCards = [
    { label: 'Total Products', value: stats?.total_products ?? 0, icon: Package, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: 'Total Customers', value: stats?.total_customers ?? 0, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Total Orders', value: stats?.total_orders ?? 0, icon: ShoppingCart, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Low Stock Items', value: stats?.low_stock_count ?? 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ]

  const donutData = stockHealth ? [
    { name: 'Healthy', value: stockHealth.healthy },
    { name: 'Low', value: stockHealth.low },
    { name: 'Out of stock', value: stockHealth.out_of_stock },
  ] : []

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      {/* Hero banner */}
      <div className="dashboard-hero">
        <div>
          <p className="hero-date">{today}</p>
          <h2 className="hero-greeting">{getGreeting()} 👋</h2>
          <p className="hero-sub">Here's what's happening with your store today.</p>
        </div>
        <div className="revenue-card">
          <p className="revenue-label">Total Revenue</p>
          <p className="revenue-amount">{formatCurrency(stats?.total_revenue)}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={22} color={color} />
            </div>
            <div className="stat-info">
              <h3>{value}</h3>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Orders — last 7 days</h3>
            <span>{weekOrders} orders this week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#8b9cc8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#8b9cc8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#131d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff' }}
              />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Stock Health</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                label={false}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i]} />
                ))}
              </Pie>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fill: '#f0f4ff', fontSize: 22, fontWeight: 800 }}>
                {stockHealth?.total ?? 0}
              </text>
              <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" style={{ fill: '#8b9cc8', fontSize: 11 }}>
                products
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-legend">
            {[{ label: 'Healthy', color: '#10b981' }, { label: 'Low', color: '#f59e0b' }, { label: 'Out of stock', color: '#ef4444' }].map(({ label, color }) => (
              <div className="legend-item" key={label}>
                <div className="legend-dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products bar chart */}
      {topProducts.length > 0 && (
        <div className="section-card">
          <h3>Top Products by Units Sold</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8b9cc8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8b9cc8', fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip
                contentStyle={{ background: '#131d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff' }}
              />
              <Bar dataKey="total_sold" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div className="section-card">
          <h3>Low Stock Products</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>In Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="name-cell">
                        <div className="prod-avatar" style={{ background: getAvatarColor(p.name) }}>
                          {getInitials(p.name)}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td><span className="sku-tag">{p.sku}</span></td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>
                      {p.quantity === 0
                        ? <span className="badge badge-red">● 0 left</span>
                        : <span className="badge badge-amber">● {p.quantity} left</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
