import React, { useState, useEffect } from 'react';
import { employeeService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { formatDate } from '../utils/dateUtils';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  Users,
  UserPlus,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';

export const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const { refreshTrigger, refreshData } = useData();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getAll();
        setEmployees(data);
      } catch (err) {
        showToast(err.message || 'Failed to load employees', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [refreshTrigger]);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('employee');
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFullName(emp.full_name);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setRole(emp.role);
    setStatus(emp.status);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { full_name: fullName, email, phone, role, status };

      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, payload);
        showToast('Employee record updated', 'success');
      } else {
        await employeeService.create(payload);
        showToast('Employee invitation sent', 'success');
      }

      setModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to save employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-action-bar">
        <div>
          {!isSupabaseConfigured && (
            <div className="mode-badge demo" style={{ marginBottom: 0 }}>
              Demo Mode: Employee records are stored locally. Configure Supabase to manage actual auth accounts.
            </div>
          )}
        </div>
        <Button variant="gold" icon={UserPlus} onClick={handleOpenAddModal}>
          Add Employee
        </Button>
      </div>

      {loading ? (
        <Spinner text="Loading staff directory..." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: emp.role === 'admin'
                            ? 'linear-gradient(135deg, var(--gold-400), var(--gold-600))'
                            : 'linear-gradient(135deg, var(--navy-700), var(--navy-800))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: emp.role === 'admin' ? 'var(--navy-950)' : '#FFF',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}
                      >
                        {emp.full_name ? emp.full_name[0] : 'U'}
                      </div>
                      <div style={{ fontWeight: 600 }}>{emp.full_name}</div>
                    </div>
                  </td>
                  <td>{emp.email}</td>
                  <td>{emp.phone || '-'}</td>
                  <td>
                    <span className={`badge ${emp.role === 'admin' ? 'badge-gold' : 'badge-navy'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {emp.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    {emp.status === 'active' ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>{formatDate(emp.created_at)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => handleOpenEditModal(emp)}
                      title="Edit Employee"
                    >
                      <Edit size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={handleSave} loading={saving}>
              {editingEmployee ? 'Update' : 'Create Employee'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maneesha Fernando"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maneesha@wedora.lk"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 71 456 7890"
            />
          </div>

          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Employee (Standard)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
