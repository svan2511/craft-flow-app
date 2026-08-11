import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

import { formatRupees, todayLabel } from '@/lib/format';
import { orderStatusMeta, type Translator } from '@/lib/order-status';
import type { PeriodKey, ReportSummary } from '@/app/(tabs)/reports';

const PRIMARY = '#8A6D3B';
const SECONDARY = '#7A6A4F';
const INK = '#1C1B1A';
const MUTED = '#6B6B5E';
const LINE = '#E3DED2';
const POSITIVE = '#3E6B4F';
const WARNING = '#9A6A2F';

export type ReportWorkshop = {
  name: string;
  phone: string | null;
  city: string | null;
  address: string | null;
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReportPdfHtml(
  report: ReportSummary,
  period: PeriodKey,
  workshop: ReportWorkshop,
  t: Translator,
): string {
  const periodLabel = t(`reports.${period}`);
  const collection = report.collections[period];
  const outflow = report.karigar_outflow[period];
  const profit = report.profit[period];

  const collectionModes: { key: keyof ReportSummary['collections'][PeriodKey]['modes']; label: string }[] = [
    { key: 'cash', label: t('reports.cash') },
    { key: 'upi', label: t('reports.upi') },
    { key: 'online', label: t('reports.online') },
    { key: 'cheque', label: t('reports.cheque') },
  ];

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
  .title { text-align: center; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; margin: 18px 0 6px; }
  .subtitle { text-align: center; font-size: 12px; color: ${MUTED}; margin-bottom: 2px; }
  .meta { text-align: center; font-size: 12px; color: ${PRIMARY}; font-weight: 700; margin-bottom: 14px; }
  .section { margin: 16px 0; }
  .section-title {
    font-size: 12px;
    font-weight: 800;
    color: ${PRIMARY};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .box { border: 1px solid ${LINE}; border-radius: 12px; padding: 12px 14px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .row .k { color: ${MUTED}; }
  .row .v { font-weight: 700; }
  .hero-row { display: flex; justify-content: space-between; align-items: center; font-size: 16px; padding: 4px 0; }
  .hero-row .k { color: ${MUTED}; }
  .hero-row .v { font-weight: 800; color: ${PRIMARY}; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 4px; }
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
  .warn { color: ${WARNING}; font-weight: 700; }
  .grid { display: flex; gap: 8px; margin-top: 8px; }
  .mini {
    flex: 1;
    border: 1px solid ${LINE};
    border-radius: 10px;
    padding: 8px 10px;
    text-align: center;
  }
  .mini-label { font-size: 10.5px; color: ${MUTED}; }
  .mini-value { font-size: 14px; font-weight: 800; margin-top: 2px; }
  .balance { display: flex; justify-content: space-between; padding: 7px 0; font-size: 14px; }
  .balance .k { color: ${MUTED}; }
  .balance .v { font-weight: 800; }
  .footer {
    margin-top: 20px;
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
        <div class="brand-name">${esc(workshop.name || 'Craft Flow')}</div>
        ${workshop.phone ? `<div class="brand-sub">${t('pdf.phoneLabel', { phone: esc(workshop.phone) })}</div>` : ''}
        ${workshop.address
          ? `<div class="brand-address">${esc(workshop.address)}${workshop.city ? `, ${esc(workshop.city)}` : ''}</div>`
          : workshop.city
            ? `<div class="brand-address">${esc(workshop.city)}</div>`
            : ''}
      </div>
    </div>

    <div class="title">${t('pdf.workshopReport')}</div>
    <div class="subtitle">${t('pdf.reportSubtitle')}</div>
    <div class="meta">${t('pdf.period', { period: periodLabel, label: todayLabel() })}</div>

    <div class="section">
      <div class="section-title">${t('pdf.moneyIn')}</div>
      <div class="box">
        <div class="hero-row row">
          <span class="k">${t('pdf.collected', { period: periodLabel })}</span>
          <span class="v">${formatRupees(collection.total)}</span>
        </div>
        <div class="grid">
          <div class="mini"><div class="mini-label">${t('reports.advance')}</div><div class="mini-value">${formatRupees(collection.advance)}</div></div>
          <div class="mini"><div class="mini-label">${t('reports.milestone')}</div><div class="mini-value">${formatRupees(collection.milestone)}</div></div>
          <div class="mini"><div class="mini-label">${t('reports.balance')}</div><div class="mini-value">${formatRupees(collection.balance)}</div></div>
        </div>
        <table>
          <thead><tr><th>${t('pdf.paymentMode')}</th><th class="td-num">${t('pdf.amount')}</th></tr></thead>
          <tbody>
            ${collectionModes
              .map(
                (m) =>
                  `<tr><td>${esc(m.label)}</td><td class="td-num">${formatRupees(collection.modes[m.key])}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.moneyOut')}</div>
      <div class="box">
        <div class="hero row">
          <span class="k">${t('pdf.paidToWorkers', { period: periodLabel })}</span>
          <span class="v">${formatRupees(outflow.total)}</span>
        </div>
        <div class="grid">
          <div class="mini"><div class="mini-label">${t('reports.advances')}</div><div class="mini-value">${formatRupees(outflow.advance)}</div></div>
          <div class="mini"><div class="mini-label">${t('reports.settlements')}</div><div class="mini-value">${formatRupees(outflow.settlement)}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.balanceSheet')}</div>
      <div class="box">
        <div class="balance"><span class="k">${t('pdf.pendingFromCustomers')}</span><span class="v">${formatRupees(report.balance_sheet.customer_pending)}</span></div>
        <div class="balance"><span class="k">${t('pdf.ordersPendingCollection')}</span><span class="v">${report.balance_sheet.pending_orders}</span></div>
        <div class="balance"><span class="k">${t('pdf.pendingToKarigar')}</span><span class="v warn">${formatRupees(report.balance_sheet.karigar_pending)}</span></div>
        <div class="balance"><span class="k">${t('pdf.workshopPosition')}</span><span class="v" style="color:${(report.balance_sheet.net ?? 0) >= 0 ? '#3E6B4F' : '#B3463E'};">${formatRupees(report.balance_sheet.net)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.profitCostPeriod', { period: periodLabel })}</div>
      <div class="box">
        <div class="hero row">
          <span class="k">${t('pdf.orderValuation')}</span>
          <span class="v">${formatRupees(profit.revenue)}</span>
        </div>
        <div class="row"><span class="k">${t('pdf.materialCost')}</span><span class="v">${formatRupees(profit.material)}</span></div>
        <div class="row"><span class="k">${t('pdf.laborCost')}</span><span class="v">${formatRupees(profit.labor)}</span></div>
        <div class="row"><span class="k">${t('pdf.netProfit')}</span><span class="v" style="color:${(profit.net ?? 0) >= 0 ? POSITIVE : '#B3463E'};">${formatRupees(profit.net)}</span></div>
        <div class="row"><span class="k">${t('pdf.margin')}</span><span class="v">${profit.margin >= 0 ? '+' : ''}${profit.margin}%</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.ordersByStatus')}</div>
      <div class="box">
        <table>
          <thead><tr><th>${t('pdf.statusCol')}</th><th class="td-num">${t('pdf.countCol')}</th></tr></thead>
          <tbody>
            ${Object.entries(report.orders_by_status)
              .map(
                ([status, count]) =>
                  `<tr><td>${esc(orderStatusMeta(t, status).label)}</td><td class="td-num">${count}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.productionFunnelTitle')}</div>
      <div class="box">
        ${report.stage_funnel.length === 0
          ? `<div class="muted" style="font-size:12.5px;">${t('pdf.noFunnel')}</div>`
          : `<table>
              <thead><tr><th>${t('pdf.stageCol')}</th><th class="td-num">${t('pdf.pendingCol')}</th><th class="td-num">${t('pdf.inProgressCol')}</th><th class="td-num">${t('pdf.completedCol')}</th></tr></thead>
              <tbody>
                ${report.stage_funnel
                  .map(
                    (s) =>
                      `<tr><td>${esc(s.name)}</td><td class="td-num">${s.pending}</td><td class="td-num">${s.in_progress}</td><td class="td-num">${s.completed}</td></tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`}
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.revenueTrend')}</div>
      <div class="box">
        <table>
          <thead><tr><th>${t('pdf.monthCol')}</th><th class="td-num">${t('pdf.collectedCol')}</th></tr></thead>
          <tbody>
            ${report.monthly_revenue
              .map((m) => `<tr><td>${esc(m.label)}</td><td class="td-num">${formatRupees(m.revenue)}</td></tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.topCustomers')}</div>
      <div class="box">
        ${report.top_customers.length === 0
          ? `<div class="muted" style="font-size:12.5px;">${t('pdf.noPending')}</div>`
          : `<table>
              <thead><tr><th>${t('pdf.customerCol')}</th><th class="td-num">${t('pdf.activeOrdersCol')}</th><th class="td-num">${t('pdf.pendingColAmt')}</th></tr></thead>
              <tbody>
                ${report.top_customers
                  .map(
                    (c) =>
                      `<tr><td>${esc(c.name)}</td><td class="td-num">${c.orders}</td><td class="td-num warn">${formatRupees(c.pending)}</td></tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`}
      </div>
    </div>

    <div class="section">
      <div class="section-title">${t('pdf.karigarPayoutsDue')}</div>
      <div class="box">
        ${report.karigar_payouts.length === 0
          ? `<div class="muted" style="font-size:12.5px;">${t('pdf.noPayouts')}</div>`
          : `<table>
              <thead><tr><th>${t('pdf.karigarCol')}</th><th class="td-num">${t('pdf.paidCol')}</th><th class="td-num">${t('pdf.dueCol')}</th><th class="td-num">${t('pdf.pendingColAmt')}</th></tr></thead>
              <tbody>
                ${report.karigar_payouts
                  .map(
                    (k) =>
                      `<tr><td>${esc(k.name)}${k.role ? ` · ${esc(k.role)}` : ''}</td><td class="td-num">${formatRupees(k.paid)}</td><td class="td-num">${formatRupees(k.due)}</td><td class="td-num warn">${formatRupees(k.pending)}</td></tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`}
      </div>
    </div>

    <div class="footer">
      ${t('pdf.generatedBy')} • ${todayLabel()}
    </div>
    </div>
  </div>
</body>
</html>`;
}

export async function shareReportPdf(
  report: ReportSummary,
  period: PeriodKey,
  workshop: ReportWorkshop,
  t: Translator,
): Promise<void> {
  const { uri } = await Print.printToFileAsync({
    html: buildReportPdfHtml(report, period, workshop, t),
  });

  await shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: t('pdf.shareReportTitle'),
  });
}