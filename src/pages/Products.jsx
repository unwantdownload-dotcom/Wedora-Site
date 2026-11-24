import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Spinner } from '../components/common/Spinner';
import { formatCurrency } from '../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  Tag
} from 'lucide-react';

const CATEGORIES = [
  'Custom Wrappers',
  'Luxury Boxes',
  'Custom Bars',
  'Wedding Favors',
  'Hampers',
  'Bouquets',
  'Specialty',
  'Health & Keto'
];

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [size, setSize] = useState('Standard');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [bulkCleanDialogOpen, setBulkCleanDialogOpen] = useState(false);
  const [cleaningBulk, setCleaningBulk] = useState(false);

  const { refreshTrigger, refreshData } = useData();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAll();
        setProducts(data);
      } catch (err) {
        showToast(err.message || 'Failed to load products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refreshTrigger]);

  const inactiveCount = useMemo(() => {
    return products.filter(p => !p.is_active).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setProductCode('');
    setCategory(CATEGORIES[0]);
    setSize('Standard');
    setDescription('');
    setUnitPrice('');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setProductCode(prod.product_code || '');
    setCategory(prod.category || CATEGORIES[0]);
    setSize(prod.size || 'Standard');
    setDescription(prod.description || '');
    setUnitPrice(String(prod.unit_price || ''));
    setIsActive(prod.is_active !== undefined ? prod.is_active : true);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name.trim() || !unitPrice) {
      showToast('Please enter chocolate name and price', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        product_code: productCode.trim() || undefined,
        category,
        size: size.trim(),
        description: description.trim(),
        unit_price: parseFloat(unitPrice) || 0,
        is_active: isActive
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await productService.create(payload);
        showToast('Product created successfully', 'success');
      }

      setModalOpen(false);
      refreshData();
    } catch (err) {
      showToast('Failed to save product: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (prod) => {
    try {
      await productService.toggleStatus(prod.id);
      showToast(`Product "${prod.name}" is now ${prod.is_active ? 'Inactive' : 'Active'}`, 'success');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to change product status', 'error');
    }
  };

  const handleOpenDelete = (prod) => {
    setProductToDelete(prod);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await productService.delete(productToDelete.id);
      showToast(`Removed "${productToDelete.name}" from catalog`, 'success');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      refreshData();
    } catch (err) {
      showToast('Failed to remove product: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmCleanInactive = async () => {
    setCleaningBulk(true);
    try {
      const inactiveIds = products.filter(p => !p.is_active).map(p => p.id);
      await productService.deleteMany(inactiveIds);
      showToast(`Removed ${inactiveIds.length} inactive items from catalog`, 'success');
      setBulkCleanDialogOpen(false);
      refreshData();
    } catch (err) {
      showToast('Failed to clean items: ' + err.message, 'error');
    } finally {
      setCleaningBulk(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-action-bar">
        <div className="search-filter-row">
          <div className="input-icon-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search chocolates by name, code, description..."
              className="form-input input-with-icon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {isAdmin && inactiveCount > 0 && (
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={() => setBulkCleanDialogOpen(true)}
              style={{ color: '#DC2626', borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}
            >
              Remove Inactive Items ({inactiveCount})
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="gold"
              icon={Plus}
              onClick={handleOpenAddModal}
            >
              Add Chocolate Item
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading chocolate catalog..." />
      ) : filteredProducts.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Package size={24} />
          </div>
          <h4 className="empty-state-title">No products found</h4>
          <p style={{ maxWidth: 400, marginBottom: '1.25rem' }}>
            No products matched your search or category filter.
          </p>
          {isAdmin && (
            <Button variant="gold" icon={Plus} onClick={handleOpenAddModal}>
              Add First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Code</th>
                <th>Chocolate Item</th>
                <th>Category</th>
                <th>Size / Portion</th>
                <th style={{ textAlign: 'right' }}>Standard Price</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => (
                <tr key={prod.id}>
                  <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                    <span style={{
                      backgroundColor: 'var(--gold-100)',
                      color: 'var(--gold-600)',
                      padding: '0.2rem 0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--gold-200)',
                      fontSize: '0.85rem'
                    }}>
                      {prod.product_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                      {prod.name}
                    </div>
                    {prod.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', maxWidth: 420 }}>
                        {prod.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-navy">{prod.category}</span>
                  </td>
                  <td>{prod.size}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--navy-900)' }}>
                    {formatCurrency(prod.unit_price)}
                  </td>
                  <td>
                    {prod.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Product & Price"
                          onClick={() => handleOpenEditModal(prod)}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          className={`btn ${prod.is_active ? 'btn-secondary' : 'btn-secondary'} btn-icon`}
                          title={prod.is_active ? 'Deactivate Product' : 'Activate Product'}
                          onClick={() => handleToggleStatus(prod)}
                        >
                          {prod.is_active ? <XCircle size={14} color="#F59E0B" /> : <CheckCircle size={14} color="#059669" />}
                        </button>

                        <button
                          className="btn btn-icon"
                          title="Remove / Delete Item from Catalog"
                          onClick={() => handleOpenDelete(prod)}
                          style={{
                            color: '#DC2626',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.product_code}` : 'Add New Chocolate Product'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveProduct} loading={saving}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct}>
          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Order Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. A, A1, C1, D1"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Product / Chocolate Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Custom Chocolate Bar - Code A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dimensions / Size / Weight</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 12.5 cm × 5.5 cm (12g)"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Standard Price (LKR) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="85.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Active (Available in Orders)</option>
                <option value="false">Inactive / Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Ideal Occasions</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Ideal for Wedding Favors, Birthdays, Corporate Gifts. Min order: 50 pcs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Single Product Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Item from Catalog?"
        message={`Are you sure you want to remove "${productToDelete?.name}" (${productToDelete?.product_code}) from the chocolate catalog? This action will permanently delete this item.`}
        confirmText="Yes, Remove Item"
        variant="danger"
        loading={deleting}
      />

      {/* Bulk Delete Inactive Products Dialog */}
      <ConfirmDialog
        isOpen={bulkCleanDialogOpen}
        onClose={() => setBulkCleanDialogOpen(false)}
        onConfirm={handleConfirmCleanInactive}
        title="Remove All Inactive Items?"
        message={`This will permanently remove all ${inactiveCount} inactive sample items from your chocolate catalog, leaving only your active products (Codes A, A1, C1, D1).`}
        confirmText={`Delete ${inactiveCount} Inactive Items`}
        variant="danger"
        loading={cleaningBulk}
      />
    </div>
  );
};
