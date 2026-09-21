import { useEffect, useState } from 'react'
import { ArrowLeft, Search, ShoppingBag, ChevronDown } from 'lucide-react'

function AdminOrders({ onBack }) {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [activeStatus, setActiveStatus] = useState('new')

  const statusTabs = [
    ['new', 'Nouvelle'],
    ['processing', 'En traitement'],
    ['shipped', 'Expédiée'],
    ['completed', 'Terminée'],
    ['cancelled', 'Annulée'],
  ]

  const statusCounts = statusTabs.reduce((counts, [value]) => {
    counts[value] = orders.filter((order) => order.status === value).length
    return counts
  }, {})

  const loadOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('untha_admin_token')

      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('untha_admin_token')
        onBack()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les commandes')
      }

      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const updateStatus = async (orderId, status) => {
    const token = localStorage.getItem('untha_admin_token')
    setSavingId(orderId)
    setError('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      )

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('untha_admin_token')
        onBack()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de modifier le statut')
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: data.status }
            : order
        )
      )
    } catch (err) {
      setError(err.message || 'Erreur de modification')
    } finally {
      setSavingId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = order.status === activeStatus
    const searchText = `${order.order_number} ${order.customer_name} ${order.phone} ${order.wilaya}`.toLowerCase()
    const matchesSearch = searchText.includes(search.toLowerCase())

    return matchesStatus && matchesSearch
  })

  return (
    <main className="admin-orders-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Retour au tableau de bord
      </button>

      <section className="admin-orders-card">
        <div className="admin-orders-heading">
          <div className="admin-form-icon">
            <ShoppingBag size={22} />
          </div>

          <div>
            <span className="eyebrow">BOUTIQUE UNTHA</span>
            <h1>Commandes</h1>
            <p>Consultez et gérez les commandes des clientes.</p>
          </div>
        </div>

        <div className="admin-orders-status-tabs">
        {statusTabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`admin-orders-status-tab ${
              activeStatus === value ? 'active' : ''
            }`}
            onClick={() => setActiveStatus(value)}
          >
            <span>{label}</span>
            <strong>{statusCounts[value] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="admin-orders-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une commande..."
          />
        </div>

        {error && <div className="admin-error-state">{error}</div>}

        {loading ? (
          <div className="admin-empty-state">Chargement des commandes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty-state">
            Aucune commande trouvée.
          </div>
        ) : (
          <div className="admin-orders-list">
            {filteredOrders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <button
                  type="button"
                  className="admin-order-row"
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                >
                  <div className="admin-order-icon">
                    <ShoppingBag size={19} />
                  </div>

                  <div className="admin-order-info">
                    <strong>{order.order_number}</strong>
                    <span>{order.customer_name}</span>
                    <small>
                      {order.wilaya} · {order.phone}
                    </small>
                  </div>

                  <div className="admin-order-total">
                    <strong>{Number(order.total).toFixed(2)} DA</strong>
                    <ChevronDown
                      size={17}
                      className={expandedId === order.id ? 'admin-order-chevron open' : 'admin-order-chevron'}
                    />
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="admin-order-details">
                    <div>
                      <span>Client</span>
                      <strong>{order.customer_name}</strong>
                    </div>

                    <div>
                      <span>Téléphone</span>
                      <strong>{order.phone}</strong>
                    </div>

                    <div>
                      <span>Wilaya</span>
                      <strong>{order.wilaya}</strong>
                    </div>

                    <div>
                      <span>Commune</span>
                      <strong>{order.commune}</strong>
                    </div>

                    <div className="admin-order-detail-wide">
                      <span>Adresse</span>
                      <strong>{order.address}</strong>
                    </div>

                    <div>
                      <span>Livraison</span>
                      <strong>
                        {order.delivery_type === 'home' ? 'À domicile' : 'Bureau'}
                      </strong>
                    </div>

                    {order.notes && (
                      <div className="admin-order-detail-wide">
                        <span>Notes</span>
                        <strong>{order.notes}</strong>
                      </div>
                    )}

                    <div className="admin-order-detail-wide">
                      <span>Produits</span>
                      <strong>
                        {Array.isArray(order.items)
                          ? order.items.map((item) => `${item.name} × ${item.quantity || 1}`).join(' · ')
                          : '—'}
                      </strong>
                    </div>

                    <div className="admin-order-detail-wide admin-order-status-box">
                      <span>Statut</span>
                      <select
                        value={order.status}
                        disabled={savingId === order.id}
                        onChange={(event) => {
                        const nextStatus = event.target.value
                        const confirmed = window.confirm(
                          `Confirmer le changement de statut vers « ${nextStatus} » ?`
                        )

                        if (confirmed) {
                          updateStatus(order.id, nextStatus)
                        } else {
                          event.target.value = order.status
                        }
                      }}
                        className="admin-order-status-select"
                      >
                        <option value="new">Nouvelle</option>
                        <option value="processing">En traitement</option>
                        <option value="shipped">Expédiée</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminOrders
