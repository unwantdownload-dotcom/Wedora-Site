/**
 * Realistic seed data for Wedora Chocolate Order Management System
 * Currency: LKR (Rs.)
 * Timezone: Asia/Colombo
 */

export const initialEmployees = [
  {
    id: 'emp-001',
    full_name: 'Pramod (Admin)',
    email: 'admin@wedora.lk',
    phone: '+94 78 359 0222',
    role: 'admin',
    status: 'active',
    created_at: '2026-01-10T08:30:00Z'
  },
  {
    id: 'emp-002',
    full_name: 'Maneesha Fernando',
    email: 'maneesha@wedora.lk',
    phone: '+94 71 456 7890',
    role: 'employee',
    status: 'active',
    created_at: '2026-02-01T09:00:00Z'
  },
  {
    id: 'emp-003',
    full_name: 'Kasun Jayawardena',
    email: 'kasun@wedora.lk',
    phone: '+94 76 789 0123',
    role: 'employee',
    status: 'active',
    created_at: '2026-03-15T10:00:00Z'
  }
];

export const initialProducts = [
  {
    id: 'prd-a',
    product_code: 'A',
    name: 'Custom Chocolate Bar - Code A',
    category: 'Custom Wrappers',
    size: '12.5 cm × 5.5 cm',
    weight: '12 g',
    min_order: 50,
    description: 'Customized illustrated wrapper (12.5cm × 5.5cm, 12g). Ideal for Weddings, Birthdays, Graduations. Min order: 50 pcs.',
    unit_price: 85.00,
    is_active: true
  },
  {
    id: 'prd-a1',
    product_code: 'A1',
    name: 'Custom Chocolate Bar - Code A1',
    category: 'Custom Wrappers',
    size: '13.5 cm × 6 cm',
    weight: '25 g',
    min_order: 50,
    description: 'Customized illustrated wrapper (13.5cm × 6cm, 25g). Ideal for Wedding Favors & Corporate Gifts. Min order: 50 pcs.',
    unit_price: 125.00,
    is_active: true
  },
  {
    id: 'prd-c1',
    product_code: 'C1',
    name: 'Custom Chocolate Bar - Code C1',
    category: 'Custom Wrappers',
    size: '17 cm × 6.5 cm',
    weight: '45 g',
    min_order: 20,
    description: 'Customized illustrated wrapper (17cm × 6.5cm, 45g). Ideal for Celebrations & Special Keepsakes. Min order: 20 pcs.',
    unit_price: 165.00,
    is_active: true
  },
  {
    id: 'prd-d1',
    product_code: 'D1',
    name: 'Custom Chocolate Bar - Code D1 (Grand)',
    category: 'Custom Wrappers',
    size: '20.5 cm × 9 cm',
    weight: '85 g',
    min_order: 1,
    description: 'Customized large illustrated slab (20.5cm × 9cm, 85g). Premium personalized presentation bar.',
    unit_price: 700.00,
    is_active: true
  }
];

export const initialCustomers = [
  {
    id: 'cust-101',
    customer_code: 'CUST-1001',
    full_name: 'Dilini Senanayake',
    phone: '+94772345678',
    whatsapp: '+94772345678',
    address: 'No 18/4, Alfred House Gardens, Colombo 03',
    notes: 'VIP client. Always prefers dark chocolate variants and gold ribbon finishes.',
    created_at: '2026-09-12T10:00:00Z'
  },
  {
    id: 'cust-102',
    customer_code: 'CUST-1002',
    full_name: 'Kavinda Perera',
    phone: '+94718891234',
    whatsapp: '+94718891234',
    address: '452 Havelock Road, Colombo 06',
    notes: 'Corporate procurement for Millennium IT. Requires VAT-exempt official receipts.',
    created_at: '2026-10-04T11:30:00Z'
  },
  {
    id: 'cust-103',
    customer_code: 'CUST-1003',
    full_name: 'Dr. Ruwani Alwis',
    phone: '+94765549876',
    whatsapp: '+94765549876',
    address: '22/A, Kandy Road, Kiribathgoda',
    notes: 'Wedding reception chocolate favors coordinator. Strictly nut-free packaging.',
    created_at: '2026-10-18T14:15:00Z'
  },
  {
    id: 'cust-104',
    customer_code: 'CUST-1004',
    full_name: 'Sachith Wickramasinghe',
    phone: '+94703456789',
    whatsapp: '+94703456789',
    address: '78 Barnes Place, Colombo 07',
    notes: 'Regular anniversary client. Order updates via WhatsApp preferred.',
    created_at: '2026-11-01T09:40:00Z'
  },
  {
    id: 'cust-105',
    customer_code: 'CUST-1005',
    full_name: 'Ananya Jayawardena',
    phone: '+94776543210',
    whatsapp: '+94776543210',
    address: '15/2 Gregorys Road, Colombo 07',
    notes: 'High-end gift hampers for overseas family visits.',
    created_at: '2026-11-05T16:20:00Z'
  }
];

