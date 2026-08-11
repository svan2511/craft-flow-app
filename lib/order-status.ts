import type { BadgeVariant } from '@/components/ui/status-badge';
import { Palette } from '@/constants/theme';

export type Translator = (key: string, params?: Record<string, unknown>) => string;

export type ApiOrderStatus = 'new' | 'in_structure' | 'in_polish' | 'ready' | 'completed';

export type ApiOrderStageStatus = 'pending' | 'in_progress' | 'completed';

export type ApiOrderStage = {
  id: number;
  name: string;
  status: ApiOrderStageStatus;
  status_label: string;
  labor_cost: number;
  completed_at: string | null;
  karigar: { id: number; name: string; role: string | null } | null;
};

export type StageStatusMeta = { label: string; color: string; bg: string };

export function stageStatusMeta(t: Translator, status: string): StageStatusMeta {
  switch (status) {
    case 'completed':
      return { label: t('status.done'), color: Palette.onTertiary, bg: Palette.tertiary };
    case 'in_progress':
      return { label: t('status.inProgress'), color: Palette.onPrimary, bg: Palette.primary };
    default:
      return { label: t('status.pending'), color: Palette.onSurfaceVariant, bg: Palette.surfaceContainerHigh };
  }
}

export const STAGE_ORDER = [
  'Structure/Cutting',
  'Carving',
  'Assembly',
  'Sanding/Polishing',
  'Fitting',
  'Packaging',
];

const STAGE_ICONS: Record<string, string> = {
  'Structure/Cutting': 'construction',
  Carving: 'brush',
  Assembly: 'handyman',
  'Sanding/Polishing': 'format_paint',
  Fitting: 'settings',
  Packaging: 'inventory_2',
};

export function stageIcon(name: string): string {
  return STAGE_ICONS[name] ?? 'work';
}

/** Next stage in the canonical order that is not yet assigned to the order. */
export function nextStageName(stages: { name: string }[]): string | null {
  for (const name of STAGE_ORDER) {
    if (!stages.some((s) => s.name === name)) {
      return name;
    }
  }
  return null;
}

export type StatusMeta = { variant: BadgeVariant; label: string };

export function orderStatusMeta(t: Translator, status: string): StatusMeta {
  switch (status as ApiOrderStatus) {
    case 'new':
      return { variant: 'new', label: t('status.new') };
    case 'in_structure':
      return { variant: 'inStructure', label: t('status.inStructure') };
    case 'in_polish':
      return { variant: 'inPolish', label: t('status.inPolish') };
    case 'ready':
      return { variant: 'ready', label: t('status.ready') };
    case 'completed':
      return { variant: 'completed', label: t('status.completed') };
    default:
      return { variant: 'new', label: t('status.new') };
  }
}

export function orderStatusIndex(status: string): number {
  const order: ApiOrderStatus[] = ['new', 'in_structure', 'in_polish', 'ready', 'completed'];
  return order.indexOf(status as ApiOrderStatus);
}

export function deliveryBadge(t: Translator, deliveryDate: string | null | undefined): StatusMeta | null {
  if (!deliveryDate) {
    return null;
  }
  const due = new Date(`${deliveryDate}T00:00:00`);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);

  if (days < 0) {
    return { variant: 'overdue', label: t('status.overdue') };
  }
  if (days <= 1) {
    return { variant: 'dueTomorrow', label: t('status.dueTomorrow') };
  }
  if (days <= 2) {
    return { variant: 'due48h', label: t('status.dueIn48h') };
  }
  return { variant: 'pending', label: t('status.dueInDays', { days }) };
}

export type ApiOrder = {
  id: number;
  order_no: string;
  item_name: string;
  status: ApiOrderStatus;
  progress: number;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  delivery_date: string | null;
  created_at: string;
  current_stage?: { name: string; status: ApiOrderStageStatus } | null;
  customer?: { id: number; name: string; phone: string | null } | null;
  karigar?: { id: number; name: string; role: string | null } | null;
};

export type ApiOrderDetail = ApiOrder & {
  status_label: string;
  customization_notes: string | null;
  design_image: string | null;
  design_images: string[] | null;
  worker_labor_cost: number | null;
  material_cost: number | null;
  labor_cost: number;
  labor_paid: number;
  stages: ApiOrderStage[];
  net_profit: number;
  amount_received: number;
  workshop?: { name: string | null; phone: string | null; address?: string | null; city?: string | null } | null;
  payments: {
    id: number;
    type: string;
    type_label: string;
    amount: number;
    mode: string | null;
    note: string | null;
    paid_at: string | null;
    order_id: number | null;
    karigar_id: number | null;
    created_at: string;
  }[];
};
