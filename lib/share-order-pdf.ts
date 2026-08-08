import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

import { formatDate, formatRupees } from '@/lib/format';
import { orderStatusMeta, type ApiOrderDetail } from '@/lib/order-status';

const PRIMARY = '#8A6D3B';
const SECONDARY = '#7A6A4F';
const INK = '#1C1B1A';
const MUTED = '#6B6B5E';
const LINE = '#E3DED2';
const POSITIVE = '#3E6B4F';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Only money moving between the workshop owner and the customer belongs on a
// customer bill. Karigar transactions are internal accounting.
const CUSTOMER_PAYMENT_TYPES = new Set(['order_advance', 'order_milestone', 'order_balance']);

export function buildOrderReceiptHtml(order: ApiOrderDetail): string {
  const status = orderStatusMeta(order.status);
  const customerPayments = order.payments.filter((p) => CUSTOMER_PAYMENT_TYPES.has(p.type));
  const paymentsRows = customerPayments
    .map(
      (p) => `
        <tr>
          <td>${esc(p.type_label)}</td>
          <td>${formatDate(p.paid_at)}</td>
          <td class="td-num">${esc(p.mode ?? '—')}</td>
          <td class="td-num pos">${formatRupees(p.amount)}</td>
        </tr>`,
    )
    .join('');

  const designImages = order.design_images?.length
    ? order.design_images
    : order.design_image
      ? [order.design_image]
      : [];
  const imageBlock = designImages
    .slice(0, 4)
    .map(
      (img) =>
        `<img src="${img}" style="width:100%; max-height:240px; object-fit:contain; border-radius:14px; border:1px solid ${LINE};" />`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @page { margin: 18px; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    color: ${INK};
    margin: 0;
    padding: 0;
  }
  .watermark {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .watermark-row {
    position: absolute;
    left: -10%;
    width: 120%;
    text-align: center;
    font-size: 120px;
    font-weight: 800;
    letter-spacing: 6px;
    color: rgba(138, 109, 59, 0.05);
    transform: rotate(-30deg);
    white-space: nowrap;
  }
  .sheet { padding: 8px; }
  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid ${PRIMARY};
    padding-bottom: 12px;
  }
  .brand-name { font-size: 22px; font-weight: 800; color: ${PRIMARY}; }
  .brand-sub { font-size: 12px; color: ${MUTED}; margin-top: 2px; }
  .brand-address { font-size: 12px; color: ${MUTED}; margin-top: 2px; max-width: 380px; }
  .order-badge {
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    background: ${SECONDARY};
    padding: 6px 12px;
    border-radius: 999px;
  }
  .title {
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
    margin: 18px 0 6px;
  }
  .subtitle { text-align: center; font-size: 12px; color: ${MUTED}; margin-bottom: 16px; }
  .section { margin: 14px 0; }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    color: ${PRIMARY};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .box {
    border: 1px solid ${LINE};
    border-radius: 12px;
    padding: 12px 14px;
  }
  .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .row .k { color: ${MUTED}; }
  .row .v { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th {
    text-align: left;
    color: ${MUTED};
    font-weight: 600;
    border-bottom: 2px solid ${LINE};
    padding: 6px 4px;
  }
  td { border-bottom: 1px solid ${LINE}; padding: 7px 4px; }
  .td-num { text-align: right; }
  .pos { color: ${POSITIVE}; font-weight: 700; }
  .totals { margin-top: 8px; }
  .grand {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 800;
    color: ${PRIMARY};
    border-top: 2px solid ${PRIMARY};
    padding-top: 8px;
    margin-top: 6px;
  }
  .notes {
    background: #F5F0E6;
    border-left: 4px solid ${PRIMARY};
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12.5px;
    color: ${MUTED};
  }
  .footer {
    margin-top: 18px;
    text-align: center;
    font-size: 11px;
    color: ${MUTED};
    border-top: 1px solid ${LINE};
    padding-top: 10px;
  }
  .muted { color: ${MUTED}; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="watermark">
      <div class="watermark-row" style="top: 34%;">Craft Flow</div>
    </div>
    <div style="position: relative; z-index: 1;">
    <div class="brand">
      <div>
        <div class="brand-name">${esc(order.workshop?.name ?? 'Craft Flow')}</div>
        <div class="brand-sub">${order.workshop?.phone ? `Phone: +91 ${esc(order.workshop.phone)}` : ''}</div>
        ${order.workshop?.address
          ? `<div class="brand-address">${esc(order.workshop.address)}${order.workshop.city ? `, ${esc(order.workshop.city)}` : ''}</div>`
          : order.workshop?.city
            ? `<div class="brand-address">${esc(order.workshop.city)}</div>`
            : ''}
      </div>
      <div class="order-badge">#${esc(order.order_no)}</div>
    </div>

    <div class="title">ORDER RECEIPT</div>
    <div class="subtitle">${esc(status.label)} • ${formatDate(order.created_at)}</div>

    ${imageBlock ? `<div style="margin-bottom:12px;">${imageBlock}</div>` : ''}

    <div class="section">
      <div class="section-title">Customer</div>
      <div class="box">
        <div class="row"><span class="k">Name</span><span class="v">${esc(order.customer?.name ?? '—')}</span></div>
        <div class="row"><span class="k">Phone</span><span class="v">${order.customer?.phone ? `+91 ${esc(order.customer.phone)}` : '—'}</span></div>
        <div class="row"><span class="k">Item</span><span class="v">${esc(order.item_name)}</span></div>
        <div class="row"><span class="k">Delivery</span><span class="v">${order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payments</div>
      <div class="box">
        ${customerPayments.length === 0
          ? `<div class="muted" style="font-size:12.5px;">No payments recorded yet.</div>`
          : `<table>
              <thead><tr><th>Type</th><th>Date</th><th class="td-num">Mode</th><th class="td-num">Amount</th></tr></thead>
              <tbody>${paymentsRows}</tbody>
            </table>`}
        <div class="totals">
          <div class="row"><span class="k">Total Amount</span><span class="v">${formatRupees(order.total_amount)}</span></div>
          <div class="row"><span class="k">Amount Received</span><span class="v pos">${formatRupees(order.advance_paid)}</span></div>
          <div class="grand"><span>Balance Due</span><span>${formatRupees(order.balance_due)}</span></div>
        </div>
      </div>
    </div>

    ${order.customization_notes
      ? `<div class="section">
          <div class="section-title">Customization Notes</div>
          <div class="notes">${esc(order.customization_notes)}</div>
        </div>`
      : ''}

    <div class="footer">
      Thank you for your business!<br />
      Generated by Craft Flow
    </div>
    </div>
  </div>
</body>
</html>`;
}

export async function shareOrderPdf(order: ApiOrderDetail): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: buildOrderReceiptHtml(order),
  });

  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Share order #${order.order_no}`,
  });
}
