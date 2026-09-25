import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react'

function CheckoutUntha({ onBack }) {
  const [product, setProduct] = useState(null)
  const [shippingRates, setShippingRates] = useState([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    deliveryType: 'home',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const savedProduct = sessionStorage.getItem('untha_selected_product')

    if (savedProduct) {
      try {
        const saved = JSON.parse(savedProduct)
        setProduct(saved)
        setQuantity(Math.max(1, Number(saved.quantity) || 1))
      } catch {
        setProduct(null)
      }
    }

    fetch('/api/shipping')
      .then((response) => response.json())
      .then((data) => setShippingRates(Array.isArray(data) ? data : []))
      .catch(() => setShippingRates([]))
  }, [])

  const selectedShipping = shippingRates.find(
    (rate) => rate.wilaya_name === form.wilaya
  )

  const productPrice = product ? Number(product.price) : 0
  const productSubtotal = productPrice * quantity
  const shippingPrice = selectedShipping ? Number(selectedShipping.price) : 0
  const total = productSubtotal + shippingPrice

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const submitOrder = async (event) => {
    event.preventDefault()

    if (!product) return

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_name: form.name,
        phone: form.phone,
        wilaya: form.wilaya,
        commune: form.commune,
        address: form.address,
        delivery_type: form.deliveryType,
        notes: form.notes,
        items: [
          {
            product_id: product.id,
            name: product.name,
            price: productPrice,
            quantity,
          },
        ],
        total,
      }),
    })

    if (!response.ok) return

    sessionStorage.removeItem('untha_selected_product')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="checkout-page">
        <div className="order-success">
          <CheckCircle2 size={48} strokeWidth={1.5} />
          <span className="eyebrow">COMMANDE CONFIRMÉE</span>
          <h1>Merci pour votre commande.</h1>
          <p>
            Votre commande a bien été enregistrée. Nous vous contacterons
            prochainement pour la confirmation.
          </p>
          <button className="premium-button" type="button" onClick={onBack}>
            Retour à la boutique
          </button>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="checkout-page">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="empty-products">
          <p>Aucun produit sélectionné.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Retour à la boutique
      </button>

      <section className="checkout-layout">
        <div className="checkout-summary">
          <span className="eyebrow">VOTRE COMMANDE</span>

          <div className="checkout-product">
            <div className="checkout-product-image">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <ShoppingBag size={30} />
              )}
            </div>

            <div>
              <h2>{product.name}</h2>
              <p>{product.category}</p>
              <strong>{productPrice.toFixed(2)} DA × {quantity}</strong>
            </div>
          </div>

          <div className="checkout-quantity">
            <span>Quantité</span>

            <div className="quantity-control">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label="Diminuer la quantité"
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>
          </div>

          <div className="checkout-total">
            <span>Sous-total</span>
            <strong>{productSubtotal.toFixed(2)} DA</strong>

            <span>Livraison</span>
            <strong>{shippingPrice.toFixed(2)} DA</strong>

            <span>Total</span>
            <strong>{total.toFixed(2)} DA</strong>
          </div>
        </div>

        <form className="checkout-form" onSubmit={submitOrder}>
          <span className="eyebrow">INFORMATIONS DE LIVRAISON</span>
          <h1>Finaliser la commande</h1>

          <label>
            Nom complet
            <input name="name" value={form.name} onChange={updateField} required />
          </label>

          <label>
            Téléphone
            <input name="phone" value={form.phone} onChange={updateField} required />
          </label>

          <label>
            Wilaya
            <select name="wilaya" value={form.wilaya} onChange={updateField} required>
              <option value="">Sélectionner une wilaya</option>
              {shippingRates.map((rate) => (
                <option key={rate.wilaya_code} value={rate.wilaya_name}>
                  {rate.wilaya_code} — {rate.wilaya_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Commune
            <input name="commune" value={form.commune} onChange={updateField} required />
          </label>

          <label>
            Adresse
            <textarea name="address" value={form.address} onChange={updateField} required />
          </label>

          <label>
            Type de livraison
            <select name="deliveryType" value={form.deliveryType} onChange={updateField}>
              <option value="home">À domicile</option>
              <option value="office">Au bureau</option>
            </select>
          </label>

          <label>
            Notes
            <textarea name="notes" value={form.notes} onChange={updateField} />
          </label>

          <button className="premium-button buy-button" type="submit">
            Confirmer la commande
          </button>
        </form>
      </section>
    </main>
  )
}

export default CheckoutUntha