export const initialOrders = [
  {
    id: 'ord-101',
    order_number: 'WED-2026-1001',
    customer_id: 'cust-101',
    order_date: '2026-11-10',
    delivery_date: '2026-11-14',
    status: 'Delivered',
    payment_status: 'Paid',
    subtotal: 10250.00,
    additional_charges: 650.00, // Refrigerated Delivery
    discount: 500.00,
    total_amount: 10400.00,
    total_paid: 10400.00,
    balance_due: 0.00,
    notes: 'Anniversary gift box. Delivered safely with chiller pack.',
    created_by: 'emp-001',
    created_at: '2026-11-10T09:15:00Z'
  },
  {
    id: 'ord-102',
    order_number: 'WED-2026-1002',
    customer_id: 'cust-102',
    order_date: '2026-11-12',
    delivery_date: '2026-11-16', // Today
    status: 'Out for Delivery',
    payment_status: 'Paid',
    subtotal: 42500.00,
    additional_charges: 1500.00,
    discount: 2000.00,
    total_amount: 42000.00,
    total_paid: 42000.00,
    balance_due: 0.00,
    notes: 'Corporate gift hampers for board members. Call recipient before delivery.',
    created_by: 'emp-002',
    created_at: '2026-11-12T11:00:00Z'
  },
  {
    id: 'ord-103',
    order_number: 'WED-2026-1003',
    customer_id: 'cust-103',
    order_date: '2026-11-13',
    delivery_date: '2026-11-15', // Yesterday (Overdue if not delivered)
    status: 'Preparing',
    payment_status: 'Partially Paid',
    subtotal: 42500.00,
    additional_charges: 2000.00,
    discount: 1500.00,
    total_amount: 43000.00,
    total_paid: 20000.00,
    balance_due: 23000.00,
    notes: '50 Wedding favor keepsake boxes. Custom gold foil printing.',
    created_by: 'emp-002',
    created_at: '2026-11-13T14:30:00Z'
  },
  {
    id: 'ord-104',
    order_number: 'WED-2026-1004',
    customer_id: 'cust-104',
    order_date: '2026-11-14',
    delivery_date: '2026-11-18', // Upcoming
    status: 'Confirmed',
    payment_status: 'Partially Paid',
    subtotal: 12000.00,
    additional_charges: 500.00,
    discount: 0.00,
    total_amount: 12500.00,
    total_paid: 5000.00,
    balance_due: 7500.00,
    notes: 'Smash heart surprise + 12 bonbon box for wife birthday.',
    created_by: 'emp-001',
    created_at: '2026-11-14T10:10:00Z'
  },
  {
    id: 'ord-105',
    order_number: 'WED-2026-1005',
    customer_id: 'cust-105',
    order_date: '2026-11-15',
    delivery_date: '2026-11-20', // Upcoming
    status: 'New',
    payment_status: 'Unpaid',
    subtotal: 16500.00,
    additional_charges: 750.00,
    discount: 0.00,
    total_amount: 17250.00,
    total_paid: 0.00,
    balance_due: 17250.00,
    notes: 'Royal Hamper with custom congratulatory card message.',
    created_by: 'emp-002',
    created_at: '2026-11-15T15:45:00Z'
  },
  {
    id: 'ord-106',
    order_number: 'WED-2026-1006',
    customer_id: 'cust-101',
    order_date: '2026-11-16',
    delivery_date: '2026-11-19',
    status: 'Ready',
    payment_status: 'Paid',
    subtotal: 7800.00,
    additional_charges: 450.00,
    discount: 0.00,
    total_amount: 8250.00,
    total_paid: 8250.00,
    balance_due: 0.00,
    notes: 'Grand Truffle collection. Ready for pickup at Wedora Studio.',
    created_by: 'emp-001',
    created_at: '2026-11-16T08:20:00Z'
  }
];

