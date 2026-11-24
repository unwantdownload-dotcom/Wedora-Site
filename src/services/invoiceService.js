import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatPhoneNumber } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import { WEDORA_LOGO_BASE64 } from '../assets/logoBase64';
import { SPECIAL_HANDLING_TEXT } from '../utils/invoiceConstants';

const renderSinhalaText = (text, widthMm) => {
  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(widthMm * 96 / 25.4 * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to render invoice storage instructions');

  const fontSize = 32;
  context.font = `${fontSize}px "Noto Sans Sinhala", "Iskoola Pota", "Nirmala UI", sans-serif`;
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > canvas.width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const lineHeight = Math.ceil(fontSize * 1.35);
  canvas.height = Math.max(lineHeight, lines.length * lineHeight);
  context.font = `${fontSize}px "Noto Sans Sinhala", "Iskoola Pota", "Nirmala UI", sans-serif`;
  context.fillStyle = '#64748B';
  context.textBaseline = 'top';
  lines.forEach((value, index) => context.fillText(value, 0, index * lineHeight));

  return {
    dataUrl: canvas.toDataURL('image/png'),
    heightMm: canvas.height * 25.4 / (96 * scale)
  };
};

/**
 * Generate luxury branded PDF invoice for Wedora Customized Chocolates
 * options: { isAdvanceInvoice?: boolean, advancePercentage?: number, advanceAmount?: number, bankDetails?: string }
 */
export const generateInvoicePDF = (order, customer, items = [], payments = [], settings = null, options = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const businessName = settings?.business_name || 'WEDORA CHOCOLATES';
  const tagline = settings?.tagline || 'Artisanal Luxury Handcrafted Chocolates';

  const isAdvanceInvoice = Boolean(options?.isAdvanceInvoice || options?.advanceAmount);
  const totalAmount = Number(order.total_amount) || 0;
  const totalPaid = Number(order.total_paid) || 0;
  const balanceDue = Number(order.balance_due) || 0;

  // Calculate Advance Due
  let advanceRequired = 0;
  if (options?.advanceAmount !== undefined && options?.advanceAmount !== null) {
    advanceRequired = Number(options.advanceAmount);
  } else if (options?.advancePercentage) {
    advanceRequired = Math.round((totalAmount * Number(options.advancePercentage)) / 100);
  } else {
    // Default 50% advance for custom artisanal orders
    advanceRequired = Math.round(totalAmount * 0.5);
  }

  // 1. Header Banner (Navy Blue)
  doc.setFillColor(13, 27, 42); // #0D1B2A
  doc.rect(0, 0, 210, 44, 'F');

  // Gold accent line
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 44, 210, 2, 'F');

  // Official Brand Logo (Rendered seamlessly on navy banner without white card)
  try {
    doc.addImage(WEDORA_LOGO_BASE64, 'PNG', 15, 6, 44, 32);
  } catch (err) {
    console.error('Failed to embed logo in PDF', err);
  }

  // Business Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.text('WEDORA', 63, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text('FINE ARTISANAL CHOCOLATE', 63, 25);

  // Invoice Title & Meta (Right Aligned)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(isAdvanceInvoice ? 'PROFORMA / ADVANCE INVOICE' : 'TAX INVOICE', 195, 18, { align: 'right' });

  const invoiceNumber = `${isAdvanceInvoice ? 'ADV-' : 'INV-'}${order.order_number?.replace('WED-', '') || order.id}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 220, 220);
  doc.text(`Invoice No: ${invoiceNumber}`, 195, 24, { align: 'right' });
  doc.text(`Order Ref: ${order.order_number || order.id}`, 195, 29, { align: 'right' });
  doc.text(`Date: ${formatDate(order.order_date)}`, 195, 34, { align: 'right' });

  // 2. Info Columns (Billed To vs Order Details)
  let yPos = 54;

  // Left Column: Customer Details
  doc.setTextColor(13, 27, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('CUSTOMER / BILLED TO:', 15, yPos);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(customer?.full_name || 'Walk-in Customer', 15, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${formatPhoneNumber(customer?.phone)}`, 15, yPos + 12);
  if (customer?.whatsapp) {
    doc.text(`WhatsApp: ${formatPhoneNumber(customer?.whatsapp)}`, 15, yPos + 17);
  }
  const addressLines = doc.splitTextToSize(`Address: ${customer?.address || 'Pickup at Wedora Studio'}`, 80);
  doc.text(addressLines, 15, yPos + 22);

  // Right Column: Order Dates & Status
  doc.setTextColor(13, 27, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ORDER SUMMARY:', 125, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Date:`, 125, yPos + 6);
  doc.text(formatDate(order.order_date), 195, yPos + 6, { align: 'right' });

  doc.text(`Delivery Date:`, 125, yPos + 12);
  doc.text(formatDate(order.delivery_date), 195, yPos + 12, { align: 'right' });

  doc.text(`Order Status:`, 125, yPos + 18);
  doc.text(order.status || 'New', 195, yPos + 18, { align: 'right' });

  doc.text(`Payment Status:`, 125, yPos + 24);
  doc.setFont('helvetica', 'bold');
  if (order.payment_status === 'Paid') {
    doc.setTextColor(5, 150, 105);
  } else if (order.payment_status === 'Partially Paid') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(order.payment_status || 'Unpaid', 195, yPos + 24, { align: 'right' });

  // 3. Products Table using autoTable
  const tableRows = items.map((item, index) => {
    let desc = item.product_name;
    if (item.size) desc += ` (${item.size})`;
    if (item.customization_details) desc += `\nCustom: ${item.customization_details}`;
    if (item.special_instructions) desc += `\nNote: ${item.special_instructions}`;

    return [
      index + 1,
      desc,
      item.quantity,
      formatCurrency(item.unit_price),
      formatCurrency(item.subtotal)
    ];
  });

  doc.autoTable({
    startY: yPos + 35,
    head: [['#', 'Chocolate Product & Customization', 'Qty', 'Unit Price', 'Subtotal']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [13, 27, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3.5
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8.5,
      cellPadding: 4,
      valign: 'top'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    }
  });

  // 4. Financial Calculations Box
  let finalY = doc.lastAutoTable.finalY + 8;

  // If near page bottom, add new page
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Left Note box
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(15, finalY, 100, 42, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(13, 27, 42);
  doc.text('SPECIAL HANDLING & STORAGE:', 20, finalY + 7);

  const handlingText = renderSinhalaText(SPECIAL_HANDLING_TEXT, 90);
  doc.addImage(handlingText.dataUrl, 'PNG', 20, finalY + 13, 90, handlingText.heightMm);

  // Right Totals column
  const totalsX = 135;
  const valuesX = 195;
  let rowY = finalY + 4;

  const printRow = (label, value, isBold = false, color = [71, 85, 105]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, totalsX, rowY);
    doc.text(value, valuesX, rowY, { align: 'right' });
    rowY += 6;
  };

  printRow('Items Subtotal:', formatCurrency(order.subtotal));

  if (Number(order.additional_charges) > 0) {
    printRow('Delivery / Packaging:', formatCurrency(order.additional_charges));
  }

  if (Number(order.discount) > 0) {
    printRow('Discount Applied:', `-${formatCurrency(order.discount)}`, false, [16, 185, 129]);
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX, rowY - 2, valuesX, rowY - 2);
  rowY += 2;

  printRow('Grand Total:', formatCurrency(order.total_amount), true, [13, 27, 42]);
  printRow('Total Payments Received:', formatCurrency(order.total_paid), false, [5, 150, 105]);

  // Balance Due
  const balanceColor = Number(order.balance_due) > 0 ? [220, 38, 38] : [5, 150, 105];
  printRow('Outstanding Balance:', formatCurrency(order.balance_due), true, balanceColor);

  // If this is an Advance / Deposit invoice or advance is specified
  if (isAdvanceInvoice || options?.showAdvanceRow) {
    rowY += 2;
    doc.setFillColor(254, 243, 199); // Soft gold / amber highlight
    doc.roundedRect(totalsX - 3, rowY - 1, (valuesX - totalsX) + 6, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.3);
    doc.roundedRect(totalsX - 3, rowY - 1, (valuesX - totalsX) + 6, 9, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9);
    doc.text('ADVANCE PAYABLE:', totalsX, rowY + 5);
    doc.text(formatCurrency(advanceRequired), valuesX, rowY + 5, { align: 'right' });
    rowY += 12;
  }

  // 5. Payment / Bank Transfer Instructions (only rendered if user explicitly provides bankDetails)
  if (options?.bankDetails && String(options.bankDetails).trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Transfer: ${options.bankDetails}`, 15, pageHeight - 21);
  }

  // 6. Footer Line & Business Name
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(15, pageHeight - 18, 195, pageHeight - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(businessName, 105, pageHeight - 12, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = (order, customer, items, payments, settings, options = {}) => {
  const doc = generateInvoicePDF(order, customer, items, payments, settings, options);
  const prefix = options?.isAdvanceInvoice ? 'Wedora_Advance_Invoice_' : 'Wedora_Invoice_';
  const fileName = `${prefix}${order.order_number || order.id}.pdf`;
  doc.save(fileName);
  return fileName;
};

export const printInvoicePDF = (order, customer, items, payments, settings, options = {}) => {
  const doc = generateInvoicePDF(order, customer, items, payments, settings, options);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
};

/**
 * Generate formatted WhatsApp invoice message with total, advance required, and order summary
 */
export const buildWhatsAppInvoiceMessage = (order, customer, settings, options = {}) => {
  const businessName = settings?.business_name || 'WEDORA CHOCOLATES';
  const customerName = customer?.full_name || 'Valued Customer';
  const orderNumber = order.order_number || order.id;
  const totalAmount = Number(order.total_amount) || 0;
  const totalPaid = Number(order.total_paid) || 0;
  const balanceDue = Number(order.balance_due) || 0;

  // Advance amount
  let advanceRequired = 0;
  if (options?.advanceAmount !== undefined && options?.advanceAmount !== null) {
    advanceRequired = Number(options.advanceAmount);
  } else if (options?.advancePercentage) {
    advanceRequired = Math.round((totalAmount * Number(options.advancePercentage)) / 100);
  } else {
    advanceRequired = Math.round(totalAmount * 0.5);
  }

  let msg = `🍫 *${businessName}* 🍫\n`;
  if (options?.isAdvanceInvoice) {
    msg += `*PROFORMA / ADVANCE INVOICE*\n\n`;
  } else {
    msg += `*ORDER INVOICE STATEMENT*\n\n`;
  }

  msg += `Dear *${customerName}*,\n`;
  msg += `Thank you for choosing Wedora Customized Chocolates!\n\n`;
  msg += `📋 *Order Number:* ${orderNumber}\n`;
  msg += `📅 *Order Date:* ${formatDate(order.order_date)}\n`;
  msg += `🚚 *Required Delivery:* ${formatDate(order.delivery_date)}\n`;
  msg += `📌 *Status:* ${order.status}\n\n`;

  msg += `*--- Financial Summary ---*\n`;
  msg += `💰 *Total Order Value:* ${formatCurrency(totalAmount)}\n`;
  if (totalPaid > 0) {
    msg += `✅ *Already Paid:* ${formatCurrency(totalPaid)}\n`;
    msg += `⏳ *Remaining Balance:* ${formatCurrency(balanceDue)}\n`;
  }

  if (options?.isAdvanceInvoice || advanceRequired > 0) {
    msg += `\n⭐️ *ADVANCE TO BE PAID:* *${formatCurrency(advanceRequired)}*\n`;
    msg += `_Please find your official invoice PDF attached._\n`;
  }

  // Only include bank details if user explicitly chose to add them
  if (options?.bankDetails && String(options.bankDetails).trim() !== '') {
    msg += `\n🏦 *Payment Details:*\n${options.bankDetails}\n`;
  }

  msg += `\nThank you! 🌸\nWeb: www.wedora.lk`;

  return msg;
};

/**
 * Share invoice as PDF via Web Share API (native file sharing to WhatsApp), or fallback to download PDF + open WhatsApp chat
 */
export const shareInvoicePDFToWhatsApp = async (order, customer, items, payments, settings, options = {}) => {
  const doc = generateInvoicePDF(order, customer, items, payments, settings, options);
  const prefix = options?.isAdvanceInvoice ? 'Wedora_Advance_Invoice_' : 'Wedora_Invoice_';
  const fileName = `${prefix}${order.order_number || order.id}.pdf`;
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const msg = buildWhatsAppInvoiceMessage(order, customer, settings, options);
  const phone = customer?.whatsapp || customer?.phone;

  // Check if browser supports Web Share API with files (Android, iOS, Chrome Mobile, macOS Safari, etc.)
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: fileName,
        text: msg
      });
      return { sharedDirectly: true, fileName };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed, falling back to download + WhatsApp', err);
      } else {
        return { sharedDirectly: false, cancelled: true };
      }
    }
  }

  // Fallback for Desktop browsers where direct file attachment to web.whatsapp.com URL is restricted:
  // 1. Download the PDF directly to device
  doc.save(fileName);

  // 2. Open WhatsApp chat with pre-filled message and instruction to attach
  const fullMsg = `${msg}\n\n📎 _(Invoice PDF has been generated and downloaded to attach here)_`;
  const waUrl = getWhatsAppUrl(phone, fullMsg);
  window.open(waUrl, '_blank');

  return { sharedDirectly: false, fileName };
};
