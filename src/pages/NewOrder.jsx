import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, productService, orderService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card, CardBody } from '../components/common/Card';
import { calculateItemSubtotal, calculateOrderTotals, calculateRemainingBalance } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import {
  Plus, Trash2, CreditCard, Calendar, MapPin, Phone, User, Hash, Check, Truck
} from 'lucide-react';

const CHOCO_TYPES = [
  { code: 'A',  label: 'Code A',  size: '12.5×5.5 cm', weight: '12g',  price: 85,  min: 50 },
  { code: 'A1', label: 'Code A1', size: '13.5×6 cm',   weight: '25g',  price: 125, min: 50 },
  { code: 'C1', label: 'Code C1', size: '17×6.5 cm',   weight: '45g',  price: 165, min: 20 },
  { code: 'D1', label: 'Code D1', size: '20.5×9 cm',   weight: '85g',  price: 700, min: 1  },
];

const genCode = () => `WED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const NewOrder = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [orderCode] = useState(genCode());
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [notes, setNotes] = useState('');
  const [advance, setAdvance] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  const [items, setItems] = useState([
    { id: 1, code: 'A', name: 'Custom Chocolate - Code A', size: '12.5×5.5 cm (12g)', qty: 50, price: 85, sub: 4250 }
  ]);

  const { user } = useAuth();
  const { refreshData } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([customerService.getAll(), productService.getActive()]);
        setCustomers(c);
        setProducts(p);
      } catch (err) {
        showToast(err.message || 'Failed to load customers and products', 'error');
      }
    })();
  }, []);

  const pickCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (c) { setCustomerName(c.full_name); setWhatsapp(c.whatsapp || c.phone || ''); setLocation(c.address || ''); }
  };

  const selectType = (spec) => {
    const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, {
      id: nextId, code: spec.code, name: `Custom Chocolate - ${spec.label}`,
      size: `${spec.size} (${spec.weight})`, qty: spec.min, price: spec.price, sub: spec.min * spec.price
    }]);
  };

  const updateItem = (idx, field, val) => {
    const u = [...items];
    u[idx] = { ...u[idx], [field]: val };
    if (field === 'qty' || field === 'price') {
      const q = field === 'qty' ? (parseInt(val) || 0) : u[idx].qty;
      const p = field === 'price' ? (parseFloat(val) || 0) : u[idx].price;
      u[idx].sub = q * p;
    }
    setItems(u);
  };

  const removeItem = (idx) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };

  const switchCode = (idx, spec) => {
    const u = [...items];
    u[idx] = { ...u[idx], code: spec.code, name: `Custom Chocolate - ${spec.label}`,
      size: `${spec.size} (${spec.weight})`, price: spec.price,
      qty: u[idx].qty < spec.min ? spec.min : u[idx].qty,
      sub: (u[idx].qty < spec.min ? spec.min : u[idx].qty) * spec.price
    };
    setItems(u);
  };

  const delChargeNum = Number(deliveryCharge) || 0;
  const totals = calculateOrderTotals(items.map(i => ({ quantity: i.qty, unit_price: i.price, subtotal: i.sub })), delChargeNum, 0);
  const advNum = Number(advance) || 0;
  const balance = calculateRemainingBalance(totals.total_amount, advNum);

  const submit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return showToast('Enter customer name', 'warning');
    if (!whatsapp.trim()) return showToast('Enter WhatsApp number', 'warning');
    if (!deliveryDate) return showToast('Select delivery date', 'warning');

    setSubmitting(true);
    try {
      const created = await orderService.create(
        { order_number: orderCode, order_name: items.map(i => i.code).join('+'), customer_name: customerName.trim(),
          whatsapp: whatsapp.trim(), location: location.trim(), order_date: orderDate,
          delivery_date: deliveryDate, additional_charges: delChargeNum, discount: 0, notes, status: 'New' },
        items.map(i => ({ product_name: i.name, size: i.size, quantity: i.qty, unit_price: i.price, subtotal: i.sub })),
        advNum > 0 ? { amount: advNum, payment_method: payMethod, payment_reference: '' } : null, user
      );
      showToast(`Order ${created.order_number} created!`, 'success');
      refreshData();
      navigate(`/orders/${created.id}`);
    } catch (err) { showToast(err.message || 'Failed to create order', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={submit}>
        {/* Order Code Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy-900), var(--navy-850))',
          color: '#FFF', borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          border: '1px solid rgba(212,175,55,0.2)'
        }}>
          <Hash size={20} color="var(--gold-400)" />
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-300)', fontWeight: 600 }}>Order Code</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{orderCode}</div>
          </div>
        </div>

        <div className="new-order-layout">
          {/* LEFT: Main Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Section 1: Customer */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={16} color="var(--gold-500)" /> Customer Details
                </div>

                {customers.length > 0 && (
                  <div className="form-group">
                    <select className="form-select" onChange={(e) => pickCustomer(e.target.value)} defaultValue="" style={{ fontSize: '0.82rem' }}>
                      <option value="">Select existing customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
                    </select>
                  </div>
                )}

                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Dilini Senanayake" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Phone size={13} color="#059669" style={{marginRight:4}} />WhatsApp Number *</label>
                    <input className="form-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="e.g. +94 7X XXX XXXX" required />
                  </div>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label"><MapPin size={13} style={{marginRight:4}} />Delivery Location</label>
                  <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. No 18, Flower Road, Colombo 03" />
                </div>
              </CardBody>
            </Card>

            {/* Section 2: Dates */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={16} color="var(--gold-500)" /> Order & Delivery Schedule
                </div>
                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Order Date</label>
                    <input type="date" className="form-input" value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{color:'#DC2626', fontWeight:700}}>Delivery Date *</label>
                    <input type="date" className="form-input" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required style={{borderColor: deliveryDate ? 'var(--border-subtle)' : '#FCA5A5'}} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="delivery-charge">Delivery Charge (LKR)</label>
                  <input
                    id="delivery-charge"
                    type="number"
                    min="0"
                    step="10"
                    className="form-input"
                    placeholder="0.00 (e.g. 350)"
                    value={deliveryCharge}
                    onChange={e => setDeliveryCharge(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Special Notes</label>
                  <textarea className="form-textarea" rows="2" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Keep chilled, deliver before 3 PM" />
                </div>
              </CardBody>
            </Card>

            {/* Section 3: Chocolate Type Quick Select */}
            <Card>
              <CardBody>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.85rem' }}>
                  🍫 Select Chocolate Type
                </div>
                <div className="new-order-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {CHOCO_TYPES.map(spec => (
                    <button key={spec.code} type="button" onClick={() => selectType(spec)}
                      style={{
                        padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--border-subtle)', background: 'var(--bg-surface)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-400)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy-900)' }}>{spec.code}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{spec.size}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{spec.weight}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--gold-600)', marginTop: '0.3rem' }}>Rs. {spec.price}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Min: {spec.min}</div>
                    </button>
                  ))}
                </div>

                {/* Selected Items List */}
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Items ({items.length})
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} className="new-order-item-grid" style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 90px 100px 36px',
                    gap: '0.5rem', alignItems: 'end', padding: '0.75rem 0',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Type</div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {CHOCO_TYPES.map(s => (
                          <button key={s.code} type="button" onClick={() => switchCode(idx, s)}
                            style={{
                              padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700,
                              borderRadius: 'var(--radius-xs)',
                              border: item.code === s.code ? '1.5px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                              background: item.code === s.code ? 'var(--navy-900)' : 'var(--bg-hover)',
                              color: item.code === s.code ? 'var(--gold-300)' : 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}>{s.code}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Qty</div>
                      <input type="number" min="1" className="form-input" value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', fontWeight: 700, textAlign: 'center' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Price</div>
                      <input type="number" min="0" className="form-input" value={item.price}
                        onChange={e => updateItem(idx, 'price', e.target.value)}
                        style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Subtotal</div>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.9rem' }}>{formatCurrency(item.sub)}</div>
                    </div>
                    <div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} style={{ color: '#EF4444', padding: '0.3rem' }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* RIGHT: Summary Sidebar */}
          <div className="new-order-summary">
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1.25rem' }}>Order Summary</h3>

              {/* Items Summary */}
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>{item.code} × {item.qty}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(item.sub)}</span>
                </div>
              ))}
              {delChargeNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.65rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Truck size={14} color="var(--gold-600)" /> Delivery Charge
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(delChargeNum)}</span>
                </div>
              )}

              <div style={{ borderTop: '1.5px solid var(--navy-900)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy-900)' }}>
                <span>Total</span>
                <span>{formatCurrency(totals.total_amount)}</span>
              </div>

              {/* Advance Payment */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                  <CreditCard size={15} color="var(--gold-500)" /> Advance Payment
                </div>
                <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00"
                  value={advance} onChange={e => setAdvance(e.target.value)}
                  style={{ marginBottom: '0.5rem' }} />
                {advNum > 0 && (
                  <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ marginBottom: '0.5rem' }}>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, color: balance === 0 ? '#059669' : '#DC2626', marginTop: '0.25rem' }}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(balance)}</span>
                </div>
              </div>

              <Button type="submit" variant="gold" size="lg" loading={submitting}
                style={{ width: '100%', marginTop: '1.5rem' }}>
                <Check size={18} /> Create Order
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
