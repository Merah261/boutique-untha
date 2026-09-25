import { useEffect, useState } from 'react'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'

function AdminProductForm({ onBack, onSaved, product = null }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    cost_price: product?.cost_price ?? '',
    category: product?.category || '',
    published: product?.published ?? true,
  })

  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!product || !Array.isArray(product.images)) return

    setImagePreviews(
      product.images.map((url, index) => ({
        id: `existing-${product.id}-${index}`,
        name: `Image ${index + 1}`,
        url,
        existing: true,
      }))
    )
  }, [product])

  const updateField = (event) => {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImages = (event) => {
    const files = Array.from(event.target.files || [])

    setImageFiles((current) => [...current, ...files])

    const previews = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    setImagePreviews((current) => [...current, ...previews])
    event.target.value = ''
  }

  const removeImage = (index) => {
    setImagePreviews((current) => {
      const image = current[index]

      if (!image?.existing && image?.url) {
        URL.revokeObjectURL(image.url)
      }

      return current.filter((_, i) => i !== index)
    })

    setImageFiles((current) => {
      const preview = imagePreviews[index]

      if (!preview || preview.existing) {
        return current
      }

      const fileIndex = imagePreviews
        .slice(0, index)
        .filter((image) => !image.existing).length

      return current.filter((_, i) => i !== fileIndex)
    })
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('untha_admin_token')

      if (!token) {
        onBack()
        return
      }

      let uploadedImages = []

      if (imageFiles.length > 0) {
        const imageData = new FormData()

        imageFiles.forEach((file) => {
          imageData.append('images', file)
        })

        const uploadResponse = await fetch(
          '/api/admin/upload-images',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: imageData,
          }
        )

        const uploadData = await uploadResponse.json()

        if (uploadResponse.status === 401 || uploadResponse.status === 403) {
          localStorage.removeItem('untha_admin_token')
          onBack()
          return
        }

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.message || 'Échec du téléchargement des images'
          )
        }

        uploadedImages = (uploadData.images || []).map(
          (image) => `${image.url}`
        )
      }

      const response = await fetch(
        product
          ? `/api/products/${product.id}`
          : '/api/products',
        {
          method: product ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            cost_price: Number(form.cost_price) || 0,
            category: form.category.trim(),
            images: product
              ? [
                  ...imagePreviews
                    .filter((image) => image.existing)
                    .map((image) => image.url),
                  ...uploadedImages,
                ]
              : uploadedImages,
            published: form.published,
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
        throw new Error(
          data.message || 'Impossible de créer le produit'
        )
      }

      onSaved(data)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-form-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        Retour aux produits
      </button>

      <section className="admin-form-card">
        <div className="admin-form-heading">
          <div className="admin-form-icon">
            <ImagePlus size={22} />
          </div>

          <div>
            <span className="eyebrow">CATALOGUE</span>
            <h1>{product ? 'Modifier le produit' : 'Ajouter un produit'}</h1>
            <p>
              {product
                ? 'Modifiez les informations de cette pièce.'
                : 'Créez une nouvelle pièce pour votre collection.'}
            </p>
          </div>
        </div>

        <form className="admin-product-form" onSubmit={submitProduct}>
          <label>
            Nom du produit
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Ex. Robe élégante"
              required
            />
          </label>

          <label>
            Catégorie
            <input
              name="category"
              value={form.category}
              onChange={updateField}
              placeholder="Ex. Robes"
            />
          </label>

          <label>
            Prix (DA)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={updateField}
              placeholder="0.00"
              required
            />
          </label>

          <label>
            Prix de revient (DA)
            <input
              name="cost_price"
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={updateField}
              placeholder="0.00"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Décrivez le produit..."
            />
          </label>

          <div className="admin-image-upload">
            <span className="admin-image-upload-label">
              Images du produit
            </span>

            <label className="admin-image-picker">
              <ImagePlus size={21} />
              <span>Choisir des images depuis le téléphone</span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
              />
            </label>

            {imagePreviews.length > 0 && (
              <div className="admin-image-previews">
                {imagePreviews.map((image, index) => (
                  <div className="admin-image-preview" key={image.id}>
                    <img src={image.url} alt={image.name} />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label="Supprimer cette image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="admin-publish-toggle">
            <input
              name="published"
              type="checkbox"
              checked={form.published}
              onChange={updateField}
            />
            <span>Publier immédiatement</span>
          </label>

          {error && (
            <p className="admin-login-error">
              {error}
            </p>
          )}

          <button
            className="premium-button admin-save-button"
            type="submit"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Enregistrement...' : product ? 'Enregistrer les modifications' : 'Enregistrer le produit'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AdminProductForm
