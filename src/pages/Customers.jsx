import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, orderService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Spinner } from '../components/common/Spinner';
import { formatCurrency, formatPhoneNumber, getWhatsAppUrl } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import {
  Users,
  UserPlus,
  Search,
  MessageSquare,
  ShoppingBag,
  ExternalLink,
  Edit,
  Trash2,
  Phone,
  MapPin
} from 'lucide-react';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Customer State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { refreshTrigger, refreshData } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cList, oList] = await Promise.all([
          customerService.getAll(),
          orderService.getAll()
        ]);
        setCustomers(cList);
        setOrders(oList);
      } catch (err) {
        showToast(err.message || 'Failed to load customers', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  // Aggregate customer metrics: lifetime spending and outstanding balance
  const customerStatsMap = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!map[o.customer_id]) {
        map[o.customer_id] = { orderCount: 0, totalSpend: 0, totalBalance: 0 };
      }
      if (o.status !== 'Cancelled') {
        map[o.customer_id].orderCount += 1;
        map[o.customer_id].totalSpend += Number(o.total_amount || 0);
        map[o.customer_id].totalBalance += Number(o.balance_due || 0);
      }
    });
    return map;
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.full_name?.toLowerCase().includes(term) ||
      c.customer_code?.toLowerCase().includes(term) ||
      c.phone?.includes(searchTerm) ||
      c.whatsapp?.includes(searchTerm) ||
      c.address?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFullName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cust, e) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    setFullName(cust.full_name);
    setPhone(cust.phone);
    setWhatsapp(cust.whatsapp || '');
    setAddress(cust.address || '');
    setNotes(cust.notes || '');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!fullName || !phone) {
      showToast('Name and phone number are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      // Check phone duplicate
      const duplicateExists = await customerService.checkPhoneExists(phone, editingCustomer?.id);
      if (duplicateExists) {
        if (!window.confirm(`A customer record with phone "${phone}" already exists. Proceed anyway?`)) {
          setSaving(false);
          return;
        }
      }

      const payload = {
        full_name: fullName,
        phone,
        whatsapp: whatsapp || phone,
        address,
        notes
      };

      if (editingCustomer) {
        await customerService.update(editingCustomer.id, payload);
        showToast('Customer record updated', 'success');
      } else {
        await customerService.create(payload, user?.id);
        showToast('New customer registered successfully', 'success');
      }

      setModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteConfirm = (cust, e) => {
    e.stopPropagation();
    setCustomerToDelete(cust);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await customerService.delete(customerToDelete.id);
      showToast(`Customer ${customerToDelete.full_name} (${customerToDelete.customer_code}) deleted`, 'success');
      setDeleteConfirmOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to delete customer record', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Top Action Row */}
      <div className="page-action-bar">
        <div className="search-filter-row">
          <div className="input-icon-wrapper" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search by customer name, code, phone, or address..."
              className="form-input input-with-icon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Button
          variant="gold"
          icon={UserPlus}
          onClick={handleOpenAddModal}
        >
          Add Customer
        </Button>
      </div>

      {loading ? (
        <Spinner text="Loading customer records..." />
      ) : filteredCustomers.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Users size={24} />
          </div>
          <h4 className="empty-state-title">No customers found</h4>
          <p style={{ maxWidth: 400, marginBottom: '1.25rem' }}>
            {searchTerm
              ? 'No matching customer records found for your search.'
              : 'Add your first chocolate client profile.'}
          </p>
          <Button variant="gold" icon={UserPlus} onClick={handleOpenAddModal}>
            Register Customer
          </Button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Client Name & Address</th>
                <th>Phone / WhatsApp</th>
                <th style={{ textAlign: 'center' }}>Total Orders</th>
                <th style={{ textAlign: 'right' }}>Lifetime Spend</th>
                <th style={{ textAlign: 'right' }}>Balance Due</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => {
                const stats = customerStatsMap[cust.id] || { orderCount: 0, totalSpend: 0, totalBalance: 0 };
                const waUrl = getWhatsAppUrl(cust.whatsapp || cust.phone);

                return (
                  <tr
                    key={cust.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--gold-600)' }}>
                      {cust.customer_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{cust.full_name}</div>
                      {cust.address && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: '0.15rem' }}>
                          <MapPin size={12} /> {cust.address}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatPhoneNumber(cust.phone)}</div>
                      {cust.whatsapp && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: '0.75rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: '0.15rem' }}
                        >
                          <MessageSquare size={12} /> WhatsApp
                        </a>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      <span className="badge badge-navy">{stats.orderCount}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {formatCurrency(stats.totalSpend)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: stats.totalBalance > 0 ? '#DC2626' : '#059669' }}>
                      {formatCurrency(stats.totalBalance)}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="View Customer Profile"
                          onClick={() => navigate(`/customers/${cust.id}`)}
                        >
                          <ExternalLink size={15} />
                        </button>

                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Customer"
                          onClick={(e) => handleOpenEditModal(cust, e)}
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          className="btn btn-gold btn-icon"
                          title="Create Order for this Customer"
                          onClick={() => navigate('/orders/new')}
                        >
                          <ShoppingBag size={15} />
                        </button>

                        <button
                          className="btn btn-secondary btn-icon"
                          title="Delete Customer"
                          style={{ color: '#EF4444' }}
                          onClick={(e) => handleOpenDeleteConfirm(cust, e)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.customer_code}` : 'Register New Customer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveCustomer} loading={saving}>
              {editingCustomer ? 'Update Record' : 'Create Record'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dilini Senanayake"
              required
            />
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +94 7X XXX XXXX"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input
                type="text"
                className="form-input"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +94 7X XXX XXXX"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <textarea
              className="form-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, Landmark (e.g. No 18/4, Alfred House Gardens, Colombo 03)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Preferences & Notes</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP client, prefers dark chocolate variants, gluten-free preference"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer Profile"
        message={
          customerToDelete
            ? `Are you sure you want to delete customer "${customerToDelete.full_name}" (${customerToDelete.customer_code})? This will permanently remove their profile.`
            : ''
        }
        confirmText={deleting ? 'Deleting...' : 'Delete Customer'}
        variant="danger"
      />
    </div>
  );
};
