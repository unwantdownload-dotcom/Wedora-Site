import React, { useState, useEffect, useMemo } from 'react';
import { expenseService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Spinner } from '../components/common/Spinner';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import {
  Receipt,
  Plus,
  Search,
  TrendingDown,
  Calendar,
  Tag,
  CreditCard,
  Edit,
  Trash2,
  Download,
  Building
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  'Ingredients & Raw Materials',
  'Packaging & Foils',
  'Delivery & Logistics',
  'Utilities & Rent',
  'Equipment & Tools',
  'Marketing & Printing',
  'Labor & Wages',
  'Other'
];

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Online Payment'];

export const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { refreshTrigger, refreshData } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const data = await expenseService.getAll();
        setExpenses(data);
      } catch (err) {
        showToast('Failed to load expenses', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [refreshTrigger]);

  // Financial Summaries
  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthTotal = expenses
      .filter(e => (e.expense_date || '').startsWith(currentYearMonth))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Top Category
    const catMap = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
    });
    let topCat = 'N/A';
    let topCatAmount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCatAmount) {
        topCat = cat;
        topCatAmount = amt;
      }
    });

    return {
      total,
      thisMonthTotal,
      topCat,
      topCatAmount,
      count: expenses.length
    };
  }, [expenses]);

  // Filtered & Sorted List
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const searchLower = searchTerm.toLowerCase();
        const matchSearch =
          e.title?.toLowerCase().includes(searchLower) ||
          e.expense_number?.toLowerCase().includes(searchLower) ||
          e.vendor?.toLowerCase().includes(searchLower) ||
          e.reference_number?.toLowerCase().includes(searchLower);

        const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
        const matchMethod = methodFilter === 'All' || e.payment_method === methodFilter;

        return matchSearch && matchCat && matchMethod;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.expense_date || b.created_at) - new Date(a.expense_date || a.created_at);
        if (sortBy === 'oldest') return new Date(a.expense_date || a.created_at) - new Date(b.expense_date || b.created_at);
        if (sortBy === 'highest') return Number(b.amount) - Number(a.amount);
        if (sortBy === 'lowest') return Number(a.amount) - Number(b.amount);
        return 0;
      });
  }, [expenses, searchTerm, categoryFilter, methodFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(PAYMENT_METHODS[0]);
    setReferenceNumber('');
    setVendor('');
    setNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setTitle(exp.title || '');
    setCategory(exp.category || EXPENSE_CATEGORIES[0]);
    setAmount(String(exp.amount || ''));
    setExpenseDate(exp.expense_date || new Date().toISOString().split('T')[0]);
    setPaymentMethod(exp.payment_method || PAYMENT_METHODS[0]);
    setReferenceNumber(exp.reference_number || '');
    setVendor(exp.vendor || '');
    setNotes(exp.notes || '');
    setModalOpen(true);
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an expense title / description', 'warning');
      return;
    }
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Please enter a valid expense amount in LKR', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        amount: parsedAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim(),
        vendor: vendor.trim(),
        notes: notes.trim()
      };

      if (editingExpense) {
        await expenseService.update(editingExpense.id, payload, user);
        showToast('Expense updated successfully', 'success');
      } else {
        await expenseService.create(payload, user);
        showToast('Expense recorded successfully', 'success');
      }

      setModalOpen(false);
      refreshData();
    } catch (err) {
      showToast('Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleOpenDelete = (exp) => {
    setExpenseToDelete(exp);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setDeleting(true);
    try {
      await expenseService.delete(expenseToDelete.id);
      showToast(`Expense ${expenseToDelete.expense_number} removed`, 'success');
      setDeleteDialogOpen(false);
      refreshData();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expense records to export', 'warning');
      return;
    }
    const headers = ['Expense #', 'Date', 'Title', 'Category', 'Amount (LKR)', 'Payment Method', 'Vendor', 'Reference', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.expense_number || '',
      e.expense_date || '',
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      Number(e.amount || 0).toFixed(2),
      e.payment_method || '',
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.reference_number || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Wedora_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expenses CSV downloaded', 'success');
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Ingredients & Raw Materials': return '#B45309';
      case 'Packaging & Foils': return '#D97706';
      case 'Delivery & Logistics': return '#2563EB';
      case 'Utilities & Rent': return '#4F46E5';
      case 'Equipment & Tools': return '#7C3AED';
      case 'Marketing & Printing': return '#EC4899';
      default: return '#64748B';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* 1. Header Metrics */}
      <div className="dashboard-grid" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          label="Total Operating Expenses"
          value={formatCurrency(metrics.total)}
          subtext="Lifetime operational spend"
          icon={TrendingDown}
          accent="rose"
          iconBg="var(--status-danger-bg)"
          iconColor="#EF4444"
        />
        <StatCard
          label="This Month's Expenses"
          value={formatCurrency(metrics.thisMonthTotal)}
          subtext="Current calendar month"
          icon={Calendar}
          accent="amber"
          iconBg="var(--status-warning-bg)"
          iconColor="#D97706"
        />
        <StatCard
          label="Top Expense Category"
          value={metrics.topCat}
          subtext={metrics.topCatAmount > 0 ? formatCurrency(metrics.topCatAmount) : 'No spend yet'}
          icon={Tag}
          accent="navy"
          iconBg="var(--navy-100)"
          iconColor="var(--navy-900)"
        />
        <StatCard
          label="Total Records"
          value={metrics.count}
          subtext="Bills & operational entries"
          icon={Receipt}
          accent="gold"
          iconBg="var(--gold-100)"
          iconColor="var(--gold-600)"
        />
      </div>

      {/* 2. Action Bar & Filters */}
      <div className="page-action-bar">
        <div className="search-filter-row">
          <div className="input-icon-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search by title, expense #, vendor, reference..."
              className="form-input input-with-icon"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="All">All Payment Modes</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest Date</option>
            <option value="oldest">Sort: Oldest Date</option>
            <option value="highest">Sort: Highest Amount</option>
            <option value="lowest">Sort: Lowest Amount</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="gold"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* 3. Expenses Ledger Table */}
      {loading ? (
        <Spinner text="Loading expenses ledger..." />
      ) : filteredExpenses.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Receipt size={24} />
          </div>
          <h4 className="empty-state-title">No expenses found</h4>
          <p style={{ maxWidth: 420, marginBottom: '1.25rem' }}>
            {searchTerm || categoryFilter !== 'All' || methodFilter !== 'All'
              ? 'No expense records matched your current filters. Try resetting search.'
              : 'There are no operational expenses recorded yet. Click "Record Expense" to add your chocolate ingredients, foils, or courier costs.'}
          </p>
          <Button variant="gold" icon={Plus} onClick={handleOpenCreate}>
            Record First Expense
          </Button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Expense #</th>
                <th>Date</th>
                <th>Description / Vendor</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Reference #</th>
                <th style={{ textAlign: 'right' }}>Amount (LKR)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    {exp.expense_number}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatDate(exp.expense_date)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{exp.title}</div>
                    {exp.vendor && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <Building size={11} />
                        <span>{exp.vendor}</span>
                      </div>
                    )}
                    {exp.notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                        {exp.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: `${getCategoryColor(exp.category)}18`,
                        color: getCategoryColor(exp.category),
                        border: `1px solid ${getCategoryColor(exp.category)}40`
                      }}
                    >
                      {exp.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <CreditCard size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{exp.payment_method}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: exp.reference_number ? 'var(--navy-800)' : 'var(--text-muted)' }}>
                      {exp.reference_number || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626', fontSize: '0.92rem' }}>
                    - {formatCurrency(exp.amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn-icon"
                        title="Edit Expense"
                        onClick={() => handleOpenEdit(exp)}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete Expense"
                        style={{ color: '#EF4444' }}
                        onClick={() => handleOpenDelete(exp)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Add / Edit Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? `Edit Expense (${editingExpense.expense_number})` : 'Record Operating Expense'}
        size="md"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label required">Description / Item Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Belgian Dark Chocolate Couverture 10kg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label required">Amount (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="Rs. 0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label required">Expense Date</label>
              <input
                type="date"
                className="form-input"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label required">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label required">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Vendor / Supplier Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ceylon Cocoa Imports Ltd"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Receipt / Cheque / Ref #</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BT-99182 / Bill #50"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Additional Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Notes on quantity, batches, or warranty..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="gold" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Record"
        message={`Are you sure you want to delete expense record "${expenseToDelete?.expense_number} - ${expenseToDelete?.title}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Expense'}
        variant="danger"
      />
    </div>
  );
};