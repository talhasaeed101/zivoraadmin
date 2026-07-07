import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { categoryApi, productApi } from '../services/api.js';
import './Products.css';

const formatPrice = (value) => {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    categoryApi
      .getCategories({ limit: 100 })
      .then((response) => {
        if (isMounted) {
          setCategories(response.data?.categories || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCategories([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    productApi
      .getProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      })
      .then((response) => {
        if (isMounted) {
          setProducts(response.data?.products || []);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load products');
          setProducts([]);
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
  }, [search, categoryFilter, statusFilter, reloadKey]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setSearch(searchInput.trim());
  };

  const handleCategoryFilterChange = (event) => {
    setLoading(true);
    setCategoryFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setLoading(true);
    setStatusFilter(event.target.value);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await productApi.deleteProduct(deleteTarget._id);
      setSuccessMessage(`"${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (product) => {
    if (!product.category) {
      return '—';
    }

    if (typeof product.category === 'object') {
      return product.category.name || '—';
    }

    return '—';
  };

  return (
    <AdminLayout title="Products" label="Catalog">
      <div className="products-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search by title or SKU..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>

          <Link to="/products/new" className="btn-primary">
            Add Product
          </Link>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="state-card">
            {search || categoryFilter || statusFilter
              ? 'No products match your filters.'
              : 'No products yet. Create your first product to get started.'}
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-name-cell">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="product-thumb"
                          />
                        )}
                        <div>
                          <strong>{product.title}</strong>
                          <span className="product-slug">{product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{getCategoryName(product)}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.stock ?? 0}</td>
                    <td>
                      <span className={`status-badge status-badge-${product.status}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="product-flags">
                        {product.isFeatured && <span className="product-flag">Featured</span>}
                        {product.isTrending && <span className="product-flag">Trending</span>}
                        {product.isNewArrival && <span className="product-flag">New</span>}
                        {product.isCustomizable && (
                          <span className="product-flag product-flag-custom">Customizable</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/products/${product._id}/edit`} className="btn-text">
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn-text btn-text-danger"
                          onClick={() => setDeleteTarget(product)}
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
          title="Delete Product"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
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
