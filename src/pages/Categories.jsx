import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { categoryApi } from '../services/api.js';
import './Categories.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    categoryApi
      .getCategories({
        search: search || undefined,
        limit: 100,
      })
      .then((response) => {
        if (isMounted) {
          setCategories(response.data?.categories || []);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load categories');
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [search, reloadKey]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setSearch(searchInput.trim());
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await categoryApi.deleteCategory(deleteTarget._id);
      setSuccessMessage(`"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Categories" label="Catalog">
      <div className="categories-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </form>

          <Link to="/categories/new" className="btn-primary">
            Add Category
          </Link>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="state-card">
            {search
              ? 'No categories match your search.'
              : 'No categories yet. Create your first category to get started.'}
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Sort Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="category-name-cell">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="category-thumb"
                          />
                        )}
                        <span>{category.name}</span>
                      </div>
                    </td>
                    <td>{category.slug}</td>
                    <td>
                      <span className={`status-badge status-badge-${category.status}`}>
                        {category.status}
                      </span>
                    </td>
                    <td>{category.sortOrder ?? 0}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/categories/${category._id}/edit`} className="btn-text">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn-text btn-text-danger"
                          onClick={() => setDeleteTarget(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete Category"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
              : ''
          }
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AdminLayout>
  );
}
