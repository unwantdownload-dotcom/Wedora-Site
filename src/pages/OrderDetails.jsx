import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, paymentService, expenseService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { downloadInvoicePDF, printInvoicePDF, buildWhatsAppInvoiceMessage, shareInvoicePDFToWhatsApp } from '../services/invoiceService';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/Badge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PostalTrackingModal } from '../components/common/PostalTrackingModal';
import { Spinner } from '../components/common/Spinner';
import { formatCurrency, formatPhoneNumber, getWhatsAppUrl } from '../utils/formatters';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { copyTrackingAndOpenSlp } from '../utils/formatters';
import {
  FileText,
  Printer,
  CreditCard,
  Clock,
  MessageSquare,
  ArrowLeft,
  ShoppingBag,
  User,
  Truck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Edit,
  Plus,
  Send,
  Percent,
  Receipt,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const STATUS_STAGES = ['New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'];

export const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  // Financial Values Edit Modal
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editTotalPaid, setEditTotalPaid] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editAdditionalCharges, setEditAdditionalCharges] = useState('');
  const [savingFinancials, setSavingFinancials] = useState(false);

  // Delivery & Order Dates Edit Modal
  const [datesModalOpen, setDatesModalOpen] = useState(false);
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [savingDates, setSavingDates] = useState(false);

  // Tracking Modals
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('SL Post');
  const [savingTracking, setSavingTracking] = useState(false);
  const [slpPortalOpen, setSlpPortalOpen] = useState(false);

  // Delete Confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Advance Invoice & WhatsApp Modal
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advancePercent, setAdvancePercent] = useState('50');
  const [advanceCustomAmount, setAdvanceCustomAmount] = useState('');
  const [advanceBankDetails, setAdvanceBankDetails] = useState('');

  // Order-wise Expense Modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Ingredients & Raw Materials');
  const [expAmount, setExpAmount] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expMethod, setExpMethod] = useState('Cash');
  const [expNotes, setExpNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  const { refreshTrigger, refreshData, settings } = useData();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Handlers for quick financial & date edits
  const handleOpenFinancialModal = () => {
    setEditTotalAmount(String(order.total_amount || ''));
    setEditTotalPaid(String(order.total_paid || '0'));
    setEditDiscount(String(order.discount || '0'));
    setEditAdditionalCharges(String(order.additional_charges || '0'));
    setFinancialModalOpen(true);
  };

  const handleSaveFinancials = async (e) => {
    e.preventDefault();
    const parsedTotal = Number(editTotalAmount);
    const parsedPaid = Number(editTotalPaid);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      showToast('Please enter a valid total order amount in LKR', 'warning');
      return;
    }
    if (isNaN(parsedPaid) || parsedPaid < 0) {
      showToast('Please enter a valid amount paid in LKR', 'warning');
      return;
    }
    setSavingFinancials(true);
    try {
      await orderService.updateFinancials(order.id, {
        total_amount: parsedTotal,
        total_paid: parsedPaid,
        discount: Number(editDiscount) || 0,
        additional_charges: Number(editAdditionalCharges) || 0
      }, user);
      showToast('Order financial values updated successfully', 'success');
      setFinancialModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update financial values', 'error');
    } finally {
      setSavingFinancials(false);
    }
  };

  const handleOpenDatesModal = () => {
    setEditOrderDate(order.order_date || '');
    setEditDeliveryDate(order.delivery_date || '');
    setDatesModalOpen(true);
  };

  const handleSaveDates = async (e) => {
    e.preventDefault();
    if (!editDeliveryDate) {
      showToast('Please select a required delivery date', 'warning');
      return;
    }
    setSavingDates(true);
    try {
      await orderService.updateDates(order.id, {
        order_date: editOrderDate,
        delivery_date: editDeliveryDate
      }, user);
      showToast('Order delivery date updated successfully', 'success');
      setDatesModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update dates', 'error');
    } finally {
      setSavingDates(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getById(id);
        if (!data) {
          showToast('Order not found', 'error');
          navigate('/orders');
          return;
        }
        setOrder(data);
        setSelectedStatus(data.status);
      } catch (err) {
        showToast(err.message || 'Error loading order details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, refreshTrigger]);

  if (loading || !order) {
    return <Spinner text="Loading order details..." />;
  }

  // Handle Status Update
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      await orderService.updateStatus(order.id, selectedStatus, statusNotes, user);
      showToast(`Order status updated to ${selectedStatus}`, 'success');
      setStatusModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  // Handle Payment Record
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    if (amount > Number(order.balance_due)) {
      if (!window.confirm(`Amount exceeds remaining balance of Rs. ${order.balance_due}. Continue?`)) {
        return;
      }
    }

    setSavingPay(true);
    try {
      await paymentService.create({
        order_id: order.id,
        amount,
        payment_method: payMethod,
        payment_reference: payRef,
        notes: payNotes || 'Payment recorded on order page'
      }, user);
      showToast(`Payment of ${formatCurrency(amount)} recorded!`, 'success');
      setPaymentModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSavingPay(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await orderService.delete(order.id);
      showToast(`Order ${order.order_number} deleted`, 'success');
      navigate('/orders');
    } catch (err) {
      showToast(err.message || 'Failed to delete order', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Handle Order-wise Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(expAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Please enter a valid expense amount', 'warning');
      return;
    }
    if (!expTitle.trim()) {
      showToast('Please enter an expense description', 'warning');
      return;
    }

    setSavingExpense(true);
    try {
      await expenseService.create({
        order_id: order.id,
        title: expTitle.trim(),
        category: expCategory,
        amount: parsedAmount,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: expMethod,
        vendor: expVendor.trim(),
        notes: expNotes.trim() ? `[Order ${order.order_number}] - ${expNotes.trim()}` : `Allocated to Order ${order.order_number}`
      }, user);

      showToast(`Expense of ${formatCurrency(parsedAmount)} added to this order!`, 'success');
      setExpenseModalOpen(false);
      setExpTitle('');
      setExpAmount('');
      setExpVendor('');
      setExpNotes('');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to record expense', 'error');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to remove this expense record?')) return;
    setDeletingExpenseId(expenseId);
    try {
      await expenseService.delete(expenseId);
      showToast('Expense removed', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to remove expense', 'error');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Tracking Handlers
  const handleTrackSlp = (barcode) => {
    setSlpPortalOpen(true);
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      showToast('Please enter a tracking barcode number', 'warning');
      return;
    }
    setSavingTracking(true);
    try {
      await orderService.updateTracking(order.id, trackingNumber.trim(), courierName, user);
      showToast('Postal tracking number updated successfully', 'success');
      setTrackingModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update tracking number', 'error');
    } finally {
      setSavingTracking(false);
    }
  };

  // WhatsApp Message Builder
  let whatsAppMessage = `Hello ${order.customer?.full_name || 'Valued Customer'}, regarding your customized chocolate order (${order.order_number}) with WEDORA: Your order status is currently "${order.status}".`;
  if (order.tracking_number) {
    whatsAppMessage += ` Your package has been mailed via Sri Lanka Post! Postal Tracking Barcode: ${order.tracking_number}. You can track your parcel at: http://slpmail.slpost.gov.lk/track/index.php`;
  } else {
    whatsAppMessage += ` Required delivery date: ${formatDate(order.delivery_date)}. Thank you for choosing WEDORA!`;
  }
  const whatsAppUrl = getWhatsAppUrl(order.customer?.whatsapp || order.customer?.phone, whatsAppMessage);

  // Calculate Order-wise Expenses & Net Profit
  const totalOrderExpenses = (order.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netOrderProfit = Number(order.total_amount || 0) - totalOrderExpenses;
  const profitMargin = Number(order.total_amount || 0) > 0
    ? Math.round((netOrderProfit / Number(order.total_amount)) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Back button & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={() => printInvoicePDF(order, order.customer, order.items, order.payments, settings)}
          >
            Print Slip
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={FileText}
            onClick={() => downloadInvoicePDF(order, order.customer, order.items, order.payments, settings)}
          >
            Invoice (PDF)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Percent}
            style={{ borderColor: 'rgba(217, 119, 6, 0.4)', color: '#D97706' }}
            onClick={() => {
              const defaultPct = settings?.default_advance_percent || 50;
              setAdvancePercent(String(defaultPct));
              setAdvanceCustomAmount(String(Math.round((order.total_amount * defaultPct) / 100)));
              setAdvanceBankDetails('');
              setAdvanceModalOpen(true);
            }}
          >
            Advance Invoice
          </Button>

          {order.customer?.phone && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#059669', borderColor: 'rgba(5, 150, 105, 0.35)' }}
              onClick={() => {
                const defaultPct = settings?.default_advance_percent || 50;
                setAdvancePercent(String(defaultPct));
                setAdvanceCustomAmount(String(Math.round((order.total_amount * defaultPct) / 100)));
                setAdvanceBankDetails('');
                setAdvanceModalOpen(true);
              }}
            >
              <Send size={15} />
              <span>WhatsApp PDF Invoice</span>
            </button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Clock}
            onClick={() => {
              setSelectedStatus(order.status);
              setStatusNotes('');
              setStatusModalOpen(true);
            }}
          >
            Update Status
          </Button>

          {Number(order.balance_due) > 0 && (
            <Button
              variant="gold"
              size="sm"
              icon={CreditCard}
              onClick={() => {
                setPayAmount(String(order.balance_due));
                setPaymentModalOpen(true);
              }}
            >
              Record Payment
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Primary Order Overview Card */}
      <div
        className="order-hero-banner"
        style={{
          backgroundColor: 'var(--navy-900)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              {order.order_number}
            </h2>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--gold-300)', fontSize: '0.85rem', margin: 0 }}>
              Placed on {formatDate(order.order_date)} • Required Delivery: <strong>{formatDate(order.delivery_date)}</strong>
            </p>
            <button
              onClick={handleOpenDatesModal}
              title="Change Delivery Date"
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold-400)',
                color: 'var(--gold-300)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.15rem 0.45rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Edit size={11} />
              <span>Edit Date</span>
            </button>
          </div>
        </div>

        <div className="order-hero-stats" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Total Order Value */}
          <div
            onClick={handleOpenFinancialModal}
            title="Click to edit Total Order Value or add discounts"
            style={{
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.15s ease',
              border: '1px dashed rgba(212, 175, 55, 0.4)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
                Total Order Value
              </span>
              <Edit size={11} style={{ color: 'var(--gold-300)' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-300)' }}>
              {formatCurrency(order.total_amount)}
            </div>
          </div>

          {/* Amount Paid */}
          <div
            onClick={handleOpenFinancialModal}
            title="Click to edit or adjust already paid amount"
            style={{
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.15s ease',
              border: '1px dashed rgba(16, 185, 129, 0.4)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
                Amount Paid
              </span>
              <Edit size={11} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>
              {formatCurrency(order.total_paid)}
            </div>
          </div>

          {/* Balance Due */}
          <div
            onClick={() => {
              if (Number(order.balance_due) > 0) {
                setPayAmount(String(order.balance_due));
                setPaymentModalOpen(true);
              } else {
                handleOpenFinancialModal();
              }
            }}
            title={Number(order.balance_due) > 0 ? "Click to pay full remaining balance" : "Fully settled"}
            style={{
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.15s ease',
              border: Number(order.balance_due) > 0 ? '1px dashed rgba(248, 113, 113, 0.4)' : '1px dashed rgba(16, 185, 129, 0.4)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)' }}>
                Balance Due
              </span>
              {Number(order.balance_due) > 0 && <CreditCard size={11} style={{ color: '#F87171' }} />}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: Number(order.balance_due) > 0 ? '#F87171' : '#10B981' }}>
              {formatCurrency(order.balance_due)}
            </div>
          </div>

          {/* Order-wise Net Profit */}
          <div
            onClick={() => {
              const el = document.getElementById('order-expenses-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Click to view and add order-wise expenses"
            style={{
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.15s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: netOrderProfit >= 0 ? '1px dashed rgba(52, 211, 153, 0.5)' : '1px dashed rgba(248, 113, 113, 0.5)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: netOrderProfit >= 0 ? '#A7F3D0' : '#FECACA', fontWeight: 700 }}>
                Net Profit
              </span>
              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: netOrderProfit >= 0 ? 'rgba(5, 150, 105, 0.3)' : 'rgba(220, 38, 38, 0.3)', color: '#FFF' }}>
                {profitMargin}%
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netOrderProfit >= 0 ? '#34D399' : '#F87171' }}>
              {formatCurrency(netOrderProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Items & Customer Details */}
      <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Ordered Chocolates Table */}
        <Card>
          <CardHeader
            title="Custom Chocolate Line Items"
            subtitle={`${order.items?.length || 0} product(s) included in this order`}
          />
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product & Inscription</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                        {item.product_name}
                      </div>
                      {item.customization_details && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gold-600)', fontWeight: 500, marginTop: '0.2rem' }}>
                          ★ Inscription: "{item.customization_details}"
                        </div>
                      )}
                      {item.special_instructions && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Note: {item.special_instructions}
                        </div>
                      )}
                    </td>
                    <td>{item.size || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-hover)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '260px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.additional_charges) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '260px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery & Packing:</span>
                <span style={{ fontWeight: 600 }}>+{formatCurrency(order.additional_charges)}</span>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '260px', fontSize: '0.85rem', color: '#059669' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: 600 }}>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '260px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <span>Grand Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </Card>

        {/* Customer & Delivery Information Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardHeader
              title="Customer Details"
              action={
                order.customer && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/customers/${order.customer.id}`)}
                  >
                    Profile
                  </Button>
                )
              }
            />
            <CardBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'var(--gold-100)',
                    color: 'var(--gold-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  {order.customer?.full_name ? order.customer.full_name[0] : 'C'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem' }}>
                    {order.customer?.full_name || 'Walk-in Customer'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Code: {order.customer?.customer_code || 'GUEST'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                  <a href={`tel:${order.customer?.phone}`} style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    {formatPhoneNumber(order.customer?.phone)}
                  </a>
                </div>
                {order.customer?.whatsapp && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>WhatsApp: </span>
                    <span style={{ fontWeight: 600 }}>{formatPhoneNumber(order.customer?.whatsapp)}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Address: </span>
                  <p style={{ marginTop: '0.2rem', lineHeight: 1.4, color: 'var(--text-main)' }}>
                    {order.customer?.address || 'Pickup at Wedora Studio'}
                  </p>
                </div>
                {order.notes && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--navy-50)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase' }}>
                      Delivery Instructions:
                    </span>
                    <p style={{ fontSize: '0.82rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Postal / SLP Mail Tracking Card */}
          <Card style={{ marginTop: '1.25rem' }}>
            <CardHeader
              title="Mail / Postal Tracking"
              subtitle="Sri Lanka Post (SLP) Tracking"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={order.tracking_number ? Edit : Plus}
                  onClick={() => {
                    setTrackingNumber(order.tracking_number || '');
                    setCourierName(order.courier_name || 'SL Post');
                    setTrackingModalOpen(true);
                  }}
                >
                  {order.tracking_number ? 'Edit' : 'Add Tracking'}
                </Button>
              }
            />
            <CardBody>
              {order.tracking_number ? (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {order.courier_name || 'Sri Lanka Post'} Barcode:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--bg-hover)',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-subtle)',
                      marginBottom: '0.85rem'
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.15rem', color: 'var(--navy-900)', letterSpacing: '0.06em' }}>
                      {order.tracking_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(order.tracking_number);
                        showToast(`Copied barcode: ${order.tracking_number}`, 'info');
                      }}
                      style={{ color: 'var(--gold-600)', padding: '0.25rem', cursor: 'pointer' }}
                      title="Copy Barcode"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <Button
                    variant="gold"
                    size="sm"
                    icon={ExternalLink}
                    onClick={() => handleTrackSlp(order.tracking_number)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    Track on SLP Mail Tracking Site
                  </Button>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.45rem', textAlign: 'center' }}>
                    Copies barcode to clipboard & opens slpmail.slpost.gov.lk
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    No postal barcode added yet. Add it once mailed!
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setTrackingNumber('');
                      setCourierName('SL Post');
                      setTrackingModalOpen(true);
                    }}
                  >
                    Add Postal Tracking Barcode
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Order-wise Expenses & Profit Analysis Section */}
      <div id="order-expenses-section" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardHeader
            title="Order-wise Expenses & Net Profit Analysis"
            subtitle={`Dedicated operational expenses allocated directly to Order ${order.order_number}`}
            action={
              <Button
                variant="gold"
                size="sm"
                icon={Plus}
                onClick={() => setExpenseModalOpen(true)}
              >
                Add Order Expense
              </Button>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {/* Profit & Expense Metrics Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-hover)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Order Revenue (Sales)
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                  {formatCurrency(order.total_amount)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Order Expenses (Costs)
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626' }}>
                  {formatCurrency(totalOrderExpenses)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Net Order Profit
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: netOrderProfit >= 0 ? '#059669' : '#DC2626' }}>
                  {formatCurrency(netOrderProfit)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Profit Margin
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: profitMargin >= 30 ? '#059669' : (profitMargin > 0 ? '#D97706' : '#DC2626') }}>
                  {profitMargin}%
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            {(!order.expenses || order.expenses.length === 0) ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Receipt size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                No dedicated expenses recorded for this order yet.
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setExpenseModalOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-600)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    + Add first expense (ingredients, packaging, delivery)
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Expense Item</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Paid Via</th>
                      <th>Vendor / Notes</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center', width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                          <div>{exp.title}</div>
                          {exp.expense_number && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {exp.expense_number}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                            {exp.category}
                          </span>
                        </td>
                        <td>{formatDate(exp.expense_date)}</td>
                        <td>
                          <span className="badge badge-navy" style={{ fontSize: '0.7rem' }}>
                            {exp.payment_method}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {exp.vendor || exp.notes || '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                          {formatCurrency(exp.amount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={deletingExpenseId === exp.id}
                            title="Remove expense"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '0.3rem'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Bottom Grid: Payment History & Status Audit Trail */}
      <div className="order-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Payment History */}
        <Card>
          <CardHeader
            title="Payment History"
            subtitle={`Total payments received: ${formatCurrency(order.total_paid)}`}
            action={
              Number(order.balance_due) > 0 && (
                <Button
                  variant="gold"
                  size="sm"
                  icon={CreditCard}
                  onClick={() => {
                    setPayAmount(String(order.balance_due));
                    setPaymentModalOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              )
            }
          />
          <CardBody style={{ padding: 0 }}>
            {order.payments?.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No payments recorded yet for this order.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Ref #</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments?.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{p.payment_number}</td>
                      <td>{formatDate(p.payment_date)}</td>
                      <td>
                        <span className="badge badge-navy">{p.payment_method}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.payment_reference || '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Status History Timeline */}
        <Card>
          <CardHeader
            title="Status & Production Timeline"
            subtitle="Audit log of stage transitions"
          />
          <CardBody>
            <div className="timeline">
              {order.status_history?.map((h, i) => (
                <div key={h.id || i} className={`timeline-item ${i === 0 ? 'active' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                        {h.new_status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatDateTime(h.changed_at)}
                      </span>
                    </div>
                    {h.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Update Order Status (${order.order_number})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleStatusSubmit} loading={savingStatus}>
              Update Status
            </Button>
          </>
        }
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUS_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status Notes / Reason</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Completed packaging with navy satin ribbon, passed QA check"
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment for ${order.order_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handlePaymentSubmit} loading={savingPay}>
              Record Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handlePaymentSubmit}>
          <div style={{ backgroundColor: 'var(--navy-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order Total:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already Paid:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(order.total_paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
              <span>Outstanding Balance:</span>
              <span style={{ color: '#DC2626' }}>{formatCurrency(order.balance_due)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (LKR) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Reference</label>
            <input
              type="text"
              className="form-input"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. Bank deposit slip number or Cash receipt ID"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Note</label>
            <input
              type="text"
              className="form-input"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Optional remarks"
            />
          </div>
        </form>
      </Modal>

      {/* Postal Tracking Barcode Modal */}
      <Modal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        title="Add / Update Postal Tracking Barcode"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTrackingModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveTracking} loading={savingTracking}>
              Save Tracking Barcode
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTracking}>
          <div className="form-group">
            <label className="form-label">Delivery Service / Courier</label>
            <select
              className="form-select"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            >
              <option value="SL Post">Sri Lanka Post (SLP Mail)</option>
              <option value="Pronto">Pronto Lanka</option>
              <option value="Prompt Xpress">Prompt Xpress</option>
              <option value="Domex">Domex Courier</option>
              <option value="Other">Other Courier Service</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Postal Tracking Barcode Number *</label>
            <input
              type="text"
              className="form-input"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. CP123456789LK"
              style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700 }}
              required
            />
            <span className="form-helper">
              Enter or scan the barcode from your Sri Lanka Post registered mail / parcel slip.
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--navy-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginTop: '0.85rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
              ℹ️ Direct SLP Tracking Integration
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Once saved, you can click "Track on SLP Mail Tracking Site" to automatically copy the barcode to your clipboard and open the Sri Lanka Post tracking portal directly!
            </p>
          </div>
        </form>
      </Modal>

      {/* Edit Order Financial Values Modal */}
      <Modal
        isOpen={financialModalOpen}
        onClose={() => setFinancialModalOpen(false)}
        title={`Edit Financials & Advance: ${order.order_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFinancialModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveFinancials} loading={savingFinancials}>
              Save Financial Values
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFinancials}>
          <div style={{ backgroundColor: 'var(--navy-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current Total:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Advance / Already Paid:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(order.total_paid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
              <span>Balance Due After Edit:</span>
              <span style={{ color: '#DC2626' }}>
                {formatCurrency(Math.max(0, Number(editTotalAmount || 0) - Number(editTotalPaid || 0)))}
              </span>
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label required">Total Order Value (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={editTotalAmount}
                onChange={(e) => setEditTotalAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Advance / Paid Amount (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={editTotalPaid}
                onChange={(e) => setEditTotalPaid(e.target.value)}
                placeholder="0.00"
                required
              />
              <span className="form-helper">
                Adjust the advance or already paid amount saved for this order.
              </span>
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Discount (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={editDiscount}
                onChange={(e) => setEditDiscount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional / Delivery Charges (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={editAdditionalCharges}
                onChange={(e) => setEditAdditionalCharges(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Order & Delivery Dates Modal */}
      <Modal
        isOpen={datesModalOpen}
        onClose={() => setDatesModalOpen(false)}
        title={`Change Delivery Schedule: ${order.order_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDatesModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveDates} loading={savingDates}>
              Save Dates
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveDates}>
          <div className="form-group">
            <label className="form-label required">Required Delivery Date</label>
            <input
              type="date"
              className="form-input"
              value={editDeliveryDate}
              onChange={(e) => setEditDeliveryDate(e.target.value)}
              required
              autoFocus
            />
            <span className="form-helper">
              This date updates the dispatch queue, urgent deliveries counter, and dashboard calendar.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Order Placed Date</label>
            <input
              type="date"
              className="form-input"
              value={editOrderDate}
              onChange={(e) => setEditOrderDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Advance Invoice & WhatsApp Modal */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title="Advance Invoice & WhatsApp Dispatch"
        footer={
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
            <Button
              variant="secondary"
              onClick={() => {
                downloadInvoicePDF(order, order.customer, order.items, order.payments, settings, {
                  isAdvanceInvoice: true,
                  advanceAmount: Number(advanceCustomAmount) || 0
                });
                showToast('Advance Invoice PDF downloaded', 'success');
              }}
              icon={FileText}
            >
              Download PDF
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                printInvoicePDF(order, order.customer, order.items, order.payments, settings, {
                  isAdvanceInvoice: true,
                  advanceAmount: Number(advanceCustomAmount) || 0
                });
              }}
              icon={Printer}
            >
              Print
            </Button>

            <Button
              variant="success"
              style={{ backgroundColor: '#059669', borderColor: '#059669', color: '#FFF' }}
              icon={Send}
              onClick={async () => {
                const res = await shareInvoicePDFToWhatsApp(order, order.customer, order.items, order.payments, settings, {
                  isAdvanceInvoice: true,
                  advanceAmount: Number(advanceCustomAmount) || 0
                });
                if (res?.sharedDirectly) {
                  showToast('Invoice PDF shared to WhatsApp!', 'success');
                } else if (!res?.cancelled) {
                  showToast(`Invoice PDF downloaded (${res?.fileName}). Attach it to the opened WhatsApp chat!`, 'success');
                }
                setAdvanceModalOpen(false);
              }}
            >
              Send PDF to WhatsApp
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 0.95rem'
          }}>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.85rem', marginBottom: '0.15rem' }}>
              Advance Invoice & WhatsApp Dispatch
            </div>
            <div style={{ fontSize: '0.78rem', color: '#B45309', lineHeight: 1.35 }}>
              Create an official Proforma / Advance PDF invoice showing how much advance the customer should pay, and send it directly via WhatsApp.
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Total Order Value</label>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', padding: '0.2rem 0' }}>
                {formatCurrency(order.total_amount)}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Already Paid</label>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', padding: '0.2rem 0' }}>
                {formatCurrency(order.total_paid)}
              </div>
            </div>
          </div>

          {/* Preset Advance Percentage Buttons */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Choose Advance Ratio</label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[25, 30, 40, 50, 60, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`btn btn-sm ${advancePercent === String(pct) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    flex: '1 1 calc(14% - 0.35rem)',
                    minWidth: '42px',
                    padding: '0.35rem 0.2rem',
                    fontSize: '0.76rem',
                    fontWeight: 700
                  }}
                  onClick={() => {
                    setAdvancePercent(String(pct));
                    setAdvanceCustomAmount(String(Math.round((order.total_amount * pct) / 100)));
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Custom Advance Amount */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required" style={{ fontSize: '0.78rem' }}>Advance Amount Requested (Rs.)</label>
            <input
              type="number"
              step="50"
              className="form-input"
              value={advanceCustomAmount}
              onChange={(e) => {
                setAdvanceCustomAmount(e.target.value);
                setAdvancePercent('custom');
              }}
              placeholder="e.g. 4500"
              required
            />
            <span className="form-helper" style={{ fontSize: '0.72rem' }}>
              Amount clearly highlighted on the PDF invoice under <strong>ADVANCE PAYABLE</strong>.
            </span>
          </div>

          {/* WhatsApp Preview Box */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>WhatsApp Message Preview</label>
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 0.75rem',
              fontSize: '0.73rem',
              color: '#166534',
              fontFamily: 'monospace',
              whiteSpace: 'pre-line',
              maxHeight: '80px',
              overflowY: 'auto'
            }}>
              {buildWhatsAppInvoiceMessage(order, order.customer, settings, {
                isAdvanceInvoice: true,
                advanceAmount: Number(advanceCustomAmount) || 0
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Order Record"
        message={`Are you sure you want to permanently delete ${order.order_number}? This action cannot be reversed.`}
        confirmText="Permanently Delete"
        loading={deleting}
      />

      {/* Embedded In-App Sri Lanka Post Tracking Portal */}
      <PostalTrackingModal
        isOpen={slpPortalOpen}
        onClose={() => setSlpPortalOpen(false)}
        barcode={order.tracking_number}
        orderNumber={order.order_number}
      />

      {/* Add Order-wise Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title={`Add Expense to Order: ${order.order_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveExpense} loading={savingExpense}>
              Save Order Expense
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
              💡 This expense will be tied directly to <strong>{order.order_number}</strong> to accurately compute this specific order's net profit.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Expense Description / Item</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Belgian Couverture 1.5kg, Custom Box Packaging"
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label required">Cost / Amount (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-input"
                placeholder="Rs. 0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label required">Category</label>
              <select
                className="form-select"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
              >
                <option value="Ingredients & Raw Materials">Ingredients & Raw Materials</option>
                <option value="Packaging & Foils">Packaging & Foils</option>
                <option value="Delivery & Logistics">Delivery & Courier</option>
                <option value="Equipment & Tools">Equipment & Tools</option>
                <option value="Marketing & Printing">Marketing & Printing</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vendor / Supplier</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PrintCraft, BakerySupplies"
                value={expVendor}
                onChange={(e) => setExpVendor(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={expMethod}
                onChange={(e) => setExpMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Additional Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="Optional notes or receipt references"
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
