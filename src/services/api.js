import { resolveApiBaseUrl } from '../utils/apiBaseUrl.js';
import { optimizeImage } from '../utils/images.js';

const API_BASE_URL = resolveApiBaseUrl();

const TOKEN_KEY = 'zivora_admin_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const parseApiError = (data, status) => {
  const validationErrors = data.errors || (Array.isArray(data.data) ? data.data : null);

  if (validationErrors?.length) {
    const details = validationErrors
      .map((item) => item.msg || item.message)
      .filter(Boolean)
      .join(', ');
    return details || data.message || `Request failed (${status})`;
  }

  if (data.errorMessage) {
    return data.errorMessage;
  }

  return data.message || `Request failed (${status})`;
};

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    const hint =
      networkError?.message?.includes('Failed to fetch') ||
      networkError?.name === 'TypeError'
        ? 'Could not reach the API server.'
        : networkError.message || 'Network request failed';

    throw new Error(`${hint} [${options.method || 'GET'} ${url}]`, { cause: networkError });
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (response.status === 401) {
    setStoredToken(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    throw new Error(parseApiError(data, response.status));
  }

  return data;
}

export const adminAuthApi = {
  login: (email, password) =>
    request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () => request('/admin/auth/profile'),
};

export const categoryApi = {
  getCategories: (params = {}) => request(`/categories${buildQueryString(params)}`),

  getCategory: (id) => request(`/categories/${id}`),

  createCategory: (payload) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id, payload) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

export const productApi = {
  getProducts: (params = {}) => request(`/products${buildQueryString(params)}`),

  getProduct: (id) => request(`/products/${id}`),

  createProduct: (payload) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),
};

export const orderApi = {
  getOrders: (params = {}) => request(`/admin/orders${buildQueryString(params)}`),

  getOrder: (id) => request(`/admin/orders/${id}`),

  updateOrderStatus: (id, payload) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateOrderShipping: (id, payload) =>
    request(`/admin/orders/${id}/shipping`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const reviewApi = {
  getReviews: (params = {}) => request(`/admin/reviews${buildQueryString(params)}`),

  getReview: (id) => request(`/admin/reviews/${id}`),

  updateReviewStatus: (id, payload) =>
    request(`/admin/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteReview: (id) =>
    request(`/admin/reviews/${id}`, {
      method: 'DELETE',
    }),
};

export const promoCodeApi = {
  getPromoCodes: (params = {}) => request(`/promo-codes${buildQueryString(params)}`),

  getPromoCode: (id) => request(`/promo-codes/${id}`),

  createPromoCode: (payload) =>
    request('/promo-codes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePromoCode: (id, payload) =>
    request(`/promo-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deletePromoCode: (id) =>
    request(`/promo-codes/${id}`, {
      method: 'DELETE',
    }),
};

export const dashboardApi = {
  getOverview: () => request('/admin/dashboard/overview'),

  getRecentOrders: () => request('/admin/dashboard/recent-orders'),

  getTopProducts: () => request('/admin/dashboard/top-products'),
};

export const customerApi = {
  getCustomers: (params = {}) => request(`/admin/customers${buildQueryString(params)}`),

  getCustomer: (id) => request(`/admin/customers/${id}`),

  updateStatus: (id, status) =>
    request(`/admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const notificationApi = {
  getNotifications: (params = {}) => request(`/admin/notifications${buildQueryString(params)}`),

  markRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () => request('/admin/notifications/read-all', { method: 'PATCH' }),
};

export const analyticsApi = {
  getAnalytics: (days = 30) => request(`/admin/analytics?days=${days}`),
};

export const contactApi = {
  getMessages: (params = {}) => request(`/admin/contact-messages${buildQueryString(params)}`),

  updateStatus: (id, status) =>
    request(`/admin/contact-messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const ticketApi = {
  getTickets: (params = {}) => request(`/admin/tickets${buildQueryString(params)}`),

  getTicket: (id) => request(`/admin/tickets/${id}`),

  replyToTicket: (id, payload) =>
    request(`/admin/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTicket: (id, payload) =>
    request(`/admin/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const newsletterApi = {
  getSubscribers: (params = {}) =>
    request(`/admin/newsletter-subscribers${buildQueryString(params)}`),
};

export const uploadApi = {
  getProductImagePresignedUrl: async (filename, fileSize) => {
    return request('/uploads/product-images/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ filename, fileSize }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  verifyProductImageUpload: async (objectKey, expectedSize) => {
    return request('/uploads/product-images/verify', {
      method: 'POST',
      body: JSON.stringify({ objectKey, expectedSize }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Upload multiple product images via backend API (returns array of URLs)
  uploadProductImagesViaBackend: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    return request('/uploads/product-images', {
      method: 'POST',
      body: formData,
    });
  },

  uploadProductImages: async (files, options = {}) => {
    const { onProgress, onError, onSuccess } = options;
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Step 1: Optimize image client-side
        const { file: optimizedFile } = await optimizeImage(file);

        // Step 2: Get presigned URL from backend
        const presignedResponse = await uploadApi.getProductImagePresignedUrl(
          optimizedFile.name,
          optimizedFile.size
        );
        const { presignedUrl, publicUrl, objectKey } = presignedResponse.data;

        // Step 3: Upload directly to R2
        await fetch(presignedUrl, {
          method: 'PUT',
          body: optimizedFile,
          headers: {
            'Content-Type': 'image/webp',
          },
        });

        // Step 4: Verify upload with backend
        await uploadApi.verifyProductImageUpload(objectKey, optimizedFile.size);

        results.push({ file, url: publicUrl, success: true });
        onSuccess?.(i, publicUrl);
      } catch (error) {
        results.push({ file, error, success: false });
        onError?.(i, error);
      }

      onProgress?.(i + 1, files.length);
    }

    return { data: { results } };
  },

  uploadProductVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);

    return request('/uploads/product-video', {
      method: 'POST',
      body: formData,
    });
  },

  uploadSizeChartImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request('/uploads/size-chart', {
      method: 'POST',
      body: formData,
    });
  },

  uploadCategoryImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request('/uploads/category-image', {
      method: 'POST',
      body: formData,
    });
  },
};

export { API_BASE_URL };
