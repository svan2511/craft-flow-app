import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const MAPPING: Record<string, MaterialIconName> = {
  dashboard: 'dashboard',
  inventory_2: 'inventory-2',
  payments: 'payments',
  factory: 'factory',
  support_agent: 'support-agent',
  settings: 'settings',
  assignment: 'assignment',
  account_balance_wallet: 'account-balance-wallet',
  money_off: 'money-off',
  trending_up: 'trending-up',
  add: 'add',
  receipt_long: 'receipt-long',
  warning: 'warning',
  person: 'person',
  person_add: 'person-add',
  construction: 'construction',
  groups: 'groups',
  analytics: 'analytics',
  search: 'search',
  engineering: 'engineering',
  phone: 'phone',
  call: 'call',
  chat: 'chat',
  add_photo_alternate: 'add-photo-alternate',
  upload_file: 'upload-file',
  download: 'download',
  picture_as_pdf: 'picture-as-pdf',
  table_view: 'table-view',
  calendar_month: 'calendar-month',
  arrow_drop_down: 'arrow-drop-down',
  savings: 'savings',
  handyman: 'handyman',
  pending_actions: 'pending-actions',
  chair: 'chair',
  table_restaurant: 'table-restaurant',
  bed: 'bed',
  insights: 'insights',
  arrow_forward: 'arrow-forward',
  check: 'check',
  local_shipping: 'local-shipping',
  list_alt: 'list-alt',
  remove: 'remove',
  delete: 'delete',
  check_circle: 'check-circle',
  info: 'info',
  language: 'language',
  chevron_right: 'chevron-right',
  translate: 'translate',
  star: 'star',
  arrow_back: 'arrow-back',
  arrow_right_alt: 'arrow-right-alt',
  money: 'money',
  work: 'work',
  store: 'store',
  schedule: 'schedule',
  verified_user: 'verified-user',
  edit: 'edit',
  logout: 'logout',
  error_outline: 'error-outline',
  help_outline: 'help-outline',
  call_made: 'call-made',
  call_received: 'call-received',
  attach_money: 'attach-money',
  point_of_sale: 'point-of-sale',
  calendar_today: 'calendar-today',
  account_balance: 'account-balance',
  bolt: 'bolt',
  security: 'security',
  auto_graph: 'auto-graph',
  workspace_premium: 'workspace-premium',
  lock: 'lock',
  place: 'place',
  home: 'home',
  notifications: 'notifications',
  brush: 'brush',
  format_paint: 'format-paint',
  account: 'account-circle',
};

export function Icon({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  if (name === 'whatsapp') {
    return <MaterialCommunityIcons name="whatsapp" size={size} color={color} style={style} />;
  }
  return <MaterialIcons name={MAPPING[name] ?? 'circle'} size={size} color={color} style={style} />;
}
