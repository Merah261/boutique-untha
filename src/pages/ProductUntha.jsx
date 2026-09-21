import { useState } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

function ProductUntha({ product, onBack }) {
  const images = Array.isArray(product?.images) && product.images.length
    ? product.images
    : []

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <main className="product-page">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          Retour
        </button>
        <div className="empty-products">
          <p>Produit introuvable.</p>
        </div>
      </main>
    )
  }

  const buyProduct = () => {
    sessionStorage.setItem(
      'untha_selected_product',
      JSON.stringify({
        ...product,
        quantity,
      })
    )
    window.history.pushState({}, '', '/commande')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <main className="product-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Retour à la collection
      </button>

      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-main-image">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} />
            ) : (
              <span>Boutique UNTHA</span>
            )}

            {images.length > 0 && (
              <span className="image-counter">
                {selectedImage + 1} / {images.length}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="product-thumbnails">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={index === selectedImage ? 'thumbnail active' : 'thumbnail'}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <span className="eyebrow">{product.category || 'COLLECTION'}</span>

          <h1>{product.name}</h1>

          <strong className="product-detail-price">
            {Number(product.price).toFixed(2)} DA
          </strong>

          {product.description && (
            <p className="product-description">
              {product.description}
            </p>
          )}

          <div className="product-quantity">
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

          <button className="premium-button buy-button" type="button" onClick={buyProduct}>
            <ShoppingBag size={18} />
            Acheter
          </button>
        </div>
      </section>
    </main>
  )
}

export default ProductUntha
