import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import CustomizationOptionsSection from '../components/CustomizationOptionsSection.jsx';
import { categoryApi, productApi, uploadApi } from '../services/api.js';
import { getDefaultCustomizationOptions, mergeCustomizationOptions } from '../constants/customization.js';
import { categoryNeedsRingSize } from '../utils/categories.js';
import { optimizeImage } from '../utils/images.js';
import {
  buildVariantCombinations,
  createDefaultVariationGroups,
  DEFAULT_RING_SIZE_OPTIONS,
  deriveLegacyFieldsFromVariations,
  mergeVariantsWithCombinations,
} from '../utils/productVariations.js';
import './Products.css';

const MIN_PRODUCT_IMAGES = 8;
const MAX_PRODUCT_IMAGES = 12;

const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB

const createDefaultForm = () => ({
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  brand: '',
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
  isCustomizable: false,
  customizationOptions: getDefaultCustomizationOptions(),
  status: 'active',
});

const PendingImageStatus = {
  PENDING: 'pending',
  OPTIMIZING: 'optimizing',
  REQUESTING_URL: 'requesting_url',
  UPLOADING: 'uploading',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  ERROR: 'error',
};

const parseCommaList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const joinCommaList = (items) => (items && items.length > 0 ? items.join(', ') : '');

const normalizeVariationGroups = (groups, showRingSizes) => {
  if (groups?.length) {
    return groups.map((group) => ({
      name: group.name || '',
      options: [...(group.options || [])],
    }));
  }

  const defaults = createDefaultVariationGroups();

  if (showRingSizes) {
    defaults[1].options = [...DEFAULT_RING_SIZE_OPTIONS];
  } else {
    defaults.splice(1, 1);
  }

  return defaults;
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(createDefaultForm);
  const [categories, setCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]); // Array of { file, key, previewUrl, status, error, url, optimizedFile }
  const [manualImageUrls, setManualImageUrls] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pendingVideoFile, setPendingVideoFile] = useState(null);
  const [addVariations, setAddVariations] = useState(false);
  const [variationGroups, setVariationGroups] = useState(createDefaultVariationGroups());
  const [variants, setVariants] = useState([]);
  const [sizeChartEnabled, setSizeChartEnabled] = useState(false);
  const [sizeChartUrl, setSizeChartUrl] = useState('');
  const [pendingSizeChartFile, setPendingSizeChartFile] = useState(null);
  const [batchStock, setBatchStock] = useState('');
  const [batchPrice, setBatchPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const pendingFilesRef = useRef(pendingFiles);
  const isProcessingRef = useRef(false); // To prevent concurrent processing
  const isMountedRef = useRef(true); // To prevent setState on unmounted component
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const sizeChartInputRef = useRef(null);

  // Helper to check if any files are being processed
  const isProcessing = useMemo(() => {
    return pendingFiles.some(pf => 
      pf.status !== PendingImageStatus.SUCCESS && 
      pf.status !== PendingImageStatus.ERROR &&
      pf.status !== PendingImageStatus.PENDING
    );
  }, [pendingFiles]);

  useEffect(() => {
    pendingFilesRef.current = pendingFiles;
  }, [pendingFiles]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);



  const buildSyncedVariants = (groups, currentVariants) =>
    mergeVariantsWithCombinations(buildVariantCombinations(groups), currentVariants, {
      stock: form.stock || 0,
      price: form.price || '',
    });

  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      if (pendingVideoFile?.previewUrl) {
        URL.revokeObjectURL(pendingVideoFile.previewUrl);
      }
      if (pendingSizeChartFile?.previewUrl) {
        URL.revokeObjectURL(pendingSizeChartFile.previewUrl);
      }
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
        const categoryId =
          typeof product.category === 'object' ? product.category._id : product.category || '';
        const selectedCategory = categoryList.find((category) => category._id === categoryId);
        const showRingSizes = categoryNeedsRingSize(selectedCategory);

        setForm({
          title: product.title || '',
          slug: product.slug || '',
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          category: categoryId,
          brand: product.brand || '',
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
          isCustomizable: Boolean(product.isCustomizable),
          customizationOptions: mergeCustomizationOptions(product.customizationOptions),
          status: product.status || 'active',
        });
        setImageUrls(product.images || []);
        setVideoUrl(product.video || '');
        setAddVariations(Boolean(product.variationGroups?.length || product.variants?.length));
        setVariationGroups(normalizeVariationGroups(product.variationGroups, showRingSizes));
        setVariants(product.variants || []);
        setSizeChartEnabled(Boolean(product.sizeChart?.enabled));
        setSizeChartUrl(product.sizeChart?.imageUrl || '');
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
  const previewImage = pendingFiles[0]?.previewUrl || imageUrls[0] || '';

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'category') {
      const nextCategory = categories.find((category) => category._id === value);
      const needsRingSize = categoryNeedsRingSize(nextCategory);

      setForm((prev) => ({
        ...prev,
        category: value,
        ringSizes: needsRingSize ? prev.ringSizes : '',
      }));

      if (addVariations) {
        setVariationGroups(normalizeVariationGroups(variationGroups, needsRingSize));
      }

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'stock' ? Number(value) : value,
    }));
  };

  const handleImageFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const oversized = files.find((file) => file.size > MAX_SOURCE_IMAGE_BYTES);
    if (oversized) {
      setUploadError(
        `"${oversized.name}" is too large. Each source image must be ${MAX_SOURCE_IMAGE_BYTES / (1024 * 1024)} MB or less.`
      );
      event.target.value = '';
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
      id: `${file.name}-${file.lastModified}-${file.size}-${Date.now()}`,
      previewUrl: URL.createObjectURL(file),
      status: PendingImageStatus.PENDING,
      error: null,
      publicUrl: null,
      objectKey: null,
      optimizedFile: null, // Store optimized file here for retries
    }));

    if (files.length > availableSlots) {
      setUploadError(`Only ${availableSlots} more image(s) can be added.`);
    } else {
      setUploadError('');
    }

    setPendingFiles((current) => {
      const newPendingFiles = [...current, ...nextFiles];
      setUploadProgress({ current: 0, total: newPendingFiles.length });
      return newPendingFiles;
    });
    event.target.value = '';
    
    // Trigger queue processing
    setTimeout(() => {
      processQueue();
    }, 0);
  };

  const processSingleImage = async (imageId) => {
    const getItem = () => pendingFilesRef.current.find(f => f.id === imageId);
    let item = getItem();
    if (!item) return;

    try {
      // Step 1: Optimize
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? { ...f, status: PendingImageStatus.OPTIMIZING } : f));
      }
      
      let optimizedFile = item.optimizedFile;
      if (!optimizedFile) {
        const optimizationResult = await optimizeImage(item.file);
        optimizedFile = optimizationResult.file;
        if (isMountedRef.current) {
          setPendingFiles((prev) => prev.map(f => f.id === imageId ? { ...f, optimizedFile } : f));
        }
      }

      // Step 2: Get presigned URL
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? { ...f, status: PendingImageStatus.REQUESTING_URL } : f));
      }
      const presignResponse = await uploadApi.getProductImagePresignedUrl(optimizedFile.name, optimizedFile.size);
      const { presignedUrl, publicUrl, objectKey } = presignResponse.data;

      // Step 3: Upload to R2
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? { ...f, status: PendingImageStatus.UPLOADING } : f));
      }
      const putResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: optimizedFile,
        headers: {
          'Content-Type': 'image/webp',
        },
      });

      if (!putResponse.ok) {
        throw new Error(`R2 PUT failed: ${putResponse.status} ${putResponse.statusText}`);
      }

      // Step 4: Verify upload
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? { ...f, status: PendingImageStatus.VERIFYING } : f));
      }
      
      const verifyResponse = await uploadApi.verifyProductImageUpload(objectKey, optimizedFile.size);

      // Step 5: Success
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? {
          ...f,
          status: PendingImageStatus.SUCCESS,
          publicUrl,
          objectKey,
          optimizedFile: null,
          progress: 100,
          error: null
        } : f));
      }
    } catch (err) {
      if (isMountedRef.current) {
        setPendingFiles((prev) => prev.map(f => f.id === imageId ? {
          ...f,
          status: PendingImageStatus.ERROR,
          error: err.message || 'Upload failed'
        } : f));
      }
    }
  };

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      while (isMountedRef.current) {
        const pendingItem = pendingFilesRef.current.find(
          item => item.status === PendingImageStatus.PENDING
        );
        if (!pendingItem) break;
        
        await processSingleImage(pendingItem.id);
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleRetryPendingFile = async (imageId) => {
    // Reset the status to pending
    setPendingFiles((current) => 
      current.map((item) => 
        item.id === imageId ? { ...item, status: PendingImageStatus.PENDING, error: null } : item
      )
    );
    
    // Wait a tick for state update, then start processing
    setTimeout(() => {
      processQueue();
    }, 0);
  };

  const handleRemoveUploadedImage = (index) => {
    setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setUploadError('');
  };

  const handleRemovePendingFile = (imageId) => {
    setPendingFiles((current) => {
      const removed = current.find(f => f.id === imageId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter(f => f.id !== imageId);
    });
    setUploadError('');
  };

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (pendingVideoFile?.previewUrl) {
      URL.revokeObjectURL(pendingVideoFile.previewUrl);
    }

    setPendingVideoFile({
      file,
      previewUrl: file.type.startsWith('video/') ? URL.createObjectURL(file) : '',
    });
    setUploadError('');
  };

  const handleSizeChartChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (pendingSizeChartFile?.previewUrl) {
      URL.revokeObjectURL(pendingSizeChartFile.previewUrl);
    }

    setPendingSizeChartFile({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setSizeChartEnabled(true);
    setUploadError('');
  };

  const updateVariationGroupName = (index, name) => {
    setVariationGroups((current) => {
      const next = current.map((group, groupIndex) =>
        groupIndex === index ? { ...group, name } : group
      );
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const updateVariationOption = (groupIndex, optionIndex, value) => {
    setVariationGroups((current) => {
      const next = current.map((group, index) => {
        if (index !== groupIndex) return group;
        const options = [...group.options];
        options[optionIndex] = value;
        return { ...group, options };
      });
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const addVariationOption = (groupIndex) => {
    setVariationGroups((current) => {
      const next = current.map((group, index) =>
        index === groupIndex ? { ...group, options: [...group.options, ''] } : group
      );
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const removeVariationOption = (groupIndex, optionIndex) => {
    setVariationGroups((current) => {
      const next = current.map((group, index) => {
        if (index !== groupIndex) return group;
        return { ...group, options: group.options.filter((_, idx) => idx !== optionIndex) };
      });
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const addVariationGroup = () => {
    setVariationGroups((current) => {
      const next = [...current, { name: '', options: [''] }];
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const removeVariationGroup = (groupIndex) => {
    setVariationGroups((current) => {
      const next = current.filter((_, index) => index !== groupIndex);
      if (addVariations) {
        setVariants((currentVariants) => buildSyncedVariants(next, currentVariants));
      }
      return next;
    });
  };

  const updateVariantField = (index, field, value) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const applyBatchVariantValues = () => {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        stock: batchStock !== '' ? Number(batchStock) : variant.stock,
        price: batchPrice !== '' ? Number(batchPrice) : variant.price,
      }))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const allPendingFilesSuccess = pendingFiles.every(pf => pf.status === PendingImageStatus.SUCCESS);
    if (!allPendingFilesSuccess) {
      setUploadError('Please wait for all images to upload successfully or resolve any errors before saving.');
      return;
    }

    // Check min images
    const totalImages = imageUrls.length + pendingFiles.length + parseCommaList(manualImageUrls).length;
    if (totalImages < MIN_PRODUCT_IMAGES) {
      setUploadError(`At least ${MIN_PRODUCT_IMAGES} product images are required`);
      return;
    }

    setSaving(true);
    setError('');
    setUploadError('');

    try {
      // Now proceed to upload other media (video, size chart) and save product
      let nextImageUrls = [...imageUrls];
      let nextVideoUrl = videoUrl;
      let nextSizeChartUrl = sizeChartUrl;

      // Add successfully uploaded pending files
      nextImageUrls = [
        ...nextImageUrls,
        ...pendingFiles.filter(pf => pf.status === PendingImageStatus.SUCCESS).map(pf => pf.publicUrl || pf.url)
      ];

      if (pendingVideoFile?.file) {
        const response = await uploadApi.uploadProductVideo(pendingVideoFile.file);
        nextVideoUrl = response.data?.url || nextVideoUrl;
      }

      if (pendingSizeChartFile?.file) {
        const response = await uploadApi.uploadSizeChartImage(pendingSizeChartFile.file);
        nextSizeChartUrl = response.data?.url || nextSizeChartUrl;
      }

      const manualUrls = parseCommaList(manualImageUrls);
      nextImageUrls = [...nextImageUrls, ...manualUrls].slice(0, MAX_PRODUCT_IMAGES);

      // Check min images again (after adding manual URLs)
      if (nextImageUrls.length < MIN_PRODUCT_IMAGES && form.status === 'active') {
        throw new Error(`At least ${MIN_PRODUCT_IMAGES} product images are required for active products`);
      }

      const legacyFields = addVariations
        ? deriveLegacyFieldsFromVariations(variationGroups)
        : {
            ringSizes: showRingSizes ? parseCommaList(form.ringSizes) : [],
            metalColors: parseCommaList(form.metalColors),
          };

      const payload = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
        category: form.category,
        brand: form.brand.trim() || undefined,
        images: nextImageUrls,
        video: nextVideoUrl || undefined,
        price: Number(form.price),
        oldPrice: form.oldPrice !== '' ? Number(form.oldPrice) : undefined,
        sku: form.sku.trim(),
        stock: Number(form.stock) || 0,
        ringSizes: legacyFields.ringSizes,
        metalColors: legacyFields.metalColors,
        material: form.material.trim() || undefined,
        tags: parseCommaList(form.tags),
        isFeatured: form.isFeatured,
        isTrending: form.isTrending,
        isNewArrival: form.isNewArrival,
        isCustomizable: form.isCustomizable,
        customizationOptions: form.isCustomizable
          ? mergeCustomizationOptions(form.customizationOptions)
          : getDefaultCustomizationOptions(),
        status: form.status,
        variationGroups: addVariations
          ? variationGroups
              .filter((group) => group.name.trim())
              .map((group) => ({
                name: group.name.trim(),
                options: group.options.map((option) => option.trim()).filter(Boolean),
              }))
              .filter((group) => group.options.length > 0)
          : [],
        variants: addVariations
          ? variants.map((variant) => ({
              attributes: variant.attributes,
              stock: Number(variant.stock) || 0,
              price: variant.price !== '' && variant.price != null ? Number(variant.price) : undefined,
              sku: variant.sku?.trim() || undefined,
              image: variant.image?.trim() || undefined,
            }))
          : [],
        sizeChart: {
          enabled: sizeChartEnabled && Boolean(nextSizeChartUrl),
          imageUrl: sizeChartEnabled ? nextSizeChartUrl : '',
        },
      };

      if (form.slug.trim()) {
        payload.slug = form.slug.trim();
      }

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
      setUploadProgress({ current: 0, total: 0 });
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
      <div className="products-page product-form-page">
        {error && <div className="alert-banner alert-error">{error}</div>}
        {uploadError && <div className="alert-banner alert-error">{uploadError}</div>}

        <form className="product-seller-form" onSubmit={handleSubmit}>
          <div className="product-form-toolbar">
            <div>
              <p className="product-form-toolbar-label">{isEditing ? 'Edit product' : 'New product'}</p>
              <h2 className="product-form-toolbar-title">{form.title || 'Untitled product'}</h2>
            </div>
            <div className="product-form-toolbar-actions">
              <Link to="/products" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  saving || 
                  categories.length === 0 || 
                  totalSelectedImages < MIN_PRODUCT_IMAGES ||
                  isProcessing
                }
              >
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Create Product'}
              </button>
            </div>
          </div>

          <div className="product-form-layout">
            <aside className="product-form-preview">
              <div className="product-form-section">
                <h3 className="product-form-section-title">Preview</h3>
                <div className="product-preview-card">
                  {previewImage ? (
                    <img src={previewImage} alt="Product preview" className="product-preview-image" />
                  ) : (
                    <div className="product-preview-placeholder">Main image preview</div>
                  )}
                  <p className="product-preview-name">{form.title || 'Product name'}</p>
                  <p className="product-preview-price">
                    {form.price !== '' ? `Rs ${Number(form.price).toLocaleString()}` : 'Rs 0'}
                  </p>
                  {addVariations && variationGroups[0]?.options?.length > 0 && (
                    <div className="product-preview-variations">
                      <span className="product-preview-variation-label">
                        {variationGroups[0].name || 'Variation'}
                      </span>
                      <div className="product-preview-variation-options">
                        {variationGroups[0].options.filter(Boolean).slice(0, 4).map((option) => (
                          <span key={option} className="product-preview-chip">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="product-form-main">
              <section className="product-form-section">
                <h3 className="product-form-section-title">Product Media</h3>
                <p className="product-form-section-hint">
                  Upload at least {MIN_PRODUCT_IMAGES} (max {MAX_PRODUCT_IMAGES}) images and one optional product video.
                </p>

                <input
                  ref={imageInputRef}
                  id="productImages"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className="image-upload-input-hidden"
                  onChange={handleImageFilesChange}
                  disabled={
                    saving || 
                    totalSelectedImages >= MAX_PRODUCT_IMAGES ||
                    isProcessing
                  }
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                  className="image-upload-input-hidden"
                  onChange={handleVideoChange}
                  disabled={
                    saving || 
                    isProcessing
                  }
                />

                <div className="product-media-grid">
                  <button
                    type="button"
                    className={`product-media-slot product-media-slot-main ${previewImage ? 'product-media-slot-filled' : ''}`}
                    onClick={() => imageInputRef.current?.click()}
                    disabled={remainingImageSlots <= 0 || saving || isProcessing}
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Main" />
                    ) : (
                      <>
                        <span className="product-media-slot-label">Main Image</span>
                        <span className="product-media-slot-action">Upload</span>
                      </>
                    )}
                  </button>

                  {Array.from({ length: Math.min(remainingImageSlots > 0 ? 3 : 0, 3) }).map((_, index) => (
                    <button
                      key={`empty-slot-${index}`}
                      type="button"
                      className="product-media-slot"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={saving}
                    >
                      <span className="product-media-slot-action">Upload image</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`product-media-slot product-media-slot-video ${videoUrl || pendingVideoFile ? 'product-media-slot-filled' : ''}`}
                    onClick={() => videoInputRef.current?.click()}
                    disabled={saving}
                  >
                    {pendingVideoFile?.previewUrl ? (
                      <video src={pendingVideoFile.previewUrl} muted playsInline />
                    ) : videoUrl ? (
                      <video src={videoUrl} muted playsInline />
                    ) : (
                      <>
                        <span className="product-media-slot-label">Video</span>
                        <span className="product-media-slot-action">Upload</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="image-upload-header">
                  <span className={`image-upload-count ${totalSelectedImages < MIN_PRODUCT_IMAGES ? 'text-red-600' : ''}`}>
                    {totalSelectedImages} / {MAX_PRODUCT_IMAGES} images selected (minimum {MIN_PRODUCT_IMAGES} required)
                  </span>
                  {remainingImageSlots > 0 && (
                    <button
                      type="button"
                      className="btn-secondary image-upload-browse-btn"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={saving}
                    >
                      Add Images
                    </button>
                  )}
                </div>

                {(imageUrls.length > 0 || pendingFiles.length > 0) && (
                  <div className="image-preview-grid">
                    {/* Combine both arrays with metadata so they can be reordered together */}
                    {[
                      ...imageUrls.map((url, index) => ({
                        id: `uploaded-${index}`,
                        type: 'uploaded',
                        url,
                        index,
                      })),
                      ...pendingFiles.map((item, index) => ({
                        id: item.id || `pending-${index}`,
                        type: 'pending',
                        item,
                        index,
                      })),
                    ].map((media, displayIndex, allItems) => {
                      const handleDragStart = (e) => {
                        e.dataTransfer.setData('text/plain', displayIndex.toString());
                        e.currentTarget.classList.add('dragging');
                      };

                      const handleDragEnd = (e) => {
                        e.currentTarget.classList.remove('dragging');
                      };

                      const handleDragOver = (e) => {
                        e.preventDefault();
                      };

                      const handleDrop = (e) => {
                        e.preventDefault();
                        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(sourceIndex) || sourceIndex === displayIndex) return;

                        // Create a copy of the unified list
                        const reordered = [...allItems];
                        // Remove the item from source
                        const [movedItem] = reordered.splice(sourceIndex, 1);
                        // Insert the item at destination
                        reordered.splice(displayIndex, 0, movedItem);

                        // Separate back into original state arrays
                        const nextImageUrls = [];
                        const nextPendingFiles = [];

                        reordered.forEach((x) => {
                          if (x.type === 'uploaded') {
                            nextImageUrls.push(x.url);
                          } else {
                            nextPendingFiles.push(x.item);
                          }
                        });

                        setImageUrls(nextImageUrls);
                        setPendingFiles(nextPendingFiles);
                      };

                      if (media.type === 'uploaded') {
                        return (
                          <div
                            key={media.id}
                            className="image-preview-card"
                            draggable
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            style={{ cursor: 'move' }}
                          >
                            <img src={media.url} alt={`Product ${media.index + 1}`} className="image-preview" />
                            <span className="image-preview-badge">Uploaded</span>
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
                              onClick={() => handleRemoveUploadedImage(media.index)}
                              disabled={saving || isProcessing}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      } else {
                        const { item } = media;
                        return (
                          <div
                            key={media.id}
                            className={`image-preview-card ${
                              item.status === PendingImageStatus.OPTIMIZING ||
                              item.status === PendingImageStatus.REQUESTING_URL ||
                              item.status === PendingImageStatus.UPLOADING ||
                              item.status === PendingImageStatus.VERIFYING
                                ? 'image-preview-pending'
                                : item.status === PendingImageStatus.ERROR
                                ? 'image-preview-error'
                                : item.status === PendingImageStatus.SUCCESS
                                ? 'image-preview-success'
                                : ''
                            }`}
                            draggable
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            style={{ cursor: 'move' }}
                          >
                            <img src={item.previewUrl} alt={item.file.name} className="image-preview" />
                            <span className="image-preview-label">
                              {(() => {
                                switch (item.status) {
                                  case PendingImageStatus.PENDING: return "PENDING...";
                                  case PendingImageStatus.OPTIMIZING: return "OPTIMIZING...";
                                  case PendingImageStatus.REQUESTING_URL: return "REQUESTING URL...";
                                  case PendingImageStatus.UPLOADING: return "UPLOADING...";
                                  case PendingImageStatus.VERIFYING: return "VERIFYING...";
                                  case PendingImageStatus.SUCCESS: return "UPLOADED";
                                  case PendingImageStatus.ERROR: return "FAILED";
                                  default: return "UNKNOWN STATUS";
                                }
                              })()}
                            </span>
                            {item.status === PendingImageStatus.ERROR && (
                              <span className="text-xs text-red-500 mt-1">{item.error}</span>
                            )}
                            <div className="flex gap-2 mt-2">
                              {item.status === PendingImageStatus.ERROR && (
                                <button
                                  type="button"
                                  className="btn-text btn-text-primary"
                                  onClick={() => handleRetryPendingFile(item.id)}
                                  disabled={saving || isProcessing}
                                >
                                  Retry
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-text btn-text-danger"
                                onClick={() => handleRemovePendingFile(item.id)}
                                disabled={saving || isProcessing}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Upload progress indicator */}
                {uploadProgress.total > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Uploading {uploadProgress.current} of {uploadProgress.total} images...
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

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
                    disabled={saving}
                    placeholder="Comma-separated image URLs"
                  />
                </div>
              </section>

              <section className="product-form-section">
                <h3 className="product-form-section-title">Product Information</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-field-full">
                    <label htmlFor="title">Product Name *</label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={form.title}
                      onChange={handleChange}
                      required
                      disabled={saving}
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
                      disabled={saving || categories.length === 0}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="brand">Brand</label>
                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      value={form.brand}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="No brand"
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
                      disabled={saving}
                      placeholder="Auto-generated from title if empty"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="admin-form-field admin-form-field-full">
                    <label htmlFor="shortDescription">Short Description</label>
                    <input
                      id="shortDescription"
                      name="shortDescription"
                      type="text"
                      value={form.shortDescription}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-field admin-form-field-full">
                    <label htmlFor="description">Product Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      disabled={saving}
                      rows={6}
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
                      disabled={saving}
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
                      disabled={saving}
                      placeholder="ring, diamond, wedding"
                    />
                  </div>
                </div>
              </section>

              <section className="product-form-section">
                <h3 className="product-form-section-title">Sales Information</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label htmlFor="price">Retail Price *</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="oldPrice">Compare-at Price</label>
                    <input
                      id="oldPrice"
                      name="oldPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.oldPrice}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="sku">Seller SKU *</label>
                    <input
                      id="sku"
                      name="sku"
                      type="text"
                      value={form.sku}
                      onChange={handleChange}
                      required
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="product-checkbox-group">
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    Featured (Bundles)
                  </label>
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      name="isTrending"
                      checked={form.isTrending}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    Trending
                  </label>
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={form.isNewArrival}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    New Arrival
                  </label>
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      name="isCustomizable"
                      checked={form.isCustomizable}
                      onChange={handleChange}
                      disabled={saving}
                    />
                    Customizable Product
                  </label>
                </div>
              </section>

              <section className="product-form-section">
                <div className="product-form-section-header">
                  <div>
                    <h3 className="product-form-section-title">Variations</h3>
                    <p className="product-form-section-hint">
                      Add color, ring size, or other variation groups and manage stock per combination.
                    </p>
                  </div>
                  <label className="product-toggle">
                    <input
                      type="checkbox"
                      checked={addVariations}
                      onChange={(event) => {
                        const enabled = event.target.checked;
                        setAddVariations(enabled);
                        if (enabled) {
                          setVariants((currentVariants) =>
                            buildSyncedVariants(variationGroups, currentVariants)
                          );
                        }
                      }}
                      disabled={saving}
                    />
                    <span>Add variations</span>
                  </label>
                </div>

                {addVariations ? (
                  <>
                    {variationGroups.map((group, groupIndex) => (
                      <div key={`variation-group-${groupIndex}`} className="variation-group-card">
                        <div className="variation-group-header">
                          <div className="admin-form-field">
                            <label>Variation Name</label>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(event) => updateVariationGroupName(groupIndex, event.target.value)}
                              placeholder="Color, Ring Size..."
                              disabled={saving || isProcessing}
                            />
                          </div>
                          {variationGroups.length > 1 && (
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
                              onClick={() => removeVariationGroup(groupIndex)}
                              disabled={saving || isProcessing}
                            >
                              Remove group
                            </button>
                          )}
                        </div>

                        <div className="variation-options-list">
                          {group.options.map((option, optionIndex) => (
                            <div key={`option-${groupIndex}-${optionIndex}`} className="variation-option-row">
                              <input
                                type="text"
                                value={option}
                                onChange={(event) =>
                                  updateVariationOption(groupIndex, optionIndex, event.target.value)
                                }
                                placeholder="Option value"
                                disabled={saving || isProcessing}
                              />
                              <button
                                type="button"
                                className="btn-text btn-text-danger"
                                onClick={() => removeVariationOption(groupIndex, optionIndex)}
                                disabled={saving || isProcessing}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn-text"
                            onClick={() => addVariationOption(groupIndex)}
                            disabled={saving || isProcessing}
                          >
                            + Add option
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-secondary variation-add-group-btn"
                      onClick={addVariationGroup}
                      disabled={saving}
                    >
                      + Add variation
                    </button>

                    {variants.length > 0 && (
                      <div className="variation-table-wrap">
                        <div className="variation-batch-row">
                          <input
                            type="number"
                            min="0"
                            placeholder="Batch stock"
                            value={batchStock}
                            onChange={(event) => setBatchStock(event.target.value)}
                            disabled={saving || isProcessing}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Batch price"
                            value={batchPrice}
                            onChange={(event) => setBatchPrice(event.target.value)}
                            disabled={saving || isProcessing}
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={applyBatchVariantValues}
                            disabled={saving || isProcessing}
                          >
                            Apply
                          </button>
                        </div>

                        <table className="variation-table">
                          <thead>
                            <tr>
                              {variationGroups.map((group) => (
                                <th key={group.name}>{group.name || 'Variation'}</th>
                              ))}
                              <th>Stock</th>
                              <th>Retail Price</th>
                              <th>Seller SKU</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variants.map((variant, index) => (
                              <tr key={JSON.stringify(variant.attributes)}>
                                {variationGroups.map((group) => (
                                  <td key={`${group.name}-${index}`}>
                                    {variant.attributes?.[group.name] || '—'}
                                  </td>
                                ))}
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.stock}
                                    onChange={(event) =>
                                      updateVariantField(index, 'stock', event.target.value)
                                    }
                                    disabled={saving || isProcessing}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(event) =>
                                      updateVariantField(index, 'price', event.target.value)
                                    }
                                    disabled={saving || isProcessing}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={variant.sku || ''}
                                    onChange={(event) =>
                                      updateVariantField(index, 'sku', event.target.value)
                                    }
                                    disabled={saving || isProcessing}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="admin-form-grid">
                    {showRingSizes && (
                      <div className="admin-form-field">
                        <label htmlFor="ringSizes">Ring Sizes</label>
                        <input
                          id="ringSizes"
                          name="ringSizes"
                          type="text"
                          value={form.ringSizes}
                          onChange={handleChange}
                          disabled={saving || isProcessing}
                          placeholder="6, 7, 8"
                        />
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
                        disabled={saving}
                        placeholder="gold, rose-gold, silver"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="product-form-section">
                <div className="product-form-section-header">
                  <div>
                    <h3 className="product-form-section-title">Size Chart</h3>
                    <p className="product-form-section-hint">
                      Upload a size chart image to display on the product page.
                    </p>
                  </div>
                  <label className="product-toggle">
                    <input
                      type="checkbox"
                      checked={sizeChartEnabled}
                      onChange={(event) => setSizeChartEnabled(event.target.checked)}
                      disabled={saving}
                    />
                    <span>Enable size chart</span>
                  </label>
                </div>

                {sizeChartEnabled && (
                  <>
                    <input
                      ref={sizeChartInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="image-upload-input-hidden"
                      onChange={handleSizeChartChange}
                      disabled={saving}
                    />
                    <div className="size-chart-upload-row">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => sizeChartInputRef.current?.click()}
                        disabled={saving}
                      >
                        Upload size chart image
                      </button>
                      {(sizeChartUrl || pendingSizeChartFile?.previewUrl) && (
                        <img
                          src={pendingSizeChartFile?.previewUrl || sizeChartUrl}
                          alt="Size chart preview"
                          className="size-chart-preview"
                        />
                      )}
                    </div>
                  </>
                )}
              </section>

              {form.isCustomizable && (
                <section className="product-form-section">
                  <CustomizationOptionsSection
                    options={form.customizationOptions}
                    onChange={(nextOptions) =>
                      setForm((prev) => ({ ...prev, customizationOptions: nextOptions }))
                    }
                    disabled={saving}
                  />
                </section>
              )}
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
