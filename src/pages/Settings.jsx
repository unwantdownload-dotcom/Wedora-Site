import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { SPECIAL_HANDLING_TEXT } from '../utils/invoiceConstants';
import { Settings as SettingsIcon, Save, Database } from 'lucide-react';

export const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [defaultAdvancePercent, setDefaultAdvancePercent] = useState('50');
  const [orderPrefix, setOrderPrefix] = useState('WED-');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');

  const { refreshTrigger, updateSettings } = useData();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const s = await settingsService.get();
        setSettings(s);
        setBusinessName(s.business_name || '');
        setTagline(s.tagline || '');
        setPhone(s.phone || '');
        setWhatsapp(s.whatsapp || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setBankDetails(s.bank_details || '');
        setDefaultAdvancePercent(s.default_advance_percent?.toString() || '50');
        setOrderPrefix(s.order_prefix || 'WED-');
        setInvoicePrefix(s.invoice_prefix || 'INV-');
      } catch (err) {
        showToast(err.message || 'Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [refreshTrigger]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        business_name: businessName,
        tagline,
        phone,
        whatsapp,
        email,
        address,
        bank_details: bankDetails,
        default_advance_percent: Number(defaultAdvancePercent) || 50,
        order_prefix: orderPrefix,
        invoice_prefix: invoicePrefix
      });
      showToast('Business settings updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="Loading settings..." />;

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
          {/* Business Profile Settings */}
          <Card>
            <CardHeader
              title="Business Identity & Contact"
              subtitle="Brand name and contact details as they appear on invoices"
            />
            <CardBody>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="WEDORA Customized Chocolates"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Artisanal Luxury Handcrafted Chocolates"
                />
              </div>

              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Business Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 78 359 0222"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+94 78 359 0222"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@wedora.lk"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea
                  className="form-textarea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="No. 45, Flower Road, Colombo 07, Sri Lanka"
                />
              </div>
            </CardBody>
          </Card>

          {/* Invoice & Order Settings */}
          <Card>
            <CardHeader
              title="Invoice & Order Configuration"
              subtitle="Numbering prefix and terms that appear on printed invoices"
            />
            <CardBody>
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Order Number Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={orderPrefix}
                    onChange={(e) => setOrderPrefix(e.target.value)}
                    placeholder="WED-"
                  />
                  <p className="form-helper">e.g. WED-2026-1001</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Number Prefix</label>
                  <input
                    type="text"
                    className="form-input"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                  />
                  <p className="form-helper">e.g. INV-2026-1001</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Default Advance Required (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="form-input"
                    value={defaultAdvancePercent}
                    onChange={(e) => setDefaultAdvancePercent(e.target.value)}
                    placeholder="50"
                  />
                  <p className="form-helper">Standard advance percentage for custom chocolate orders (e.g. 50%)</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Handling &amp; Storage (fixed)</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={SPECIAL_HANDLING_TEXT}
                  readOnly
                />
                <p className="form-helper">This instruction appears on every invoice.</p>
              </div>

              {/* Supabase Connection Status */}
              <div style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSupabaseConfigured ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                border: `1px solid ${isSupabaseConfigured ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: isSupabaseConfigured ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                  <Database size={15} />
                  {isSupabaseConfigured ? 'Connected to Live Supabase PostgreSQL' : 'Interactive Demo Mode (Local Storage)'}
                </div>
                <p style={{ fontSize: '0.78rem', color: isSupabaseConfigured ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                  {isSupabaseConfigured
                    ? 'All changes are synced to your cloud database in real time.'
                    : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect to production database.'}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
          <Button variant="gold" type="submit" icon={Save} size="lg" loading={saving}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
