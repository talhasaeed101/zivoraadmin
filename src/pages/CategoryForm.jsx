import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { categoryApi, uploadApi } from '../services/api.js';
import './Categories.css';

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  status: 'active',
  sortOrder: 0,
};

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const loadCategory = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await categoryApi.getCategory(id);
        const category = response.data;

        setForm({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || '',
          status: category.status || 'active',
          sortOrder: category.sortOrder ?? 0,
        });
        setImagePreview(category.image || '');
      } catch (err) {
        setError(err.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id, isEditing]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'sortOrder' ? Number(value) : value,
    }));

    if (name === 'image') {
      setUploadError('');
      setImagePreview(value);
      setImageFile(null);
    }
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);
    setUploadError('');
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setForm((prev) => ({ ...prev, image: '' }));
    setImagePreview('');
    setUploadError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setUploadError('');

    let imageUrl = form.image.trim();

    if (imageFile) {
      setUploading(true);

      try {
        const response = await uploadApi.uploadCategoryImage(imageFile);
        imageUrl = response.data?.url || '';
      } catch (err) {
        setUploadError(err.message || 'Failed to upload image');
        setSaving(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      image: imageUrl || undefined,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
    };

    if (form.slug.trim()) {
      payload.slug = form.slug.trim();
    }

    try {
      if (isEditing) {
        await categoryApi.updateCategory(id, payload);
      } else {
        await categoryApi.createCategory(payload);
      }

      navigate('/categories', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Category' : 'Add Category'} label="Catalog">
        <div className="state-card">Loading category...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Category' : 'Add Category'} label="Catalog">
      <div className="categories-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
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
                placeholder="Auto-generated from name if empty"
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

            <div className="admin-form-field admin-form-field-full image-upload-field">
              <label htmlFor="categoryImageFile">Category Image</label>
              <input
                id="categoryImageFile"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                disabled={saving || uploading}
              />
              <span className="field-hint">
                Upload jpg, jpeg, png, or webp up to 5MB. Image is uploaded when you save.
              </span>
              {uploadError && <p className="upload-error">{uploadError}</p>}
              {uploading && <p className="upload-status">Uploading image...</p>}

              {imagePreview && (
                <div className="image-preview-card">
                  <img src={imagePreview} alt="Category preview" className="image-preview" />
                  <button
                    type="button"
                    className="btn-text btn-text-danger"
                    onClick={handleRemoveImage}
                    disabled={saving || uploading}
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="image">Image URL (optional fallback)</label>
              <input
                id="image"
                name="image"
                type="url"
                value={form.image}
                onChange={handleChange}
                disabled={saving || uploading || Boolean(imageFile)}
                placeholder="https://example.com/image.jpg"
              />
              <span className="field-hint">
                Use this if you prefer an external image URL instead of uploading a file.
              </span>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="sortOrder">Sort Order</label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={handleChange}
                disabled={saving || uploading}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn-primary" disabled={saving || uploading}>
              {uploading ? 'Uploading image...' : saving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
            <Link to="/categories" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
