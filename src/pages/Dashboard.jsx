import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService, orderService, expenseService } from '../services/dataService';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/Badge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { formatCurrency } from '../utils/formatters';
import { formatDate, getDeliveryRelativeLabel } from '../utils/dateUtils';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Calendar,
  ArrowRight,
  Flame,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
  Wallet,
  DollarSign,
  TrendingDown,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const STATUS_COLORS = {
  New: '#3B82F6',
  Confirmed: '#1E314B',
  Preparing: '#F59E0B',
  Ready: '#8B5CF6',
  'Out for Delivery': '#D4AF37',
  Delivered: '#10B981',
  Cancelled: '#EF4444'
};

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar State: Year & Month
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  const { refreshTrigger } = useData();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [m, a, ords, exps] = await Promise.all([
          reportService.getDashboardMetrics(),
          reportService.getSalesAnalytics('14days'),
          orderService.getAll(),
          isAdmin ? expenseService.getAll() : Promise.resolve([])
        ]);
        setMetrics(m);
        setAnalytics(a);
        setAllOrders(ords);
        setAllExpenses(exps);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [refreshTrigger, isAdmin]);

  if (loading || !metrics) {
    return <Spinner text="Loading Wedora dashboard..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* 1. Primary Operational Stats */}
      <div className="dashboard-grid">
        <StatCard
          label="Total Orders"
          value={metrics.total_orders}
          subtext="Lifetime client orders"
          icon={ShoppingBag}
          accent="navy"
          iconBg="var(--navy-100)"
          iconColor="var(--navy-900)"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          label="Today's Orders"
          value={metrics.today_orders}
          subtext="Placed in last 24h"
          icon={Calendar}
          accent="gold"
          iconBg="var(--gold-100)"
          iconColor="var(--gold-600)"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          label="In Preparation"
          value={metrics.preparing_orders}
          subtext="Artisans in kitchen"
          icon={Flame}
          accent="amber"
          iconBg="var(--status-warning-bg)"
          iconColor="#D97706"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          label="Completed Orders"
          value={metrics.completed_orders}
          subtext="Delivered successfully"
          icon={CheckCircle}
          accent="emerald"
          iconBg="var(--status-success-bg)"
          iconColor="#059669"
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* 2. Financial Performance Metrics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <StatCard
          label="Total Sales"
          value={formatCurrency(metrics.total_sales)}
          subtext="Gross confirmed orders"
          icon={TrendingUp}
          accent="gold"
          iconBg="var(--gold-100)"
          iconColor="var(--gold-600)"
          onClick={() => navigate('/reports')}
        />
        <StatCard
          label="Advance & Payments"
          value={formatCurrency(metrics.total_payments)}
          subtext="Actual cash & bank received"
          icon={CreditCard}
          accent="emerald"
          iconBg="var(--status-success-bg)"
          iconColor="#10B981"
          onClick={() => navigate('/payments')}
        />
        <StatCard
          label="Outstanding Balances"
          value={formatCurrency(metrics.outstanding_balances)}
          subtext="Receivable upon delivery"
          icon={AlertCircle}
          accent="rose"
          iconBg="var(--status-danger-bg)"
          iconColor="#EF4444"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          label="Upcoming Deliveries"
          value={metrics.upcoming_deliveries_count}
          subtext="Urgent & upcoming dispatches"
          icon={Truck}
          accent="navy"
          iconBg="var(--navy-100)"
          iconColor="var(--navy-900)"
          onClick={() => navigate('/deliveries')}
        />
      </div>

      {/* 3. Financial Health: Gross Profit & Operational Metrics */}
      {(() => {
        const totalSales = Number(metrics.total_sales || 0);
        const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const grossProfit = totalSales - totalExpenses;
        const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0;
        const isProfitable = grossProfit >= 0;

        // Current Month Calculations
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthSales = allOrders
          .filter(o => o.status !== 'Cancelled' && (o.order_date || '').startsWith(currentYearMonth))
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        const thisMonthExpenses = allExpenses
          .filter(e => (e.expense_date || '').startsWith(currentYearMonth))
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const thisMonthProfit = thisMonthSales - thisMonthExpenses;
        const thisMonthMargin = thisMonthSales > 0 ? ((thisMonthProfit / thisMonthSales) * 100).toFixed(1) : 0;

        return (
          <div className={`charts-grid ${isAdmin ? '' : 'charts-grid-single'}`}>
            {/* Gross Profit Summary Card */}
            {isAdmin && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Wallet size={20} style={{ color: 'var(--gold-600)' }} />
                    <span>Gross Profit & Financial Performance</span>
                  </div>
                }
                subtitle="Calculated Revenue minus Operating Expenses (Ingredients, Foils, Logistics, Utilities)"
                action={
                  <Button variant="secondary" size="sm" onClick={() => navigate('/expenses')}>
                    Manage Expenses
                  </Button>
                }
              />
              <CardBody style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* Lifetime Gross Profit */}
                  <div
                    style={{
                      padding: '1.1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1.5px solid ${isProfitable ? '#10B981' : '#EF4444'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: isProfitable ? '#065F46' : '#991B1B' }}>
                        Lifetime Gross Profit
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          backgroundColor: isProfitable ? '#10B981' : '#EF4444',
                          color: '#FFFFFF'
                        }}
                      >
                        {profitMargin}% margin
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isProfitable ? '#047857' : '#B91C1C' }}>
                      {formatCurrency(grossProfit)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      Sales: {formatCurrency(totalSales)} • Expenses: {formatCurrency(totalExpenses)}
                    </div>
                  </div>

                  {/* This Month's Gross Profit */}
                  <div
                    style={{
                      padding: '1.1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: thisMonthProfit >= 0 ? 'rgba(212, 175, 55, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1.5px solid ${thisMonthProfit >= 0 ? 'var(--gold-500)' : '#EF4444'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--navy-900)' }}>
                        This Month's Profit
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          backgroundColor: 'var(--navy-900)',
                          color: '#FFFFFF'
                        }}
                      >
                        {thisMonthMargin}% margin
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: thisMonthProfit >= 0 ? 'var(--navy-950)' : '#B91C1C' }}>
                      {formatCurrency(thisMonthProfit)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      Sales: {formatCurrency(thisMonthSales)} • Expenses: {formatCurrency(thisMonthExpenses)}
                    </div>
                  </div>
                </div>

                {/* Profit Breakdown Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <span>Financial Ratio Breakdown</span>
                    <span>Cost ratio: {totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div style={{ height: 10, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, profitMargin))}%`,
                        backgroundColor: '#10B981',
                        transition: 'width 0.5s ease'
                      }}
                      title={`Gross Profit: ${profitMargin}%`}
                    />
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, 100 - profitMargin))}%`,
                        backgroundColor: '#EF4444',
                        transition: 'width 0.5s ease'
                      }}
                      title={`Operating Cost: ${100 - profitMargin}%`}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.74rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#047857', fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
                      Net Profit Share ({profitMargin}%)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#B91C1C', fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                      Operational Expenses ({totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
            )}

        {/* Order Status Distribution */}
        <Card>
          <CardHeader
            title="Order Status Mix"
            subtitle="Current operational queue"
          />
          <CardBody>
            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.statusChart?.filter(s => s.value > 0) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(analytics?.statusChart || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#CBD5E1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D1B2A', borderRadius: 8, color: '#FFF', border: 'none', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              {(analytics?.statusChart || []).filter(s => s.value > 0).map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS[item.name] || '#94A3B8' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                  <span style={{ fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
      );
    })()}

      {/* 4. Tables: Recent Orders & Upcoming Deliveries */}
      <div className="dashboard-tables-grid">
        {/* Recent Orders */}
        <Card>
          <CardHeader
            title="Recent Orders"
            subtitle="Latest orders entered into the system"
            action={
              <Button variant="secondary" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/orders')}>
                View All
              </Button>
            }
          />
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent_orders.map((ord) => (
                  <tr
                    key={ord.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/orders/${ord.id}`)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.order_number}</td>
                    <td>{ord.customer?.full_name || 'Walk-in'}</td>
                    <td>{formatDate(ord.delivery_date)}</td>
                    <td><OrderStatusBadge status={ord.status} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(ord.total_amount)}</td>
                    <td style={{ textAlign: 'right', color: Number(ord.balance_due) > 0 ? '#DC2626' : '#059669', fontWeight: 600 }}>
                      {formatCurrency(ord.balance_due)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Urgent & Upcoming Deliveries */}
        <Card>
          <CardHeader
            title="Upcoming Deliveries"
            subtitle="Orders requiring dispatch"
            action={
              <Button variant="secondary" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/deliveries')}>
                Dispatch
              </Button>
            }
          />
          <CardBody style={{ padding: '0.85rem 1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metrics.urgent_deliveries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                  No urgent dispatches pending
                </p>
              ) : (
                metrics.urgent_deliveries.map((ord) => {
                  const isOverdue = new Date(ord.delivery_date) < new Date(new Date().toDateString()) && ord.status !== 'Delivered';
                  return (
                    <div
                      key={ord.id}
                      onClick={() => navigate(`/orders/${ord.id}`)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-hover)',
                        borderLeft: isOverdue ? '3px solid #EF4444' : '3px solid var(--gold-400)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--navy-900)' }}>
                          {ord.customer?.full_name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {ord.order_number} • {getDeliveryRelativeLabel(ord.delivery_date)}
                        </div>
                      </div>
                      <OrderStatusBadge status={ord.status} />
                    </div>
                  );
                })
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 5. Delivery Calendar (Completed vs To Complete Colors) */}
      {(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
        const totalDays = lastDayOfMonth.getDate();

        // Month navigation
        const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
        const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
        const currentMonthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const todayStr = new Date().toISOString().split('T')[0];

        // Group orders by delivery_date
        const deliveryMap = {};
        allOrders.forEach(ord => {
          if (!ord.delivery_date) return;
          if (!deliveryMap[ord.delivery_date]) {
            deliveryMap[ord.delivery_date] = [];
          }
          deliveryMap[ord.delivery_date].push(ord);
        });

        // Generate calendar grid cells
        const days = [];
        // Empty offset cells for previous month
        for (let i = 0; i < startDayIndex; i++) {
          days.push({ dayNumber: null, dateStr: null });
        }
        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          days.push({
            dayNumber: d,
            dateStr,
            isToday: dateStr === todayStr,
            orders: deliveryMap[dateStr] || []
          });
        }

        const selectedDayOrders = selectedCalendarDay ? (deliveryMap[selectedCalendarDay] || []) : [];

        return (
          <Card style={{ marginTop: '2rem' }}>
            <CardHeader
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Calendar size={20} style={{ color: 'var(--gold-600)' }} />
                  <span>Order Delivery Calendar</span>
                </div>
              }
              subtitle="Schedule of customer chocolate deliveries by date. Green indicates Completed orders; Gold indicates Active/Pending orders."
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <button
                      className="btn-icon"
                      onClick={prevMonth}
                      title="Previous Month"
                      style={{ width: 28, height: 28 }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', minWidth: 140, textAlign: 'center', color: 'var(--navy-900)' }}>
                      {currentMonthName}
                    </span>
                    <button
                      className="btn-icon"
                      onClick={nextMonth}
                      title="Next Month"
                      style={{ width: 28, height: 28 }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedCalendarDay(now.toISOString().split('T')[0]);
                    }}
                  >
                    Today
                  </Button>
                </div>
              }
            />
            <CardBody style={{ padding: '1rem 1.25rem' }}>
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem', marginBottom: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10B981', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#065F46' }}>Completed (Delivered)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#D4AF37', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#92400E' }}>To Complete (Active / In-Kitchen)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EF4444', display: 'inline-block' }} />
                  <span style={{ fontWeight: 600, color: '#991B1B' }}>Cancelled / Overdue</span>
                </div>
              </div>

              {/* Day of Week Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', marginBottom: '0.35rem' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => (
                  <div
                    key={dayName}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: idx >= 5 ? 'var(--gold-600)' : 'var(--text-secondary)',
                      padding: '0.35rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
                {days.map((item, index) => {
                  if (!item.dayNumber) {
                    return (
                      <div
                        key={`empty-${index}`}
                        style={{
                          minHeight: 85,
                          backgroundColor: 'rgba(241, 245, 249, 0.4)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px dashed rgba(226, 232, 240, 0.7)'
                        }}
                      />
                    );
                  }

                  const hasOrders = item.orders && item.orders.length > 0;
                  const isSelected = selectedCalendarDay === item.dateStr;

                  return (
                    <div
                      key={item.dateStr}
                      onClick={() => setSelectedCalendarDay(item.dateStr)}
                      style={{
                        minHeight: 88,
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected
                          ? 'var(--gold-100)'
                          : item.isToday
                          ? '#F8FAFC'
                          : 'var(--bg-surface)',
                        border: isSelected
                          ? '2px solid var(--gold-500)'
                          : item.isToday
                          ? '2px solid var(--navy-800)'
                          : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Day Number Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: item.isToday || isSelected ? 800 : 600,
                            color: item.isToday ? '#FFFFFF' : 'var(--navy-900)',
                            backgroundColor: item.isToday ? 'var(--navy-900)' : 'transparent',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.dayNumber}
                        </span>
                        {hasOrders && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {item.orders.length} {item.orders.length === 1 ? 'ord' : 'ords'}
                          </span>
                        )}
                      </div>

                      {/* Orders mini pills on calendar cell */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                        {item.orders.slice(0, 3).map((ord) => {
                          const isDelivered = ord.status === 'Delivered';
                          const isCancelled = ord.status === 'Cancelled';
                          const bgColor = isDelivered ? '#10B981' : isCancelled ? '#EF4444' : '#D4AF37';
                          const textColor = isDelivered ? '#FFFFFF' : isCancelled ? '#FFFFFF' : '#1E293B';

                          return (
                            <div
                              key={ord.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/orders/${ord.id}`);
                              }}
                              title={`${ord.order_number}: ${ord.customer?.full_name || 'Customer'} - ${ord.status} (Rs. ${ord.total_amount})`}
                              style={{
                                backgroundColor: bgColor,
                                color: textColor,
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.35rem',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                              }}
                            >
                              {isDelivered ? '✓ ' : '• '}{ord.customer?.full_name ? ord.customer.full_name.split(' ')[0] : ord.order_number}
                            </div>
                          );
                        })}
                        {item.orders.length > 3 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>
                            +{item.orders.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Details Panel */}
              {selectedCalendarDay && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={18} style={{ color: 'var(--gold-600)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                        Deliveries for {formatDate(selectedCalendarDay)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({selectedDayOrders.length} {selectedDayOrders.length === 1 ? 'order' : 'orders'} scheduled)
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => setSelectedCalendarDay(null)}
                    >
                      Close Day View
                    </button>
                  </div>

                  {selectedDayOrders.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                      No chocolate orders scheduled for delivery on this day.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      {selectedDayOrders.map((ord) => {
                        const isDelivered = ord.status === 'Delivered';
                        return (
                          <div
                            key={ord.id}
                            onClick={() => navigate(`/orders/${ord.id}`)}
                            style={{
                              padding: '0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#FFFFFF',
                              border: isDelivered ? '2px solid #10B981' : '2px solid var(--gold-400)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9rem' }}>
                                {ord.order_number}
                              </span>
                              <OrderStatusBadge status={ord.status} />
                            </div>

                            <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              {ord.customer?.full_name || 'Walk-in Customer'}
                            </div>

                            {ord.customer?.phone && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Tel: {ord.customer.phone}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--navy-950)' }}>
                                Total: {formatCurrency(ord.total_amount)}
                              </span>
                              <span style={{ color: isDelivered ? '#059669' : 'var(--gold-600)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Eye size={12} /> View Details
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        );
      })()}
    </div>
  );
};
