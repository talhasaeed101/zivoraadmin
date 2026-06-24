import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { categoryApi, productApi, uploadApi } from '../services/api.js';
import { categoryNeedsRingSize } from '../utils/categories.js';
import './Products.css';

const MAX_PRODUCT_IMAGES = 8;

const defaultForm = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  price: '',
  oldPrice: '',
  sku: '',
  stock: 0,
  ringSizes: '',
  metalColors: '',
  material: '',
  tags: '',
  isFeatured: false,
  isTrending: false,
  isNewArrival: false,
  status: 'active',
};

const parseCommaList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const joinCommaList = (items) => (items && items.length > 0 ? items.join(', ') : '');

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [manualImageUrls, setManualImageUrls] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const pendingFilesRef = useRef(pendingFiles);
  const imageInputRef = useRef(null);

  pendingFilesRef.current = pendingFiles;

  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const categoriesResponse = await categoryApi.getCategories({ limit: 100, status: 'active' });
        const categoryList = categoriesResponse.data?.categories || [];
        setCategories(categoryList);

        if (!isEditing) {
          setLoading(false);
          return;
        }

        const productResponse = await productApi.getProduct(id);
        const product = productResponse.data;

        setForm({
          title: product.title || '',
          slug: product.slug || '',
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          category:
            typeof product.category === 'object'
              ? product.category._id
              : product.category || '',
          price: product.price ?? '',
          oldPrice: product.oldPrice ?? '',
          sku: product.sku || '',
          stock: product.stock ?? 0,
          ringSizes: joinCommaList(product.ringSizes),
          metalColors: joinCommaList(product.metalColors),
          material: product.material || '',
          tags: joinCommaList(product.tags),
          isFeatured: Boolean(product.isFeatured),
          isTrending: Boolean(product.isTrending),
          isNewArrival: Boolean(product.isNewArrival),
          status: product.status || 'active',
        });
        setImageUrls(product.images || []);
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing]);

  const totalSelectedImages =
    imageUrls.length + pendingFiles.length + parseCommaList(manualImageUrls).length;

  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === form.category) || null,
    [categories, form.category]
  );

  const showRingSizes = categoryNeedsRingSize(selectedCategory);
  const remainingImageSlots = MAX_PRODUCT_IMAGES - totalSelectedImages;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'category') {
      const nextCategory = categories.find((category) => category._id === value);

      setForm((prev) => ({
        ...prev,
        category: value,
        ringSizes: categoryNeedsRingSize(nextCategory) ? prev.ringSizes : '',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'stock'
            ? Number(value)
            : value,
    }));
  };

  const handleImageFilesChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const availableSlots = MAX_PRODUCT_IMAGES - imageUrls.length - pendingFiles.length;

    if (availableSlots <= 0) {
      setUploadError(`Maximum ${MAX_PRODUCT_IMAGES} images allowed.`);
      event.target.value = '';
      return;
    }

    const nextFiles = files.slice(0, availableSlots).map((file) => ({
      file,
      key: `${file.name}-${file.lastModified}-${file.size}`,
      previewUrl: URL.createObjectURL(file),
    }));

    if (files.length > availableSlots) {
      setUploadError(`Only ${availableSlots} more image(s) can be added.`);
    } else {
      setUploadError('');
    }

    setPendingFiles((current) => [...current, ...nextFiles]);
    event.target.value = '';
  };

  const handleRemoveUploadedImage = (index) => {
    setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setUploadError('');
  };

  const handleRemovePendingFile = (index) => {
    setPendingFiles((current) => {
      const removed = current[index];

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setUploadError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setUploadError('');

    let nextImageUrls = [...imageUrls];

    if (pendingFiles.length > 0) {
      setUploading(true);

      try {
        const response = await uploadApi.uploadProductImages(
          pendingFiles.map((item) => item.file)
        );
        const uploadedUrls = response.data?.urls || [];
        nextImageUrls = [...nextImageUrls, ...uploadedUrls];
      } catch (err) {
        setUploadError(err.message || 'Failed to upload images');
        setSaving(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const manualUrls = parseCommaList(manualImageUrls);
    nextImageUrls = [...nextImageUrls, ...manualUrls].slice(0, MAX_PRODUCT_IMAGES);

    const payload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim() || undefined,
      category: form.category,
      images: nextImageUrls,
      price: Number(form.price),
      oldPrice: form.oldPrice !== '' ? Number(form.oldPrice) : undefined,
      sku: form.sku.trim(),
      stock: Number(form.stock) || 0,
      ringSizes: showRingSizes ? parseCommaList(form.ringSizes) : [],
      metalColors: parseCommaList(form.metalColors),
      material: form.material.trim() || undefined,
      tags: parseCommaList(form.tags),
      isFeatured: form.isFeatured,
      isTrending: form.isTrending,
      isNewArrival: form.isNewArrival,
      status: form.status,
    };

    if (form.slug.trim()) {
      payload.slug = form.slug.trim();
    }

    try {
      if (isEditing) {
        await productApi.updateProduct(id, payload);
      } else {
        await productApi.createProduct(payload);
      }

      navigate('/products', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Product' : 'Add Product'} label="Catalog">
        <div className="state-card">Loading product...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Product' : 'Add Product'} label="Catalog">
      <div className="products-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <form className="admin-form-card admin-form-card-wide" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                required
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="slug">Slug</label>
              <input
                id="slug"
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="Auto-generated from title if empty"
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="shortDescription">Short Description</label>
              <input
                id="shortDescription"
                name="shortDescription"
                type="text"
                value={form.shortDescription}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={saving || uploading || categories.length === 0}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <span className="field-hint">Create a category first before adding products.</span>
              )}
            </div>

            <div className="admin-form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving || uploading}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-form-field admin-form-field-full image-upload-field">
              <div className="image-upload-header">
                <label htmlFor="productImages">Product Images</label>
                <span className="image-upload-count">
                  {totalSelectedImages} / {MAX_PRODUCT_IMAGES} selected
                </span>
              </div>

              <input
                ref={imageInputRef}
                id="productImages"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                multiple
                className="image-upload-input-hidden"
                onChange={handleImageFilesChange}
                disabled={saving || uploading || totalSelectedImages >= MAX_PRODUCT_IMAGES}
              />

              <div
                className={`image-upload-dropzone ${remainingImageSlots <= 0 ? 'image-upload-dropzone-full' : ''}`}
                onClick={() => {
                  if (remainingImageSlots > 0 && !saving && !uploading) {
                    imageInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add('image-upload-dropzone-active');
                }}
                onDragLeave={(event) => {
                  event.currentTarget.classList.remove('image-upload-dropzone-active');
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove('image-upload-dropzone-active');

                  if (remainingImageSlots <= 0 || saving || uploading) {
                    return;
                  }

                  const files = Array.from(event.dataTransfer.files || []).filter((file) =>
                    file.type.startsWith('image/')
                  );

                  if (!files.length) {
                    return;
                  }

                  handleImageFilesChange({ target: { files, value: '' } });
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    imageInputRef.current?.click();
                  }
                }}
              >
                <p className="image-upload-dropzone-title">
                  {remainingImageSlots > 0
                    ? 'Drag and drop images here, or click to browse'
                    : 'Maximum image limit reached'}
                </p>
                <p className="image-upload-dropzone-hint">
                  JPG, JPEG, PNG, WEBP up to 5MB each. You can select multiple files at once.
                </p>
                {remainingImageSlots > 0 && (
                  <button
                    type="button"
                    className="btn-secondary image-upload-browse-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      imageInputRef.current?.click();
                    }}
                    disabled={saving || uploading}
                  >
                    Add Images
                  </button>
                )}
              </div>

              <span className="field-hint">Images upload when you save the product.</span>
              {uploadError && <p className="upload-error">{uploadError}</p>}
              {uploading && <p className="upload-status">Uploading images...</p>}

              {(imageUrls.length > 0 || pendingFiles.length > 0) && (
                <div className="image-preview-grid">
                  {imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="image-preview-card">
                      <img src={url} alt={`Product ${index + 1}`} className="image-preview" />
                      <span className="image-preview-badge">Uploaded</span>
                      <button
                        type="button"
                        className="btn-text btn-text-danger"
                        onClick={() => handleRemoveUploadedImage(index)}
                        disabled={saving || uploading}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {pendingFiles.map((item, index) => (
                    <div key={item.key} className="image-preview-card image-preview-pending">
                      <img src={item.previewUrl} alt={item.file.name} className="image-preview" />
                      <span className="image-preview-label">Pending upload</span>
                      <button
                        type="button"
                        className="btn-text btn-text-danger"
                        onClick={() => handleRemovePendingFile(index)}
                        disabled={saving || uploading}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="manualImageUrls">Image URLs (optional fallback)</label>
              <input
                id="manualImageUrls"
                name="manualImageUrls"
                type="text"
                value={manualImageUrls}
                onChange={(event) => {
                  setManualImageUrls(event.target.value);
                  setUploadError('');
                }}
                disabled={saving || uploading}
                placeholder="Comma-separated image URLs"
              />
              <span className="field-hint">
                Example: https://example.com/a.jpg, https://example.com/b.jpg
              </span>
            </div>

            <div className="admin-form-field">
              <label htmlFor="price">Price *</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="oldPrice">Old Price</label>
              <input
                id="oldPrice"
                name="oldPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.oldPrice}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="sku">SKU *</label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={form.sku}
                onChange={handleChange}
                required
                disabled={saving || uploading}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </div>

            {showRingSizes && (
              <div className="admin-form-field">
                <label htmlFor="ringSizes">Ring Sizes</label>
                <input
                  id="ringSizes"
                  name="ringSizes"
                  type="text"
                  value={form.ringSizes}
                  onChange={handleChange}
                  disabled={saving || uploading}
                  placeholder="6, 7, 8"
                />
                <span className="field-hint">Only shown for ring categories.</span>
              </div>
            )}

            <div className="admin-form-field">
              <label htmlFor="metalColors">Metal Colors</label>
              <input
                id="metalColors"
                name="metalColors"
                type="text"
                value={form.metalColors}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="gold, rose-gold, silver"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="material">Material</label>
              <input
                id="material"
                name="material"
                type="text"
                value={form.material}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="18K Gold"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={form.tags}
                onChange={handleChange}
                disabled={saving || uploading}
                placeholder="ring, diamond, wedding"
              />
            </div>

            <div className="admin-form-field admin-form-field-full product-checkbox-group">
              <label className="admin-form-checkbox">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={handleChange}
                  disabled={saving || uploading}
                />
                Is Featured
              </label>
              <label className="admin-form-checkbox">
                <input
                  type="checkbox"
                  name="isTrending"
                  checked={form.isTrending}
                  onChange={handleChange}
                  disabled={saving || uploading}
                />
                Is Trending
              </label>
              <label className="admin-form-checkbox">
                <input
                  type="checkbox"
                  name="isNewArrival"
                  checked={form.isNewArrival}
                  onChange={handleChange}
                  disabled={saving || uploading}
                />
                Is New Arrival
              </label>
            </div>
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || uploading || categories.length === 0}
            >
              {uploading
                ? 'Uploading images...'
                : saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Product'
                    : 'Create Product'}
            </button>
            <Link to="/products" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
