import { useEffect, useState } from 'react'
import { ArrowLeft, Search, Save, Truck } from 'lucide-react'

function AdminShipping({ onBack }) {
  const [rates, setRates] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingCode, setSavingCode] = useState('')
  const [error, setError] = useState('')

  const loadRates = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/shipping')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de charger les tarifs')
      }

      setRates(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRates()
  }, [])

  const updatePrice = (code, value) => {
    setRates((current) =>
      current.map((rate) =>
        rate.wilaya_code === code
          ? { ...rate, price: value }
          : rate
      )
    )
  }

  const saveRate = async (rate) => {
    const token = localStorage.getItem('untha_admin_token')

    setSavingCode(rate.wilaya_code)
    setError('')

    try {
      const response = await fetch(
        `/api/shipping/${rate.wilaya_code}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price: Number(rate.price),
          }),
        }
      )

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('untha_admin_token')
        onBack()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Impossible de sauvegarder')
      }
    } catch (err) {
      setError(err.message || 'Erreur de sauvegarde')
    } finally {
      setSavingCode('')
    }
  }

  const filteredRates = rates.filter((rate) =>
    `${rate.wilaya_code} ${rate.wilaya_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <main className="admin-shipping-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Retour au tableau de bord
      </button>

      <section className="admin-shipping-card">
        <div className="admin-shipping-heading">
          <div className="admin-form-icon">
            <Truck size={22} />
          </div>

          <div>
            <span className="eyebrow">LIVRAISON</span>
            <h1>Tarifs de livraison</h1>
            <p>Gérez les tarifs pour chaque wilaya.</p>
          </div>
        </div>

        <div className="admin-shipping-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une wilaya..."
          />
        </div>

        {error && (
          <div className="admin-error-state">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-empty-state">
            Chargement des tarifs...
          </div>
        ) : filteredRates.length === 0 ? (
          <div className="admin-empty-state">
            Aucune wilaya trouvée.
          </div>
        ) : (
          <div className="admin-shipping-list">
            {filteredRates.map((rate) => (
              <article className="admin-shipping-row" key={rate.wilaya_code}>
                <div className="admin-shipping-wilaya">
                  <span>{rate.wilaya_code}</span>
                  <strong>{rate.wilaya_name}</strong>
                </div>

                <div className="admin-shipping-price">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={rate.price}
                    onChange={(event) =>
                      updatePrice(rate.wilaya_code, event.target.value)
                    }
                  />
                  <span>DA</span>
                </div>

                <button
                  type="button"
                  className="admin-save-rate"
                  onClick={() => saveRate(rate)}
                  disabled={savingCode === rate.wilaya_code}
                >
                  <Save size={16} />
                  {savingCode === rate.wilaya_code ? '...' : 'Enregistrer'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminShipping
