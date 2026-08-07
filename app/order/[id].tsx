import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import type { KarigarOption } from '@/components/karigar-assign-modal';
import { MaterialCostModal } from '@/components/material-cost-modal';
import { PaymentModal } from '@/components/payment-modal';
import { StageModal, type StageFormData } from '@/components/stage-modal';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatDate, formatRupees } from '@/lib/format';
import {
  STAGE_ORDER,
  nextStageName,
  stageIcon,
  stageStatusMeta,
  type ApiOrderDetail,
  type ApiOrderStage,
} from '@/lib/order-status';
import { shareOrderPdf } from '@/lib/share-order-pdf';
import { useFocusApi } from '@/lib/use-focus-api';

type StepperState = 'done' | 'active' | 'todo';

const GOLD = '#8A6D3B';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ApiOrderStage | null>(null);
  const [savingStage, setSavingStage] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const [galleryWidth, setGalleryWidth] = useState(screenWidth);
  const { showToast } = useToast();

  const { data, loading, error, reload } = useFocusApi(
    useCallback(
      () => apiRequest<{ order: ApiOrderDetail }>(`/orders/${id}`, { authenticated: true }),
      [id],
    ),
  );

  const { data: karigarsData } = useFocusApi(
    useCallback(
      () => apiRequest<{ karigars: KarigarOption[] }>('/karigars', { authenticated: true }),
      [],
    ),
  );

  const karigarOptions = karigarsData?.karigars ?? [];

  const order = data?.order;
  const designImagesList = order?.design_images?.length
    ? order.design_images
    : order?.design_image
      ? [order.design_image]
      : [];

  const nextStage = order ? nextStageName(order.stages) : null;

  const stageByName = (name: string) => (order?.stages ?? []).find((s) => s.name === name);

  const previousStageName = (name: string): string | null => {
    const index = STAGE_ORDER.indexOf(name);
    return index > 0 ? STAGE_ORDER[index - 1] : null;
  };

  const isStageUnlocked = (name: string): boolean => {
    const previous = previousStageName(name);
    if (!previous) {
      return true;
    }
    return stageByName(previous)?.status === 'completed';
  };

  const canAssignNext = nextStage !== null && isStageUnlocked(nextStage);

  const pipelineSteps: { id: string; label: string; icon: string; state: StepperState }[] = [
    { id: 'received', label: 'Received', icon: 'check', state: 'done' },
    ...STAGE_ORDER.map((name) => {
      const st = stageByName(name);
      const state: StepperState =
        st?.status === 'completed' ? 'done' : st?.status === 'in_progress' ? 'active' : 'todo';
      return {
        id: name,
        label: name.replaceAll('/', ' / '),
        icon: stageIcon(name),
        state,
      };
    }),
  ];

  let doneSegments = 0;
  let half = false;
  for (const name of STAGE_ORDER) {
    const st = stageByName(name);
    if (st?.status === 'completed') {
      doneSegments += 1;
    } else if (st?.status === 'in_progress' && !half) {
      doneSegments += 0.5;
      half = true;
    }
  }
  const pipelinePercent = Math.min((doneSegments / pipelineSteps.length) * 100, 100);

  const shareOrder = async () => {
    if (!order || sharing) {
      return;
    }
    setSharing(true);
    try {
      await shareOrderPdf(order);
    } catch {
      showToast('Could not generate the PDF. Please try again.', { variant: 'error' });
    } finally {
      setSharing(false);
    }
  };

  const openMaterial = () => setMaterialOpen(true);

  const closeMaterial = () => setMaterialOpen(false);

  const saveMaterial = async (cost: number | null) => {
    if (!order || savingCost) {
      return;
    }
    setSavingCost(true);
    try {
      await apiRequest<{ order: ApiOrderDetail }>(`/orders/${order.id}/costing`, {
        method: 'PATCH',
        body: { material_cost: cost },
        authenticated: true,
      });
      setMaterialOpen(false);
      showToast('Material cost updated.', { variant: 'success' });
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update material cost.', { variant: 'error' });
    } finally {
      setSavingCost(false);
    }
  };

  const openAddStage = () => {
    setEditingStage(null);
    setStageModalOpen(true);
  };

  const openEditStage = (stage: ApiOrderStage) => {
    setEditingStage(stage);
    setStageModalOpen(true);
  };

  const closeStageModal = () => {
    setStageModalOpen(false);
    setEditingStage(null);
  };

  const saveStage = async (data: StageFormData) => {
    if (!order || savingStage) {
      return;
    }
    setSavingStage(true);
    const isEdit = editingStage !== null;
    try {
      const path = isEdit
        ? `/orders/${order.id}/stages/${editingStage.id}`
        : `/orders/${order.id}/stages`;
      await apiRequest<{ order: ApiOrderDetail }>(path, {
        method: isEdit ? 'PATCH' : 'POST',
        body: {
          name: data.name,
          karigar_id: data.karigarId,
          labor_cost: data.laborCost,
          status: data.status,
        },
        authenticated: true,
      });
      closeStageModal();
      showToast(isEdit ? 'Stage updated.' : 'Stage added.', { variant: 'success' });
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save stage.', { variant: 'error' });
    } finally {
      setSavingStage(false);
    }
  };

  const deleteStage = async (stage: ApiOrderStage) => {
    if (!order || savingStage) {
      return;
    }
    setSavingStage(true);
    try {
      await apiRequest<{ order: ApiOrderDetail }>(`/orders/${order.id}/stages/${stage.id}`, {
        method: 'DELETE',
        authenticated: true,
      });
      closeStageModal();
      showToast('Stage removed.', { variant: 'success' });
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not remove stage.', { variant: 'error' });
    } finally {
      setSavingStage(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader
        title={order ? `Order #${order.order_no}` : `Order #${id}`}
        showLogo={false}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={Palette.primary} />
        }>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!order && !loading && !error ? (
          <Text style={styles.errorText}>Order not found.</Text>
        ) : null}

        {order ? (
          <>
            <View style={styles.productionCard}>
              <Text style={styles.cardTitle}>Production Status</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pipelineScroll}>
                <View style={styles.pipeline}>
                  <View style={styles.pipelineBase} />
                  <View style={[styles.pipelineActive, { width: `${pipelinePercent}%` }]} />
                  {pipelineSteps.map((step) => {
                    const done = step.state === 'done';
                    const active = step.state === 'active';
                    return (
                      <View key={step.id} style={styles.pipelineStep}>
                        <View
                          style={[
                            styles.stepCircle,
                            done
                              ? styles.stepCircleDone
                              : active
                                ? styles.stepCircleActive
                                : styles.stepCircleTodo,
                          ]}>
                          <Icon
                            name={done ? 'check' : step.icon}
                            size={18}
                            color={
                              done
                                ? Palette.onPrimary
                                : active
                                  ? GOLD
                                  : Palette.outline
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            { color: done || active ? GOLD : Palette.outline },
                          ]}
                          numberOfLines={2}>
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              {order.stages.length === 0 ? (
                <Text style={styles.stageEmptyText}>
                  Stage progress will appear here once work is assigned.
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.stageHeaderRow}>
                <Text style={styles.cardTitle}>Production Plan</Text>
                {canAssignNext ? (
                  <Pressable style={styles.addStageButton} onPress={openAddStage}>
                    <Icon name="add" size={16} color={Palette.onPrimary} />
                    <Text style={styles.addStageText}>Assign Work</Text>
                  </Pressable>
                ) : null}
              </View>

              {nextStage && !canAssignNext ? (
                <View style={styles.gateRow}>
                  <Icon name="lock" size={14} color={Palette.outline} />
                  <Text style={styles.gateText}>
                    {'Complete "' + previousStageName(nextStage) + '" first, then "' + nextStage + '" can be assigned.'}
                  </Text>
                </View>
              ) : null}

              {order.karigar ? (
                <View style={styles.leadRow}>
                  <Icon name="engineering" size={16} color={Palette.primary} />
                  <Text style={styles.leadText}>
                    Lead Karigar:{' '}
                    <Text style={styles.leadStrong}>{order.karigar.name}</Text>
                  </Text>
                </View>
              ) : null}

              <View style={styles.materialRow}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialLabel}>Material Cost</Text>
                  <Text style={styles.materialValue}>
                    {order.material_cost != null
                      ? formatRupees(order.material_cost)
                      : 'Not set'}
                  </Text>
                </View>
                <Pressable style={styles.materialEdit} onPress={openMaterial} hitSlop={8}>
                  <Icon name="edit" size={16} color={Palette.onPrimary} />
                  <Text style={styles.materialEditText}>Edit</Text>
                </Pressable>
              </View>

              <View style={styles.workDivider} />

              {order.stages.length === 0 ? (
                <Text style={styles.stageEmptyText}>
                  No work assigned yet. Select a karigar and assign a stage with its cost.
                </Text>
              ) : (
                <View style={styles.stageList}>
                  {order.stages.map((stage, index) => {
                    const meta = stageStatusMeta(stage.status);
                    const done = stage.status === 'completed';
                    const unlocked = isStageUnlocked(stage.name);
                    return (
                      <View key={stage.id} style={styles.stageRow}>
                        <Pressable
                          style={styles.stageMain}
                          onPress={() => (!done ? openEditStage(stage) : undefined)}
                          disabled={done}>
                          <View style={[styles.stageIndex, done && styles.stageIndexDone]}>
                            <Text
                              style={[
                                styles.stageIndexText,
                                { color: done ? Palette.onPrimary : Palette.primary },
                              ]}>
                              {index + 1}
                            </Text>
                          </View>
                          <View style={styles.stageInfo}>
                            <Text style={styles.stageName}>{stage.name}</Text>
                            <Text style={styles.stageKarigar}>
                              {stage.karigar ? stage.karigar.name : 'No karigar assigned'}
                            </Text>
                          </View>
                          <View style={styles.stageRight}>
                            <Text style={styles.stageCost}>{formatRupees(stage.labor_cost)}</Text>
                            <View style={[styles.stageBadge, { backgroundColor: meta.bg }]}>
                              <Text style={[styles.stageBadgeText, { color: meta.color }]}>
                                {meta.label}
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                        {!done && !unlocked ? (
                          <View style={styles.stageCompleteLocked} hitSlop={8}>
                            <Icon name="lock" size={18} color={Palette.outline} />
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
              {order.stages.length > 0 ? (
                <View style={styles.stageTotalRow}>
                  <Text style={styles.stageTotalLabel}>
                    Total Work Cost ({order.stages.length} stage
                    {order.stages.length > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.stageTotalValue}>{formatRupees(order.labor_cost)}</Text>
                </View>
              ) : null}
              {!nextStage ? (
                <Text style={styles.stageAllAssigned}>All stages have been assigned.</Text>
              ) : null}
            </View>

            {order.customer ? (
              <View style={styles.card}>
                <View style={styles.customerRow}>
                  <View style={styles.customerAvatar}>
                    <Icon name="person" size={32} color={Palette.primary} />
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{order.customer.name}</Text>
                    <View style={styles.phoneRow}>
                      <Icon name="phone" size={14} color={Palette.onSurfaceVariant} />
                      <Text style={styles.phoneText}>
                        {order.customer.phone ? `+91 ${order.customer.phone}` : 'No phone'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{order.item_name}</Text>
                <Text style={styles.dueText}>
                  Due: {order.delivery_date ? formatDate(order.delivery_date) : 'Not set'}
                </Text>
              </View>
              {designImagesList.length > 0 ? (
                <View style={styles.gallery}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
                    snapToInterval={galleryWidth}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
                      setGalleryIndex(Math.max(0, Math.min(index, designImagesList.length - 1)));
                    }}>
                    {designImagesList.map((img, index) => (
                      <Image
                        key={`${img}-${index}`}
                        source={{ uri: img }}
                        style={[styles.designImage, { width: galleryWidth }]}
                      />
                    ))}
                  </ScrollView>
                  {designImagesList.length > 1 ? (
                    <View style={styles.galleryCount}>
                      <Text style={styles.galleryCountText}>
                        {galleryIndex + 1}/{designImagesList.length}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {order.customization_notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>
                    <Text style={styles.notesStrong}>Customization Notes: </Text>
                    {order.customization_notes}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.metaText}>
                Order placed on {formatDate(order.created_at)}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.recordPayment}
                onPress={() => setPaymentOpen(true)}
                disabled={order.status === 'completed' && order.balance_due <= 0}>
                <Icon name="payments" size={18} color={Palette.onSecondary} />
                <Text style={styles.recordPaymentText}>Add Payment</Text>
              </Pressable>
              <Pressable
                style={[styles.recordPayment, styles.shareWhatsapp]}
                onPress={shareOrder}
                disabled={sharing}>
                <Icon name="chat" size={18} color={Palette.onPrimary} />
                <Text style={styles.shareWhatsappText}>
                  {sharing ? 'Preparing…' : 'WhatsApp Share'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={[styles.cardTitle, styles.financialTitle]}>Financials</Text>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Customer Price</Text>
                <Text style={styles.financialValueStrong}>{formatRupees(order.total_amount)}</Text>
              </View>
              {order.labor_paid > 0 ? (
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Labor Paid</Text>
                  <Text style={styles.financialCost}>- {formatRupees(order.labor_paid)}</Text>
                </View>
              ) : null}
              {order.material_cost != null ? (
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Material Cost</Text>
                  <Text style={styles.financialCost}>- {formatRupees(order.material_cost)}</Text>
                </View>
              ) : null}
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Advance Received</Text>
                <Text style={styles.financialValue}>{formatRupees(order.advance_paid)}</Text>
              </View>
              <View style={styles.profitBox}>
                <Text style={styles.profitLabel}>Balance Due</Text>
                <Text style={styles.profitValue}>{formatRupees(order.balance_due)}</Text>
              </View>
              <View
                style={[
                  styles.netProfitBox,
                  order.net_profit < 0 && styles.netProfitBoxNegative,
                ]}>
                <View>
                  <Text style={styles.netProfitLabel}>Net Profit</Text>
                  <Text style={styles.netProfitHint}>Price − material − labor paid</Text>
                </View>
                <Text
                  style={[
                    styles.netProfitValue,
                    { color: order.net_profit < 0 ? Palette.error : '#3E6B4F' },
                  ]}>
                  {order.net_profit >= 0 ? '+' : ''}
                  {formatRupees(order.net_profit)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Ledger</Text>
              <View style={styles.payments}>
                {order.payments.length === 0 ? (
                  <Text style={styles.paymentsEmpty}>No payments recorded yet.</Text>
                ) : (
                  order.payments.map((payment) => (
                    <View key={payment.id} style={styles.paymentRow}>
                      <View style={styles.paymentLeft}>
                        <View style={styles.paymentIconWrap}>
                          <Icon name="account_balance_wallet" size={16} color={Palette.primary} />
                        </View>
                        <View>
                          <Text style={styles.paymentLabel}>{payment.type_label}</Text>
                          <Text style={styles.paymentDate}>
                            {formatDate(payment.paid_at)} • {payment.mode}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.paymentAmount}>+ {formatRupees(payment.amount)}</Text>
                    </View>
                  ))
                )}
                <View style={styles.remainingRow}>
                  <Text style={styles.remainingLabel}>Remaining Balance</Text>
                  <Text style={styles.remainingValue}>{formatRupees(order.balance_due)}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {order ? (
        <PaymentModal
          visible={paymentOpen}
          orderId={order.id}
          suggestedAmount={order.balance_due}
          onClose={() => setPaymentOpen(false)}
          onSaved={reload}
        />
      ) : null}

      {order ? (
        <MaterialCostModal
          visible={materialOpen}
          initial={order.material_cost}
          submitLoading={savingCost}
          onClose={closeMaterial}
          onSubmit={saveMaterial}
        />
      ) : null}

      {order ? (
        <StageModal
          visible={stageModalOpen}
          title={editingStage ? 'Edit Work' : 'Assign Work'}
          lockedName={editingStage ? editingStage.name : nextStage}
          statusLocked={editingStage ? !isStageUnlocked(editingStage.name) : false}
          initial={editingStage}
          karigars={karigarOptions}
          submitLoading={savingStage}
          onClose={closeStageModal}
          onSubmit={saveStage}
          onDelete={() => {
            if (editingStage) {
              deleteStage(editingStage);
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.containerPadding,
    paddingBottom: 48,
    gap: Spacing.section,
  },
  card: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 16,
  },
  cardTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  pipelineScroll: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  pipeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    marginTop: 14,
  },
  pipelineBase: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 76,
    height: 4,
    backgroundColor: Palette.outlineVariant,
  },
  pipelineActive: {
    position: 'absolute',
    top: 14,
    left: 16,
    height: 4,
    backgroundColor: GOLD,
  },
  pipelineStep: {
    width: 96,
    alignItems: 'flex-start',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleDone: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  stepCircleActive: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderColor: GOLD,
  },
  stepCircleTodo: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderColor: Palette.outlineVariant,
  },
  stepLabel: {
    ...Type.labelBold,
    letterSpacing: 0.3,
    textAlign: 'left',
  },
  productionCard: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 16,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    backgroundColor: Palette.surfaceContainerLow,
  },
  gateText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    flexShrink: 1,
  },
  stageCompleteLocked: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  customerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 2,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flexShrink: 1,
  },
  customerName: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  leadText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  leadStrong: {
    color: Palette.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    backgroundColor: Palette.surfaceContainerLow,
  },
  materialInfo: {
    flex: 1,
    gap: 2,
  },
  materialLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  materialValue: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  materialEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
  },
  materialEditText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  workDivider: {
    height: 2,
    backgroundColor: Palette.outlineVariant,
    marginVertical: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  designImage: {
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceVariant,
  },
  gallery: {
    marginBottom: 16,
    position: 'relative',
  },
  galleryCount: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(28,27,26,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  galleryCountText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  itemTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    flexShrink: 1,
  },
  dueText: {
    ...Type.labelBold,
    color: Palette.secondary,
    letterSpacing: 0.4,
  },
  notesBox: {
    borderLeftWidth: 4,
    borderLeftColor: Palette.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: Palette.surfaceContainerLow,
    marginBottom: 16,
  },
  notesText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  notesStrong: {
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  metaText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  recordPayment: {
    width: 150,
    height: Spacing.touchTarget,
    backgroundColor: Palette.secondary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  recordPaymentText: {
    ...Type.labelBold,
    color: Palette.onSecondary,
    fontSize: 13,
    flexShrink: 1,
  },
  shareWhatsapp: {
    width: 175,
    backgroundColor: Palette.primary,
  },
  shareWhatsappText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
    fontSize: 13,
    flexShrink: 1,
  },
  financialTitle: {
    borderBottomWidth: 2,
    borderBottomColor: Palette.outlineVariant,
    paddingBottom: 8,
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Palette.outlineVariant,
    paddingBottom: 8,
    marginBottom: 16,
  },
  financialLabel: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  financialValueStrong: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  financialValue: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  financialCost: {
    ...Type.bodyLg,
    color: Palette.error,
  },
  profitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.tertiaryContainer,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 16,
  },
  netProfitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surfaceContainerLow,
    borderWidth: 2,
    borderColor: '#3E6B4F',
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 12,
  },
  netProfitBoxNegative: {
    borderColor: Palette.error,
  },
  netProfitLabel: {
    ...Type.labelBold,
    color: Palette.onSurface,
  },
  netProfitHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Palette.onSurfaceVariant,
    marginTop: 2,
  },
  netProfitValue: {
    ...Type.headlineLgMobile,
    fontFamily: 'Poppins_700Bold',
  },
  profitLabel: {
    ...Type.labelBold,
    color: Palette.onTertiaryContainer,
  },
  profitValue: {
    ...Type.headlineLgMobile,
    color: Palette.primary,
    fontFamily: 'Poppins_700Bold',
  },
  payments: {
    marginTop: 16,
    gap: 12,
  },
  paymentsEmpty: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 8,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    ...Type.labelBold,
    color: Palette.onSurface,
  },
  paymentDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Palette.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  paymentAmount: {
    ...Type.bodyMd,
    color: '#3E6B4F',
    fontFamily: 'Poppins_700Bold',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.outlineVariant,
    paddingTop: 12,
  },
  remainingLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  remainingValue: {
    ...Type.headlineMd,
    color: Palette.secondary,
    fontFamily: 'Poppins_700Bold',
  },
  errorText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addStageButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addStageText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  stageEmptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stageList: {
    gap: 10,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    padding: 8,
  },
  stageMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIndexDone: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  stageIndexText: {
    ...Type.labelBold,
  },
  stageInfo: {
    flex: 1,
    gap: 2,
  },
  stageName: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  stageKarigar: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  stageRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stageCost: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  stageBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
  stageTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.outlineVariant,
    paddingTop: 12,
    marginTop: 12,
  },
  stageTotalLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  stageTotalValue: {
    ...Type.headlineMd,
    color: Palette.secondary,
    fontFamily: 'Poppins_700Bold',
  },
  stageAllAssigned: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
  },
});
