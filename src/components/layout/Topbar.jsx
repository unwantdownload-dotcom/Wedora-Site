import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Plus, Calendar } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/dateUtils';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Wedora business overview and real-time sales' },
  '/orders': { title: 'Orders', subtitle: 'Manage all customer chocolate orders' },
  '/orders/new': { title: 'Create Order', subtitle: 'Place new custom chocolate order' },
  '/deliveries': { title: 'Delivery Schedule', subtitle: 'Dispatch tracking and delivery status' },
  '/customers': { title: 'Customers', subtitle: 'Client directory and purchase histories' },
  '/products': { title: 'Chocolates & Sizes', subtitle: 'Size & price catalog: Codes A, A1, C1, D1' },
  '/payments': { title: 'Payments & Invoices', subtitle: 'Advance payments and billing records' },
  '/invoices': { title: 'Invoices', subtitle: 'Download and print customer invoices' },
  '/reports': { title: 'Sales Analytics', subtitle: 'Financial performance and revenue graphs' },
  '/settings': { title: 'Settings & Backup', subtitle: 'Business identity and data backups' }
};

export const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSupabaseConfigured } = useAuth();

  const currentPath = location.pathname;
  let pageInfo = PAGE_TITLES[currentPath];
  if (!pageInfo) {
    if (currentPath.startsWith('/orders/')) {
      pageInfo = { title: 'Order Details', subtitle: 'Detailed line items and production status' };
    } else if (currentPath.startsWith('/customers/')) {
      pageInfo = { title: 'Customer Profile', subtitle: 'Lifetime orders and contact details' };
    } else {
      pageInfo = { title: 'Wedora', subtitle: 'Custom Chocolate Order Management' };
    }
  }

  const todayStr = formatDate(new Date().toISOString().split('T')[0]);

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="page-header-info">
          <h1 className="page-title">{pageInfo.title}</h1>
          <p className="page-subtitle">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Date Display */}
        <div
          className="topbar-date"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            backgroundColor: 'var(--bg-hover)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <Calendar size={14} color="var(--gold-500)" />
          <span>{todayStr}</span>
        </div>

        {/* Quick New Order */}
        {location.pathname !== '/orders/new' && (
          <Button
            variant="gold"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/orders/new')}
            className="topbar-new-order-btn"
          >
            New Order
          </Button>
        )}
      </div>
    </header>
  );
};
