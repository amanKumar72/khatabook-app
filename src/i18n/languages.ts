export type SupportedLanguage = 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
];

export const translations = {
  en: {
    // Navigation & Tabs
    tab_khata: 'Khata',
    tab_billbook: 'BillBook',
    tab_cashbook: 'Cashbook',
    tab_payments: 'Payments',
    tab_more: 'More',

    // Headers & Common
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    search: 'Search...',
    required: 'Required',
    optional: 'Optional',

    // Khata
    customers: 'Customers',
    suppliers: 'Suppliers',
    to_collect: 'You Will Get',
    to_pay: 'You Will Give',
    net_balance: 'Net Balance',
    all_settled: 'All dues settled',
    you_gave: 'YOU GAVE ₹',
    you_got: 'YOU GOT ₹',
    add_customer: 'Add Customer',
    add_supplier: 'Add Supplier',
    call: 'Call',
    whatsapp: 'WhatsApp',
    report: 'Report',
    edit_contact: 'Edit Contact',
    no_entries: 'No Entries Yet',
    no_entries_sub: 'Use the buttons below to record credit given or payment received.',

    // Add Customer
    customer_name: 'Customer Name',
    supplier_name: 'Supplier Name',
    phone_number: 'Phone Number',
    shop_address: 'Shop / Billing Address',
    credit_limit: 'Credit Limit',

    // Transaction
    amount: 'Amount (₹)',
    note_details: 'Note / Item Details',
    due_date: 'Payment Due Date',
    attach_receipt: 'Attach Bill / Receipt Photo',

    // BillBook
    create_invoice: 'Create Invoice',
    invoice_details: 'Invoice Details',
    gst_invoice: 'GST INVOICE',
    non_gst_bill: 'NON GST BILL',
    quotation: 'QUOTATION',
    customer_name_bill: 'Customer Name (Optional for cash sales)',
    payment_mode: 'Payment Mode',
    cash: 'CASH',
    upi: 'UPI',
    credit: 'CREDIT',
    bank: 'BANK',
    items_quantities: 'Items & Quantities',
    add_row: 'Add Row',
    from_stock: 'From Stock',
    item_name: 'Item name',
    qty: 'Qty',
    unit: 'Unit',
    rate: 'Rate (₹)',
    gst_pct: 'GST %',
    subtotal: 'Subtotal',
    discount: 'Discount (₹)',
    grand_total: 'Grand Total',
    save_generate: 'SAVE & GENERATE INVOICE',
    quick_bill: 'Quick Total Bill',
    quick_bill_hint: 'Direct amount without itemizing',
    incomplete_items: 'Incomplete Items',
    incomplete_items_msg: 'Please enter the item price/rate (e.g. ₹100).',

    // Cashbook
    cash_in_hand: "Today's Cash In Hand",
    cash_in: 'Cash In (+)',
    cash_out: 'Cash Out (-)',
    total_in: 'Total In',
    total_out: 'Total Out',

    // Payments
    qr_title: 'Your Payment QR Code',
    qr_sub: 'Scan with GPay, PhonePe, Paytm, or BHIM',
    enter_amount: 'Enter amount to collect',
    soundbox_title: 'Voice Soundbox',
    soundbox_sub: 'Instant voice confirmation announced when customers pay.',
    test_soundbox: 'Test Soundbox Voice',

    // More & Settings
    theme_setting: 'Theme Mode',
    theme_sub: 'Choose Light, Dark, or System theme',
    theme_light: 'Light Theme',
    theme_dark: 'Dark Theme',
    theme_system: 'System Default',
    security_lock: 'App Lock / Biometrics',
    backup_restore: 'Backup & Restore Hub',
    visiting_card: 'Digital Business Card',
    staff_payroll: 'Staff & Attendance',
  },
};

export type TranslationKey = keyof typeof translations.en;
