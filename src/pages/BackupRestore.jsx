import React, { useState, useEffect } from 'react';
import { backupService } from '../services/backupService';
import { customerService, productService, orderService, paymentService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import {
  DatabaseBackup,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileJson,
  FileText,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Loader2,
  TrendingUp
} from 'lucide-react';

export const BackupRestore = () => {
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importValidation, setImportValidation] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupData, setBackupData] = useState(null);

  // CSV Export states
  const [exportingTable, setExportingTable] = useState(null);

  const { refreshData } = useData();
  const { showToast } = useToast();

  const handleExportSalesPDF = async () => {
    setExportingPdf(true);
    try {
      const res = await backupService.exportSalesReportPDF();
      showToast(`Sales Backup PDF downloaded successfully (${res.totalOrders} orders included)`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate sales report PDF', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleFullJsonExport = async () => {
    setExporting(true);
    try {
      const payload = await backupService.exportJSON();
      showToast(`Backup downloaded with ${payload.metadata.total_orders} orders & ${payload.metadata.total_customers} customers`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate backup', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSVTable = async (tableName) => {
    setExportingTable(tableName);
    try {
      let rows = [];
      switch (tableName) {
        case 'customers':
          rows = await customerService.getAll();
          break;
        case 'products':
          rows = await productService.getAll();
          break;
        case 'orders':
          rows = await orderService.getAll();
          rows = rows.map(o => ({ ...o, customer: undefined, customer_name: o.customer?.full_name }));
          break;
        case 'payments':
          rows = await paymentService.getAll();
          rows = rows.map(p => ({ ...p, order: undefined, order_number: p.order?.order_number }));
          break;
        default:
          break;
      }
      backupService.exportTableCSV(tableName, rows);
      showToast(`${tableName} exported as CSV successfully`, 'success');
    } catch (err) {
      showToast(`Failed to export ${tableName}`, 'error');
    } finally {
      setExportingTable(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const validation = backupService.validateBackupFile(parsed);
        setImportValidation(validation);
        setBackupData(parsed);
        setImportFile(file);
      } catch (err) {
        showToast('Invalid file. Must be a valid Wedora JSON backup.', 'error');
        setImportValidation(null);
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleInitiateRestore = () => {
    if (!importValidation?.isValid) {
      showToast('Please upload a valid Wedora backup file first', 'warning');
      return;
    }
    setRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = async () => {
    setRestoring(true);
    try {
      await backupService.restoreBackup(backupData);
      showToast('Backup data restored successfully! Refreshing application data...', 'success');
      setRestoreConfirmOpen(false);
      setImportFile(null);
      setImportValidation(null);
      setBackupData(null);
      setTimeout(() => refreshData(), 1000);
    } catch (err) {
      showToast('Restore failed: ' + err.message, 'error');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Warning Banner */}
      <div
        style={{
          backgroundColor: 'var(--status-warning-bg)',
          border: '1px solid var(--status-warning-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}
      >
        <AlertTriangle size={22} color="#B45309" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--status-warning-text)', marginBottom: '0.25rem' }}>
            Business Data Module — Administrator Access Only
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--status-warning-text)' }}>
            Export backups regularly to protect your chocolate order records. Restoring from a backup file will <strong>overwrite your current data</strong>. Always create a fresh backup before restoring.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
        {/* Export Section */}
        <Card>
          <CardHeader
            title="Export Business Backup"
            subtitle="Download a complete copy of all Wedora data"
          />
          <CardBody>
            {/* Sales Details Backup (PDF) */}
            <div style={{ padding: '1.25rem', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', backgroundColor: '#FFFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 36, height: 36, backgroundColor: 'rgba(212, 175, 55, 0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--gold-600)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Sales Details Backup (PDF)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Official landscape PDF summary with revenue KPIs, payments, balances, and complete order history.</div>
                </div>
              </div>
              <Button
                variant="gold"
                icon={Download}
                onClick={handleExportSalesPDF}
                loading={exportingPdf}
                style={{ width: '100%' }}
              >
                Download Sales Details PDF Backup
              </Button>
            </div>

            {/* Full JSON Backup */}
            <div style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 36, height: 36, backgroundColor: 'var(--navy-100)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileJson size={18} color="var(--navy-900)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Complete JSON Archive</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>All tables in one structured JSON file. Can be used for data restoration.</div>
                </div>
              </div>
              <Button
                variant="primary"
                icon={Download}
                onClick={handleFullJsonExport}
                loading={exporting}
                style={{ width: '100%' }}
              >
                Download Full JSON Backup
              </Button>
            </div>

            {/* Individual CSV Exports */}
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              Export Individual Tables as CSV
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { id: 'customers', label: 'Customer Directory', icon: Users },
                { id: 'products', label: 'Product Catalog', icon: Package },
                { id: 'orders', label: 'Order Records', icon: ShoppingBag },
                { id: 'payments', label: 'Payment Ledger', icon: CreditCard }
              ].map((table) => (
                <div key={table.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
                    <table.icon size={15} color="var(--gold-600)" />
                    {table.label}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    loading={exportingTable === table.id}
                    onClick={() => handleExportCSVTable(table.id)}
                  >
                    CSV
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Import / Restore Section */}
        <Card>
          <CardHeader
            title="Restore From Backup"
            subtitle="Import a Wedora JSON backup file to restore data"
          />
          <CardBody>
            {/* File Upload Area */}
            <div
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-hover)',
                marginBottom: '1.25rem',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('backup-file-input').click()}
            >
              <Upload size={28} color="var(--gold-500)" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                Click to select your Wedora backup file
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Only .json files from Wedora OMS backup downloads are accepted
              </div>
              <input
                id="backup-file-input"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {importFile && importValidation && (
              <div style={{ padding: '1.25rem', border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--status-success-bg)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--status-success-text)', marginBottom: '0.75rem' }}>
                  <CheckCircle size={16} /> Backup File Validated Successfully
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--status-success-text)' }}>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <strong>File:</strong> {importFile.name}
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <strong>Backup Version:</strong> {importValidation.version}
                  </div>
                  {importValidation.exported_at && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Created:</strong> {new Date(importValidation.exported_at).toLocaleString()}
                    </div>
                  )}

                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Records Preview:</div>
                  <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                    {Object.entries(importValidation.counts).map(([table, count]) => (
                      <div key={table} style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{table}:</span> <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {importValidation?.isValid && (
              <Button
                variant="danger"
                icon={Upload}
                onClick={handleInitiateRestore}
                style={{ width: '100%' }}
              >
                Restore This Backup (Overwrites Current Data)
              </Button>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={handleConfirmRestore}
        title="⚠ Confirm Data Restoration"
        message={`You are about to restore ${importValidation?.counts?.orders || 0} orders, ${importValidation?.counts?.customers || 0} customers, and ${importValidation?.counts?.payments || 0} payments. This will OVERWRITE all existing records in the system. This action cannot be undone.`}
        confirmText="Yes, Restore Data Now"
        variant="danger"
        loading={restoring}
      />
    </div>
  );
};
