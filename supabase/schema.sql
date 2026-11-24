-- ==============================================================================
-- WEDORA CHOCOLATE ORDER MANAGEMENT SYSTEM
-- PostgreSQL Database Schema & Row Level Security (RLS) for Supabase
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 2. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    address TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(full_name);

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    size TEXT NOT NULL,
    description TEXT,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    additional_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    total_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_paid >= 0),
    balance_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    customization_details TEXT,
    special_instructions TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Other')),
    payment_reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

-- ------------------------------------------------------------------------------
-- 7. ORDER STATUS HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);

-- ------------------------------------------------------------------------------
-- 8. DELIVERY HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    delivery_person TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_history_order ON public.delivery_history(order_id);

-- ------------------------------------------------------------------------------
-- 9. BUSINESS SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    business_name TEXT NOT NULL DEFAULT 'WEDORA Customized Chocolates',
    tagline TEXT DEFAULT 'Artisanal Luxury Handcrafted Chocolates',
    phone TEXT DEFAULT '+94 78 359 0222',
    whatsapp TEXT DEFAULT '+94 78 359 0222',
    email TEXT DEFAULT 'orders@wedora.lk',
    address TEXT DEFAULT 'No. 45, Flower Road, Colombo 07, Sri Lanka',
    currency_code TEXT NOT NULL DEFAULT 'LKR',
    currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    order_prefix TEXT NOT NULL DEFAULT 'WED-',
    invoice_terms TEXT DEFAULT 'Handcrafted chocolates must be stored at 18-20°C in a cool, dry place away from direct sunlight.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO public.business_settings (id, business_name, tagline, phone, whatsapp, email, address, currency_code, currency_symbol)
VALUES ('default', 'WEDORA Customized Chocolates', 'Artisanal Luxury Handcrafted Chocolates', '+94 78 359 0222', '+94 78 359 0222', 'orders@wedora.lk', 'No. 45, Flower Road, Colombo 07, Sri Lanka', 'LKR', 'Rs.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. DATABASE TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Function: Recalculate order payment totals and payment_status on payment modifications
CREATE OR REPLACE FUNCTION public.recalculate_order_payments()
RETURNS TRIGGER AS $$
DECLARE
    target_order_id UUID;
    v_total_amount NUMERIC(10,2);
    v_total_paid NUMERIC(10,2);
    v_balance NUMERIC(10,2);
    v_status TEXT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_order_id = OLD.order_id;
    ELSE
        target_order_id = NEW.order_id;
    END IF;

    SELECT total_amount INTO v_total_amount FROM public.orders WHERE id = target_order_id;
    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid FROM public.payments WHERE order_id = target_order_id;
    
    v_balance = GREATEST(0.00, v_total_amount - v_total_paid);

    IF v_total_paid >= v_total_amount AND v_total_amount > 0 THEN
        v_status = 'Paid';
    ELSIF v_total_paid > 0 THEN
        v_status = 'Partially Paid';
    ELSE
        v_status = 'Unpaid';
    END IF;

    UPDATE public.orders
    SET total_paid = v_total_paid,
        balance_due = v_balance,
        payment_status = v_status,
        updated_at = NOW()
    WHERE id = target_order_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_order_payments ON public.payments;
CREATE TRIGGER trg_recalculate_order_payments
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_payments();

-- ------------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can read active profiles; Users can update own profile; Only Admins can manage all profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- Customers: Viewable and manageable by authenticated staff
CREATE POLICY "Staff can view customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update customers" ON public.customers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete customers" ON public.customers
    FOR DELETE TO authenticated USING (public.is_admin());

-- Products: Everyone authenticated can view products; Only Admins can insert/update/delete products
CREATE POLICY "Staff can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated USING (public.is_admin());

-- Orders: Authenticated staff can view, create, and update orders
CREATE POLICY "Staff can view orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert orders" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update orders" ON public.orders
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE TO authenticated USING (public.is_admin());

-- Order Items: Inherit order access
CREATE POLICY "Staff can view order items" ON public.order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage order items" ON public.order_items
    FOR ALL TO authenticated USING (true);

-- Payments: Authenticated staff can view and insert payments; Admins can delete
CREATE POLICY "Staff can view payments" ON public.payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert payments" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage payments" ON public.payments
    FOR ALL TO authenticated USING (public.is_admin());

-- Status & Delivery History: Read and appendable by staff
CREATE POLICY "Staff can view status history" ON public.order_status_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can append status history" ON public.order_status_history
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can view delivery history" ON public.delivery_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can append delivery history" ON public.delivery_history
    FOR INSERT TO authenticated WITH CHECK (true);

-- Settings: Viewable by staff; Editable by Admins
CREATE POLICY "Staff can view settings" ON public.business_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update settings" ON public.business_settings
    FOR UPDATE TO authenticated USING (public.is_admin());
