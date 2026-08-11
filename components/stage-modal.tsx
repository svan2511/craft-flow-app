import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { KarigarOption } from '@/components/karigar-assign-modal';
import { Icon } from '@/components/ui/icon';
import { Palette, Spacing, Type } from '@/constants/theme';
import { stageIcon, type ApiOrderStage, type ApiOrderStageStatus } from '@/lib/order-status';

const STAGE_STATUSES: { key: ApiOrderStageStatus; labelKey: string; hintKey: string }[] = [
  { key: 'pending', labelKey: 'status.pending', hintKey: 'stageModal.notStartedHint' },
  { key: 'in_progress', labelKey: 'status.inProgress', hintKey: 'stageModal.inProgressHint' },
  { key: 'completed', labelKey: 'status.completed', hintKey: 'stageModal.completedHint' },
];

export type StageFormData = {
  name: string;
  karigarId: number | null;
  laborCost: number;
  status: ApiOrderStageStatus;
};

export function StageModal({
  visible,
  title,
  lockedName,
  statusLocked = false,
  initial,
  karigars,
  submitLoading,
  onClose,
  onSubmit,
  onDelete,
}: {
  visible: boolean;
  title: string;
  lockedName: string | null;
  statusLocked?: boolean;
  initial: ApiOrderStage | null;
  karigars: KarigarOption[];
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (data: StageFormData) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [karigarId, setKarigarId] = useState<number | null>(null);
  const [karigarOpen, setKarigarOpen] = useState(false);
  const [laborCost, setLaborCost] = useState('');
  const [status, setStatus] = useState<ApiOrderStageStatus>('pending');
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setKarigarId(initial?.karigar?.id ?? null);
      setKarigarOpen(false);
      setLaborCost(initial ? String(initial.labor_cost) : '');
      setStatus(initial?.status ?? 'pending');
      setStatusOpen(false);
    }
  }, [visible, initial]);

  const lockedStatus = statusLocked && status !== 'pending';

  const canSubmit =
    lockedName != null &&
    karigarId !== null &&
    !lockedStatus &&
    (laborCost.trim() === '' || Number.isFinite(parseFloat(laborCost))) &&
    parseFloat(laborCost || '0') >= 0;

  const pickKarigar = (id: number) => {
    setKarigarId(id);
    setKarigarOpen(false);
    const rate = karigars.find((k) => k.id === id)?.default_rate;
    if (rate != null) {
      setLaborCost(String(rate));
    } else {
      setLaborCost('');
    }
  };

  const pickStatus = (key: ApiOrderStageStatus) => {
    const disabled = statusLocked && key !== 'pending';
    if (disabled) {
      return;
    }
    setStatus(key);
    setStatusOpen(false);
  };

  const selectedKarigar = karigars.find((k) => k.id === karigarId) ?? null;
  const selectedStatus = STAGE_STATUSES.find((s) => s.key === status) ?? STAGE_STATUSES[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.headerAccent} />

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Icon name="engineering" size={22} color={Palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{t('stageModal.productionStageDetails')}</Text>
            </View>
          </View>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('stageModal.stage')}</Text>
              {lockedName ? (
                <View style={styles.lockedStage}>
                  <View style={styles.lockedStageIcon}>
                    <Icon name={stageIcon(lockedName)} size={18} color={Palette.primary} />
                  </View>
                  <View style={styles.lockedStageText}>
                    <Text style={styles.lockedStageName}>{lockedName}</Text>
                    <Text style={styles.lockedStageHint}>
                      {t('stageModal.nextStageHint')}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  {t('stageModal.allStagesAdded')}
                </Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('stageModal.karigar')}</Text>
              {karigars.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('stageModal.noKarigars')}
                </Text>
              ) : (
                <View>
                  <Pressable
                    onPress={() => setKarigarOpen((o) => !o)}
                    style={[
                      styles.pickerField,
                      karigarOpen && styles.pickerFieldOpen,
                    ]}>
                    <View style={styles.pickerIcon}>
                      <Icon
                        name={selectedKarigar ? 'person' : 'person_add'}
                        size={18}
                        color={Palette.primary}
                      />
                    </View>
                    <View style={styles.pickerInfo}>
                      <Text
                        style={
                          selectedKarigar ? styles.pickerName : styles.pickerPlaceholder
                        }>
                        {selectedKarigar ? selectedKarigar.name : t('stageModal.selectKarigar')}
                      </Text>
                      {selectedKarigar?.role ? (
                        <Text style={styles.pickerRole}>{selectedKarigar.role}</Text>
                      ) : null}
                    </View>
                    {selectedKarigar?.default_rate != null ? (
                      <Text style={styles.pickerRate}>₹{selectedKarigar.default_rate}</Text>
                    ) : null}
                    <Icon
                      name="arrow_drop_down"
                      size={22}
                      color={Palette.onSurfaceVariant}
                      style={karigarOpen && styles.pickerChevronOpen}
                    />
                  </Pressable>

                  {karigarOpen ? (
                    <View style={styles.pickerMenu}>
                      <ScrollView
                        style={styles.pickerList}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}>
                        {karigars.map((k) => {
                          const active = karigarId === k.id;
                          return (
                            <Pressable
                              key={k.id}
                              onPress={() => pickKarigar(k.id)}
                              style={[styles.pickerOption, active && styles.pickerOptionActive]}>
                              <View style={styles.optionAvatar}>
                                <Icon
                                  name={active ? 'check_circle' : 'person'}
                                  size={16}
                                  color={active ? Palette.primary : Palette.outline}
                                />
                              </View>
                              <View style={styles.optionInfo}>
                                <Text
                                  style={[
                                    styles.optionName,
                                    { color: active ? Palette.primary : Palette.onSurface },
                                  ]}>
                                  {k.name}
                                </Text>
                                {k.role ? (
                                  <Text style={styles.optionRole}>{k.role}</Text>
                                ) : null}
                              </View>
                              {k.default_rate != null ? (
                                <Text
                                  style={[
                                    styles.optionRate,
                                    { color: active ? Palette.primary : Palette.outline },
                                  ]}>
                                  ₹{k.default_rate}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {selectedKarigar ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('stageModal.laborCost')}</Text>
                <View style={styles.inputWrap}>
                  <Icon name="money" size={18} color={Palette.primary} />
                  <TextInput
                    style={styles.input}
                    value={laborCost}
                    onChangeText={(t) => setLaborCost(t.replace(/[^\d.]/g, ''))}
                    placeholder="0"
                    placeholderTextColor={Palette.outline}
                    keyboardType="decimal-pad"
                  />
                </View>
                {selectedKarigar.default_rate != null ? (
                  <Text style={styles.costHint}>
                    {laborCost === String(selectedKarigar.default_rate)
                      ? t('stageModal.usingRate', { name: selectedKarigar.name })
                      : t('stageModal.rate', {
                          name: selectedKarigar.name,
                          rate: selectedKarigar.default_rate,
                        })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('stageModal.status')}</Text>
              <View>
                <Pressable
                  onPress={() => setStatusOpen((o) => !o)}
                  style={[styles.pickerField, statusOpen && styles.pickerFieldOpen]}>
                  <View style={styles.pickerIcon}>
                    <Icon
                      name={status === 'pending' ? 'schedule' : status === 'in_progress' ? 'pending_actions' : 'check_circle'}
                      size={18}
                      color={Palette.primary}
                    />
                  </View>
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerName}>{t(selectedStatus.labelKey)}</Text>
                    <Text style={styles.pickerRole}>
                      {t(selectedStatus.hintKey)}
                    </Text>
                  </View>
                  <Icon
                    name="arrow_drop_down"
                    size={22}
                    color={Palette.onSurfaceVariant}
                    style={statusOpen && styles.pickerChevronOpen}
                  />
                </Pressable>

                {statusOpen ? (
                  <View style={styles.pickerMenu}>
                    <View style={styles.pickerList}>
                      {STAGE_STATUSES.map((s) => {
                        const active = status === s.key;
                        const disabled = statusLocked && s.key !== 'pending';
                        return (
                          <Pressable
                            key={s.key}
                            disabled={disabled}
                            onPress={() => pickStatus(s.key)}
                            style={[
                              styles.pickerOption,
                              active && styles.pickerOptionActive,
                              disabled && styles.pickerOptionDisabled,
                            ]}>
                            <View style={styles.optionAvatar}>
                              <Icon
                                name={active ? 'check_circle' : s.key === 'pending' ? 'schedule' : s.key === 'in_progress' ? 'pending_actions' : 'check_circle'}
                                size={16}
                                color={active ? Palette.primary : Palette.outline}
                              />
                            </View>
                            <View style={styles.optionInfo}>
                              <Text
                                style={[
                                  styles.optionName,
                                  { color: active ? Palette.primary : Palette.onSurface },
                                ]}>
                                {t(s.labelKey)}
                              </Text>
                              <Text style={styles.optionRole}>
                                {t(s.hintKey)}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
              {statusLocked ? (
                <Text style={styles.lockedHint}>
                  {t('stageModal.lockedHint')}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            {initial ? (
              <Pressable
                style={[styles.cancelButton, styles.deleteButton]}
                onPress={onDelete}
                disabled={submitLoading}>
                <Icon name="delete" size={18} color={Palette.error} />
                <Text style={styles.deleteText}>{t('common.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitLoading}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, (!canSubmit || submitLoading) && styles.buttonDisabled]}
              onPress={() =>
                onSubmit({
                  name: lockedName ?? '',
                  karigarId,
                  laborCost: laborCost.trim() === '' ? 0 : parseFloat(laborCost),
                  status,
                })
              }
              disabled={!canSubmit || submitLoading}>
              <Text style={styles.submitText}>{submitLoading ? t('common.saving') : t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: 22,
    padding: 20,
    paddingTop: 0,
    gap: 14,
    borderWidth: 2,
    borderColor: Palette.primary,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    maxHeight: '88%',
  },
  headerAccent: {
    height: 6,
    marginHorizontal: -20,
    marginTop: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Palette.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Palette.primaryContainer,
    borderWidth: 2,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -2,
  },
  ornamentLine: {
    flex: 1,
    height: 2,
    backgroundColor: Palette.primaryContainer,
  },
  ornamentDiamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    backgroundColor: Palette.primary,
  },
  scroll: {
    flexGrow: 0,
  },
  label: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  lockedStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Palette.primaryContainer,
    backgroundColor: Palette.primaryContainer,
  },
  lockedStageIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedStageText: {
    flex: 1,
    gap: 2,
  },
  lockedStageName: {
    ...Type.bodyLg,
    color: Palette.onPrimaryContainer,
    fontFamily: 'Poppins_600SemiBold',
  },
  lockedStageHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    paddingVertical: 8,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 16,
    backgroundColor: Palette.surfaceContainerLow,
  },
  pickerFieldOpen: {
    borderColor: Palette.primary,
  },
  pickerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerInfo: {
    flex: 1,
    gap: 1,
  },
  pickerName: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  pickerPlaceholder: {
    ...Type.bodyMd,
    color: Palette.outline,
  },
  pickerRole: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  pickerRate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Palette.primary,
  },
  pickerChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  pickerMenu: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Palette.primaryContainer,
    backgroundColor: Palette.surfaceContainerLow,
    overflow: 'hidden',
  },
  pickerList: {
    maxHeight: 168,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pickerOptionActive: {
    backgroundColor: Palette.primaryContainer,
  },
  pickerOptionDisabled: {
    opacity: 0.4,
  },
  optionAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Palette.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 1,
  },
  optionName: {
    ...Type.bodyMd,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionRole: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  optionRate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  costHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    marginTop: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 16,
    backgroundColor: Palette.surfaceContainerLow,
  },
  input: {
    flex: 1,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  lockedHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  deleteButton: {
    flexDirection: 'row',
    gap: 6,
    borderColor: Palette.error,
    backgroundColor: Palette.surfaceContainerLowest,
  },
  deleteText: {
    ...Type.labelBold,
    color: Palette.error,
  },
  submitButton: {
    flex: 1,
    height: Spacing.touchTarget,
    backgroundColor: Palette.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