export const initialOrderItems = [
  // Order 101 items
  {
    id: 'itm-001',
    order_id: 'ord-101',
    product_id: 'prd-102',
    product_name: 'Grand Truffle Collection (24 pcs)',
    size: 'Box of 24',
    quantity: 1,
    unit_price: 7800.00,
    subtotal: 7800.00,
    customization_details: 'Assorted roasted pistachio and salted caramel',
    special_instructions: 'Navy ribbon with gold wax seal'
  },
  {
    id: 'itm-002',
    order_id: 'ord-101',
    product_id: 'prd-108',
    product_name: 'Sugar-Free Dark Chocolate Almond Slab',
    size: '200g Slab',
    quantity: 1,
    unit_price: 2450.00,
    subtotal: 2450.00,
    customization_details: 'Extra roasted almonds',
    special_instructions: 'Handcrafted wrapper'
  },

  // Order 102 items
  {
    id: 'itm-003',
    order_id: 'ord-102',
    product_id: 'prd-105',
    product_name: 'Royal Celebration Chocolate Hamper',
    size: 'Grand Hamper',
    quantity: 2,
    unit_price: 16500.00,
    subtotal: 33000.00,
    customization_details: 'Includes personalized company greeting note',
    special_instructions: 'Millennium IT branding sticker on outer box'
  },
  {
    id: 'itm-004',
    order_id: 'ord-102',
    product_id: 'prd-106',
    product_name: 'Ruby & Dark Berry Blossom Bouquet',
    size: 'Standard Bouquet',
    quantity: 1,
    unit_price: 6500.00,
    subtotal: 6500.00,
    customization_details: 'Fresh strawberry ruby roses',
    special_instructions: 'Silk ribbon binding'
  },
  {
    id: 'itm-005',
    order_id: 'ord-102',
    product_id: 'prd-103',
    product_name: 'Custom Name Embossed Chocolate Bar',
    size: '150g Bar',
    quantity: 2,
    unit_price: 1500.00,
    subtotal: 3000.00,
    customization_details: 'Embossed text: "THANK YOU"',
    special_instructions: 'Gold luster dust finish'
  },

  // Order 103 items
  {
    id: 'itm-006',
    order_id: 'ord-103',
    product_id: 'prd-104',
    product_name: 'Wedding Favor Chocolate Keepsake (Twin)',
    size: 'Box of 2',
    quantity: 50,
    unit_price: 850.00,
    subtotal: 42500.00,
    customization_details: 'Initials embossed: "R & K" in calligraphy gold foil',
    special_instructions: 'All boxes strictly nut-free. Allergen sticker required.'
  },

  // Order 104 items
  {
    id: 'itm-007',
    order_id: 'ord-104',
    product_id: 'prd-107',
    product_name: 'Celebration Chocolate Smash Heart & Mallet',
    size: 'Standard',
    quantity: 1,
    unit_price: 5500.00,
    subtotal: 5500.00,
    customization_details: 'Ruby red velvet shell. Inside: mini truffles & custom love note',
    special_instructions: 'Include carved wooden mallet'
  },
  {
    id: 'itm-008',
    order_id: 'ord-104',
    product_id: 'prd-106',
    product_name: 'Ruby & Dark Berry Blossom Bouquet',
    size: 'Standard Bouquet',
    quantity: 1,
    unit_price: 6500.00,
    subtotal: 6500.00,
    customization_details: 'Happy Birthday message tag',
    special_instructions: 'Keep chilled until dispatch'
  },

  // Order 105 items
  {
    id: 'itm-009',
    order_id: 'ord-105',
    product_id: 'prd-105',
    product_name: 'Royal Celebration Chocolate Hamper',
    size: 'Grand Hamper',
    quantity: 1,
    unit_price: 16500.00,
    subtotal: 16500.00,
    customization_details: 'Custom golden congratulations card',
    special_instructions: 'Delivery to Colombo 07'
  },

  // Order 106 items
  {
    id: 'itm-010',
    order_id: 'ord-106',
    product_id: 'prd-102',
    product_name: 'Grand Truffle Collection (24 pcs)',
    size: 'Box of 24',
    quantity: 1,
    unit_price: 7800.00,
    subtotal: 7800.00,
    customization_details: 'Gold dusted dark truffles only',
    special_instructions: 'Customer pickup at studio'
  }
];

