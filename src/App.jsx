import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import ProductUntha from './pages/ProductUntha'
import CheckoutUntha from './pages/CheckoutUntha'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminProductForm from './pages/AdminProductForm'
import AdminShipping from './pages/AdminShipping'
import AdminOrders from './pages/AdminOrders'
import boutiqueImage from './assets/Boutique.jpg'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => {
        console.log('API PRODUCTS:', data)
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [])

  if (currentPath === '/admin-untha/products/new') {
    const adminToken = localStorage.getItem('untha_admin_token')

    if (!adminToken) {
      window.history.replaceState({}, '', '/admin-untha')
      return (
        <AdminLogin
          onLogin={() => {
            window.history.replaceState({}, '', '/admin-untha')
            setCurrentPath('')
            setTimeout(() => setCurrentPath('/admin-untha'), 0)
          }}
        />
      )
    }

    return (
      <AdminProductForm
        onBack={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
        onSaved={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
      />
    )
  }

  if (currentPath.startsWith('/admin-untha/products/') && currentPath.endsWith('/edit')) {
    const adminToken = localStorage.getItem('untha_admin_token')

    if (!adminToken) {
      window.history.replaceState({}, '', '/admin-untha')
      return (
        <AdminLogin
          onLogin={() => {
            window.location.href = '/admin-untha'
          }}
        />
      )
    }

    const productId = Number(currentPath.split('/')[3])
    const product = products.find((item) => Number(item.id) === productId)

    if (loadingProducts) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          color: '#d46a9b',
          fontFamily: 'Arial'
        }}>
          Chargement du produit...
        </div>
      )
    }

    if (!product) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: '#fff',
          color: '#333',
          fontFamily: 'Arial'
        }}>
          <h2>Produit introuvable</h2>
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/admin-untha')
              setCurrentPath('/admin-untha')
            }}
          >
            Retour à l'administration
          </button>
        </div>
      )
    }

    return (
      <AdminProductForm
        product={product}
        onBack={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
        onSaved={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
      />
    )
  }

  if (currentPath === '/admin-untha') {
    const adminToken = localStorage.getItem('untha_admin_token')

    if (!adminToken) {
      return (
        <AdminLogin
          onLogin={() => {
            setTimeout(() => {
              window.location.assign('/admin-untha')
            }, 0)
          }}
        />
      )
    }

    return (
      <AdminDashboard
        onLogout={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
        onAddProduct={() => {
          window.history.pushState({}, '', '/admin-untha/products/new')
          setCurrentPath('/admin-untha/products/new')
        }}
        onEditProduct={(product) => {
          window.history.pushState({}, '', `/admin-untha/products/${product.id}/edit`)
          setCurrentPath(`/admin-untha/products/${product.id}/edit`)
        }}
        onShipping={() => {
          window.history.pushState({}, '', '/admin-untha/shipping')
          setCurrentPath('/admin-untha/shipping')
        }}
        onOrders={() => {
          window.history.pushState({}, '', '/admin-untha/orders')
          setCurrentPath('/admin-untha/orders')
        }}
      />
    )
  }

  if (currentPath === '/admin-untha/shipping') {
    return (
      <AdminShipping
        onBack={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
      />
    )
  }

  if (currentPath === '/admin-untha/orders') {
    return (
      <AdminOrders
        onBack={() => {
          window.history.pushState({}, '', '/admin-untha')
          setCurrentPath('/admin-untha')
        }}
      />
    )
  }

  if (currentPath === '/commande') {
    return (
      <CheckoutUntha
        onBack={() => {
          window.history.pushState({}, '', '/')
          setCurrentPath('/')
        }}
      />
    )
  }

  if (currentPath.startsWith('/produit/')) {
    const productId = Number(currentPath.split('/').pop())
    const selectedProduct = products.find((product) => product.id === productId)

    return (
      <ProductUntha
        product={selectedProduct}
        onBack={() => {
          window.history.pushState({}, '', '/')
          setCurrentPath('/')
        }}
      />
    )
  }

  if (products.length > 0) {
    console.log('UNTHA DEBUG PRODUCTS:', products)
  }

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) return true

    return `${product.name} ${product.category} ${product.description || ''}`
      .toLowerCase()
      .includes(term)
  })

  return (
    <div className="untha-app">
      <header className="store-header">
        <div className="brand">
          <span className="brand-name">Boutique UNTHA</span>
          <span className="brand-subtitle">Mode féminine</span>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Rechercher"
          onClick={() => {
            setSearchOpen((current) => !current)
            setTimeout(() => {
              document.getElementById('untha-search-input')?.focus()
            }, 0)
          }}
        >
          <Search size={18} strokeWidth={1.8} />
          <span>Rechercher</span>
        </button>
      </header>

      <main className="store-main">
        <section className="hero-section">
          <div className="hero-image">
            <img src={boutiqueImage} alt="Boutique UNTHA" />
          </div>

          <div className="hero-content">
            <span className="eyebrow">BOUTIQUE UNTHA</span>
            <h1>Élégance féminine, simplement.</h1>
            <p>
              Découvrez notre sélection de pièces féminines choisies avec soin.
            </p>

            <button
              className="premium-button"
              type="button"
              onClick={() => {
                document.getElementById('untha-products')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
            >
              Découvrir la collection
            </button>
          </div>
        </section>

        <section className="products-section" id="untha-products">
          {searchOpen && (
            <div className="store-search-panel">
              <Search size={18} strokeWidth={1.8} />
              <input
                id="untha-search-input"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un produit..."
              />
            </div>
          )}

          <div className="section-heading">
            <div>
              <span className="eyebrow">COLLECTION</span>
              <h2>Nos produits</h2>
            </div>
          </div>

          {loadingProducts ? (
            <div className="empty-products">
              <p>Chargement de la collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-products">
              <p>Les produits seront bientôt disponibles.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-products">
              <p>Aucun produit ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <article
                  className="product-card"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    window.history.pushState({}, '', `/produit/${product.id}`)
                    setCurrentPath(`/produit/${product.id}`)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      window.history.pushState({}, '', `/produit/${product.id}`)
                      setCurrentPath(`/produit/${product.id}`)
                    }
                  }}
                >
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <span>Boutique UNTHA</span>
                    )}
                  </div>

                  <div className="product-card-content">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>
                    <strong>{Number(product.price).toFixed(2)} DA</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
