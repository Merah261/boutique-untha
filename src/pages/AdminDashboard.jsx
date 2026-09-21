import { useEffect, useState } from 'react'
import { Pencil, LayoutDashboard, LogOut, Package, Plus, RefreshCw, ShoppingBag, Truck } from 'lucide-react'

function AdminDashboard({ onLogout, onAddProduct, onEditProduct, onShipping, onOrders }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [profit, setProfit] = useState(0)

  const loadProducts = async () => {
    const token = localStorage.getItem('untha_admin_token')

    if (!token) {
      onLogout()
      return
    }

    setLoading(true)
    setRefreshing(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('untha_admin_token')
        onLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de chargement')
      }

      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Impossible de charger les produits')
    } finally {
      setLoading(false)
      await loadProfit()
      setRefreshing(false)
    }
  }

  const loadProfit = async () => {
    const token = localStorage.getItem('untha_admin_token')

    if (!token) return

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) return

      const data = await response.json()

      const totalProfit = Array.isArray(data)
        ? data
            .filter((order) => order.status === 'completed')
            .reduce((sum, order) => sum + (Number(order.profit) || 0), 0)
        : 0

      setProfit(totalProfit)
    } catch {
      setProfit(0)
    }
  }

  useEffect(() => {
    loadProducts()
    loadProfit()
  }, [])

  const logout = () => {
    localStorage.removeItem('untha_admin_token')
    window.location.href = '/admin-untha'
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <span className="eyebrow">BOUTIQUE UNTHA</span>
          <h1>Tableau de bord</h1>
          <p>Gestion de votre collection.</p>
        </div>

        <div className="admin-dashboard-actions">
          <button type="button" className="premium-button admin-add-button" onClick={onAddProduct}>
            <Plus size={17} />
            Ajouter un produit
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadProducts}
            disabled={refreshing}
          >
            <RefreshCw size={17} className={refreshing ? 'admin-refresh-spin' : ''} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>

          <button type="button" className="admin-secondary-button" onClick={logout}>
            <LogOut size={17} />
            Déconnexion
          </button>
        </div>
      </header>

      <div className="admin-stats-grid">
        <section className="admin-stat-card">
          <div className="admin-stat-icon">
            <Package size={22} />
          </div>
          <div>
            <span>Produits</span>
            <strong>{products.length}</strong>
          </div>
        </section>

        <section className="admin-stat-card admin-profit-card">
          <div className="admin-stat-icon">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span>Bénéfice</span>
            <strong>{profit.toFixed(2)} DA</strong>
          </div>
        </section>
      </div>

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">CATALOGUE</span>
            <h2>Produits</h2>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">
            Chargement des produits...
          </div>
        ) : error ? (
          <div className="admin-error-state">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            Aucun produit pour le moment.
          </div>
        ) : (
          <div className="admin-products-list">
            {products.map((product) => (
              <article className="admin-product-row" key={product.id}>
                <div className="admin-product-preview">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <Package size={22} />
                  )}
                </div>

                <div className="admin-product-info">
                  <h3>{product.name}</h3>
                  <span>{product.category || 'Sans catégorie'}</span>
                </div>

                <div className="admin-product-prices">
                  <strong className="admin-product-price">
                    {Number(product.price).toFixed(2)} DA
                  </strong>
                  <span className="admin-product-cost">
                    Coût : {Number(product.cost_price || 0).toFixed(2)} DA
                  </span>
                </div>

                <span className={product.published ? 'admin-status published' : 'admin-status hidden'}>
                  {product.published ? 'Publié' : 'Masqué'}
                </span>

                <button
                  type="button"
                  className="admin-product-edit-button"
                  onClick={() => onEditProduct(product)}
                  aria-label={`Modifier ${product.name}`}
                >
                  <Pencil size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="admin-bottom-nav" aria-label="Navigation administration">
        <button
          type="button"
          className="admin-bottom-nav-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <LayoutDashboard size={21} />
          <span>Accueil</span>
        </button>

        <button
          type="button"
          className="admin-bottom-nav-item"
          onClick={onShipping}
        >
          <Truck size={21} />
          <span>Livraison</span>
        </button>

        <button
          type="button"
          className="admin-bottom-nav-item"
          onClick={onOrders}
        >
          <ShoppingBag size={21} />
          <span>Commandes</span>
        </button>
      </nav>
    </main>
  )
}

export default AdminDashboard