export const initialPayments = [
  {
    id: 'pay-001',
    payment_number: 'PAY-1001',
    order_id: 'ord-101',
    payment_date: '2026-11-10T09:20:00Z',
    amount: 5000.00,
    payment_method: 'Bank Transfer',
    payment_reference: 'HNB-FT-984210',
    notes: 'Advance payment via online banking',
    recorded_by: 'emp-001'
  },
  {
    id: 'pay-002',
    payment_number: 'PAY-1002',
    order_id: 'ord-101',
    payment_date: '2026-11-14T15:30:00Z',
    amount: 5400.00,
    payment_method: 'Cash',
    payment_reference: 'CSH-REC-892',
    notes: 'Settlement upon delivery',
    recorded_by: 'emp-001'
  },
  {
    id: 'pay-003',
    payment_number: 'PAY-1003',
    order_id: 'ord-102',
    payment_date: '2026-11-12T11:15:00Z',
    amount: 42000.00,
    payment_method: 'Bank Transfer',
    payment_reference: 'COM-BANK-CORP-4591',
    notes: 'Full corporate advance payment',
    recorded_by: 'emp-002'
  },
  {
    id: 'pay-004',
    payment_number: 'PAY-1004',
    order_id: 'ord-103',
    payment_date: '2026-11-13T15:00:00Z',
    amount: 20000.00,
    payment_method: 'Bank Transfer',
    payment_reference: 'BOC-TX-67123',
    notes: '50% advance for wedding favors',
    recorded_by: 'emp-002'
  },
  {
    id: 'pay-005',
    payment_number: 'PAY-1005',
    order_id: 'ord-104',
    payment_date: '2026-11-14T10:30:00Z',
    amount: 5000.00,
    payment_method: 'Cash',
    payment_reference: 'CSH-STUDIO-310',
    notes: 'Advance deposit at studio counter',
    recorded_by: 'emp-001'
  },
  {
    id: 'pay-006',
    payment_number: 'PAY-1006',
    order_id: 'ord-106',
    payment_date: '2026-11-16T08:30:00Z',
    amount: 8250.00,
    payment_method: 'Bank Transfer',
    payment_reference: 'HNB-FT-991204',
    notes: 'Full payment via HNB',
    recorded_by: 'emp-001'
  }
];

export const initialStatusHistory = [
  {
    id: 'sh-001',
    order_id: 'ord-101',
    previous_status: 'New',
    new_status: 'Confirmed',
    notes: 'Advance payment confirmed',
    changed_by: 'emp-001',
    changed_at: '2026-11-10T09:25:00Z'
  },
  {
    id: 'sh-002',
    order_id: 'ord-101',
    previous_status: 'Confirmed',
    new_status: 'Delivered',
    notes: 'Handed over to customer Dilini',
    changed_by: 'emp-001',
    changed_at: '2026-11-14T15:35:00Z'
  },
  {
    id: 'sh-003',
    order_id: 'ord-102',
    previous_status: 'Ready',
    new_status: 'Out for Delivery',
    notes: 'Dispatched with climate-controlled courier',
    changed_by: 'emp-002',
    changed_at: '2026-11-16T09:30:00Z'
  },
  {
    id: 'sh-004',
    order_id: 'ord-103',
    previous_status: 'Confirmed',
    new_status: 'Preparing',
    notes: 'Gold foil embossing underway in kitchen studio',
    changed_by: 'emp-002',
    changed_at: '2026-11-14T11:00:00Z'
  }
];

export const initialDeliveryHistory = [
  {
    id: 'del-001',
    order_id: 'ord-101',
    status: 'Delivered',
    notes: 'Delivered with cooling gel pack to Colombo 03',
    delivery_person: 'Nuwan (Wedora Express)',
    updated_by: 'emp-001',
    updated_at: '2026-11-14T15:35:00Z'
  },
  {
    id: 'del-002',
    order_id: 'ord-102',
    status: 'Out for Delivery',
    notes: 'In transit to Millennium IT, Havelock Road',
    delivery_person: 'Roshan (Wedora Express)',
    updated_by: 'emp-002',
    updated_at: '2026-11-16T09:30:00Z'
  }
];

export const initialBusinessSettings = {
  id: 'default',
  business_name: 'WEDORA Customized Chocolates',
  tagline: 'Artisanal Luxury Handcrafted Chocolates',
  phone: '+94 78 359 0222',
  whatsapp: '+94 78 359 0222',
  email: 'orders@wedora.lk',
  address: 'No. 45, Flower Road, Colombo 07, Sri Lanka',
  currency_code: 'LKR',
  currency_symbol: 'Rs.',
  invoice_prefix: 'INV-',
  order_prefix: 'WED-',
  invoice_terms: 'Handcrafted chocolates must be stored at 18-20°C in a cool, dry place away from direct sunlight.'
};

export const initialExpenses = [
  {
    id: 'exp-101',
    expense_number: 'EXP-1001',
    title: 'Belgian Couverture & Cocoa Butter 10kg',
    category: 'Ingredients & Raw Materials',
    amount: 38500.00,
    expense_date: '2026-11-10',
    payment_method: 'Bank Transfer',
    reference_number: 'BT-88921',
    vendor: 'Ceylon Cocoa Imports Ltd',
    notes: 'Premium 54% dark chocolate chips and refined cocoa butter',
    created_at: '2026-11-10T10:15:00Z'
  },
  {
    id: 'exp-102',
    expense_number: 'EXP-1002',
    title: 'Custom Gold Foil & Stamping Sheets',
    category: 'Packaging & Foils',
    amount: 14200.00,
    expense_date: '2026-11-12',
    payment_method: 'Cash',
    reference_number: 'CSH-042',
    vendor: 'PrintCraft Colombo',
    notes: '200 custom embossed gold foil sheets for wedding favors',
    created_at: '2026-11-12T14:30:00Z'
  },
  {
    id: 'exp-103',
    expense_number: 'EXP-1003',
    title: 'Thermal Insulation Bags & Gel Cooling Packs',
    category: 'Delivery & Logistics',
    amount: 8600.00,
    expense_date: '2026-11-13',
    payment_method: 'Card',
    reference_number: 'TXN-90214',
    vendor: 'PackCo Logistics',
    notes: '50 reusable cooling packs for islandwide courier safety',
    created_at: '2026-11-13T11:00:00Z'
  },
  {
    id: 'exp-104',
    expense_number: 'EXP-1004',
    title: 'Studio Kitchen Electricity & Climate Control',
    category: 'Utilities & Rent',
    amount: 22400.00,
    expense_date: '2026-11-14',
    payment_method: 'Bank Transfer',
    reference_number: 'CEB-99182',
    vendor: 'Ceylon Electricity Board',
    notes: 'Monthly 24/7 chocolate climate storage refrigeration',
    created_at: '2026-11-14T09:00:00Z'
  },
  {
    id: 'exp-105',
    expense_number: 'EXP-1005',
    title: 'Artisan Polycarbonate Chocolate Bar Molds (3x)',
    category: 'Equipment & Tools',
    amount: 11500.00,
    expense_date: '2026-11-15',
    payment_method: 'Card',
    reference_number: 'TXN-55102',
    vendor: 'BakerySupplies.lk',
    notes: 'Food-grade molds matching Code A and A1 dimensions',
    created_at: '2026-11-15T16:20:00Z'
  }
];
