import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { prepareAndUploadImage } from '@/lib/image-upload';

type DesignImage = {
  localUri: string;
  url: string | null;
  uploading: boolean;
  error: string | null;
};

type CustomerSuggestion = {
  id: number;
  name: string;
  phone: string | null;
  total_orders: number;
};

function datePlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

function toDateInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const QUICK_DATES = [
  { label: '+7 days', days: 7 },
  { label: '+15 days', days: 15 },
  { label: '+30 days', days: 30 },
];

export default function NewOrderScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [matchedCustomers, setMatchedCustomers] = useState<CustomerSuggestion[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerSearched, setCustomerSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSuggestion | null>(null);
  const [itemName, setItemName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [designImages, setDesignImages] = useState<DesignImage[]>([]);
  const [notes, setNotes] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateDate = (value: string) => {
    setDeliveryDate(value);
  };

  useEffect(() => {
    if (selectedCustomer) {
      return;
    }
    if (customerPhone.length === 10) {
      setSearchingCustomer(true);
      setCustomerSearched(false);
      const timer = setTimeout(async () => {
        try {
          const res = await apiRequest<{ customers: CustomerSuggestion[] }>(
            `/customers/search?phone=${customerPhone}`,
            { authenticated: true },
          );
          setMatchedCustomers(res?.customers ?? []);
          setCustomerSearched(true);
        } catch {
          setMatchedCustomers([]);
          setCustomerSearched(true);
        } finally {
          setSearchingCustomer(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
    setMatchedCustomers([]);
    setCustomerSearched(false);
    setSearchingCustomer(false);
  }, [customerPhone, selectedCustomer]);

  const selectMatchedCustomer = (customer: CustomerSuggestion) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone ?? '');
    setMatchedCustomers([]);
    setCustomerSearched(false);
  };

  const resetCustomer = () => {
    setSelectedCustomer(null);
    setMatchedCustomers([]);
    setCustomerSearched(false);
  };

  const pickDesignImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library access is needed to attach design photos.', { variant: 'error' });
      return;
    }
    const remaining = Math.max(0, 10 - designImages.length);
    if (remaining === 0) {
      showToast('You can add up to 10 design photos.', { variant: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.6,
    });
    if (result.canceled) {
      return;
    }
    const picked = result.assets.filter((asset) => asset.uri);
    const added: DesignImage[] = picked.map((asset) => ({
      localUri: asset.uri,
      url: null,
      uploading: true,
      error: null,
    }));
    setDesignImages((prev) => [...prev, ...added].slice(0, 10));

    added.forEach(async (image) => {
      const index = designImages.length + added.indexOf(image);
      try {
        const url = await prepareAndUploadImage(image.localUri);
        setDesignImages((prev) =>
          prev.map((img, i) => (i === index ? { ...img, url, uploading: false } : img)),
        );
      } catch (e) {
        setDesignImages((prev) =>
          prev.map((img, i) =>
            i === index
              ? {
                  ...img,
                  uploading: false,
                  error: e instanceof Error ? e.message : 'Image upload failed.',
                }
              : img,
          ),
        );
      }
    });
  };

  const removeDesignImage = (index: number) => {
    setDesignImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (customerPhone.trim().length !== 10) {
      showToast('Customer phone number (10 digits) is required.', { variant: 'error' });
      return;
    }
    if (!customerName.trim()) {
      showToast('Customer name is required.', { variant: 'error' });
      return;
    }
    if (!itemName.trim()) {
      showToast('Item name is required.', { variant: 'error' });
      return;
    }
    const total = parseFloat(totalAmount);
    if (!Number.isFinite(total) || total <= 0) {
      showToast('Enter a valid total amount.', { variant: 'error' });
      return;
    }
    const advance = advancePaid.trim() === '' ? undefined : parseFloat(advancePaid);
    if (advance !== undefined && (!Number.isFinite(advance) || advance < 0)) {
      showToast('Advance paid must be a valid amount.', { variant: 'error' });
      return;
    }
    if (advance !== undefined && advance > total) {
      showToast('Advance paid cannot exceed the total amount.', { variant: 'error' });
      return;
    }

    if (designImages.some((img) => img.uploading)) {
      showToast('Some design photos are still uploading. Please wait a moment.', { variant: 'info' });
      return;
    }
    const failedUpload = designImages.find((img) => img.error !== null);
    if (failedUpload) {
      showToast(`A design photo failed to upload: ${failedUpload.error}. Please remove it and try again.`, {
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = designImages
        .filter((img) => img.url !== null)
        .map((img) => img.url as string);
      const res = await apiRequest<{ order: { id: number } }>('/orders', {
        method: 'POST',
        body: {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() === '' ? undefined : customerPhone.trim(),
          item_name: itemName.trim(),
          total_amount: total,
          advance_paid: advance,
          delivery_date: deliveryDate.trim() === '' ? undefined : deliveryDate.trim(),
          design_images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
          customization_notes: notes.trim() === '' ? undefined : notes.trim(),
          send_whatsapp: sendWhatsapp,
        },
        authenticated: true,
        timeout: 90000,
      });
      const orderId = res.order?.id;
      showToast('Order created.', { variant: 'success' });
      router.replace(
        orderId
          ? { pathname: '/order/[id]', params: { id: String(orderId) } }
          : '/(tabs)/job-cards',
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create order.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title="New Order" showLogo={false} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customer</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={(t) => {
                const digits = t.replace(/[^\d]/g, '').slice(0, 10);
                setCustomerPhone(digits);
                if (digits !== customerPhone) {
                  resetCustomer();
                }
              }}
              placeholder="10-digit mobile number"
              placeholderTextColor={Palette.outline}
              keyboardType="number-pad"
              editable={!selectedCustomer}
            />
            {customerPhone.length === 10 && searchingCustomer ? (
              <Text style={styles.customerHint}>Searching customer…</Text>
            ) : null}
          </View>

          {selectedCustomer ? (
            <View style={styles.matchedCard}>
              <View style={styles.matchedInfo}>
                <View style={styles.matchedAvatar}>
                  <Icon name="person" size={20} color={Palette.primary} />
                </View>
                <View style={styles.matchedText}>
                  <Text style={styles.matchedName}>{selectedCustomer.name}</Text>
                  <Text style={styles.matchedMeta}>
                    {selectedCustomer.total_orders > 0
                      ? `${selectedCustomer.total_orders} order(s)`
                      : 'New customer'}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.matchedRemove} onPress={resetCustomer} hitSlop={8}>
                <Icon name="close" size={18} color={Palette.onSurfaceVariant} />
              </Pressable>
            </View>
          ) : customerPhone.length === 10 && customerSearched ? (
            matchedCustomers.length > 0 ? (
              <View style={styles.suggestionList}>
                {matchedCustomers.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.suggestionRow}
                    onPress={() => selectMatchedCustomer(c)}>
                    <View style={styles.matchedAvatar}>
                      <Icon name="person" size={18} color={Palette.secondary} />
                    </View>
                    <View style={styles.matchedText}>
                      <Text style={styles.matchedName}>{c.name}</Text>
                      <Text style={styles.matchedMeta}>
                        {c.total_orders > 0 ? `${c.total_orders} order(s)` : 'New customer'}
                      </Text>
                    </View>
                    <Icon name="chevron_right" size={18} color={Palette.onSurfaceVariant} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.newCustomerNote}>
                <Icon name="person_add" size={16} color={Palette.primary} />
                <Text style={styles.newCustomerText}>No customer found — add a new one below.</Text>
              </View>
            )
          ) : null}

          {!selectedCustomer &&
          (customerPhone.length !== 10 || (customerSearched && matchedCustomers.length === 0)) ? (
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="e.g. Rajesh Sharma"
                placeholderTextColor={Palette.outline}
                autoCorrect={false}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Custom Dining Table"
              placeholderTextColor={Palette.outline}
              autoCorrect={false}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Design Photos (optional)</Text>
            <View style={styles.photoGrid}>
              {designImages.map((img, index) => (
                <View key={`${img.localUri}-${index}`} style={styles.photoTile}>
                  <Image source={{ uri: img.localUri }} style={styles.photoTileImg} />
                  {img.uploading ? (
                    <View style={styles.photoStatus}>
                      <Icon name="upload_file" size={14} color={Palette.onPrimary} />
                    </View>
                  ) : img.error ? (
                    <View style={[styles.photoStatus, styles.photoStatusError]}>
                      <Icon name="error_outline" size={14} color={Palette.onPrimary} />
                    </View>
                  ) : (
                    <View style={[styles.photoStatus, styles.photoStatusDone]}>
                      <Icon name="check" size={14} color={Palette.onPrimary} />
                    </View>
                  )}
                  <Pressable style={styles.photoRemove} onPress={() => removeDesignImage(index)} hitSlop={8}>
                    <Icon name="remove" size={14} color={Palette.onPrimary} />
                  </Pressable>
                </View>
              ))}
              {designImages.length < 10 ? (
                <Pressable style={styles.photoAddTile} onPress={pickDesignImages}>
                  <Icon name="add_photo_alternate" size={24} color={Palette.primary} />
                  <Text style={styles.photoAddText}>Add</Text>
                </Pressable>
              ) : null}
            </View>
            {designImages.length > 0 ? (
              <Text style={styles.photoHint}>{designImages.length} of 10 photos added</Text>
            ) : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Total Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={totalAmount}
              onChangeText={(t) => setTotalAmount(t.replace(/[^\d.]/g, ''))}
              placeholder="0"
              placeholderTextColor={Palette.outline}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Advance Paid (₹) — optional</Text>
            <TextInput
              style={styles.input}
              value={advancePaid}
              onChangeText={(t) => setAdvancePaid(t.replace(/[^\d.]/g, ''))}
              placeholder="0"
              placeholderTextColor={Palette.outline}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Delivery Date (optional)</Text>
            <View style={styles.dateInputRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={deliveryDate}
                onChangeText={validateDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Palette.outline}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Pressable style={styles.datePickerButton} onPress={() => setShowDatePicker(!showDatePicker)} hitSlop={8}>
                <Icon name="calendar_month" size={22} color={Palette.primary} />
              </Pressable>
            </View>

            {showDatePicker ? (
              <View style={Platform.OS === 'ios' ? styles.datePickerWrap : undefined}>
                <DateTimePicker
                  value={(() => {
                    const parsed = new Date(`${deliveryDate}T00:00:00`);
                    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
                  })()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                      if (event.type === 'set' && date) {
                        setDeliveryDate(toDateInput(date));
                      }
                    } else if (date) {
                      setDeliveryDate(toDateInput(date));
                    }
                  }}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable style={styles.datePickerDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View style={styles.quickDates}>
              {QUICK_DATES.map((q) => (
                <Pressable
                  key={q.days}
                  onPress={() => setDeliveryDate(datePlusDays(q.days))}
                  style={styles.quickDateChip}>
                  <Text style={styles.quickDateText}>{q.label}</Text>
                </Pressable>
              ))}
              {deliveryDate.trim() !== '' ? (
                <Pressable style={styles.quickDateChip} onPress={() => setDeliveryDate('')}>
                  <Text style={styles.quickDateText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Customization Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Dark walnut finish, bullnose edge…"
              placeholderTextColor={Palette.outline}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.label}>Send order confirmation on WhatsApp</Text>
              <Text style={styles.switchHint}>Customer phone required to send</Text>
            </View>
            <Switch
              value={sendWhatsapp}
              onValueChange={setSendWhatsapp}
              trackColor={{ false: Palette.outlineVariant, true: Palette.primary }}
              thumbColor={Palette.surfaceContainerLowest}
            />
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={submit}
          disabled={submitting}>
          <Icon name="add" size={22} color={Palette.onPrimary} />
          <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create Order'}</Text>
        </Pressable>
      </ScrollView>
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
  section: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionLabel: {
    ...Type.labelBold,
    color: Palette.primary,
  },
  field: {
    gap: 6,
  },
  label: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    backgroundColor: Palette.surfaceContainerLowest,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  textArea: {
    height: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Palette.surfaceContainerLow,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
  },
  photoTileImg: {
    width: '100%',
    height: '100%',
  },
  photoStatus: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(28,27,26,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStatusDone: {
    backgroundColor: Palette.secondary,
  },
  photoStatusError: {
    backgroundColor: Palette.error,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(28,27,26,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddTile: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.primary,
    backgroundColor: Palette.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    ...Type.labelBold,
    color: Palette.primary,
  },
  photoHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  quickDates: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
  },
  datePickerButton: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: Palette.primary,
    borderRadius: 14,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerWrap: {
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    backgroundColor: Palette.surfaceContainerLow,
    overflow: 'hidden',
  },
  datePickerDone: {
    height: Spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    borderTopWidth: 2,
    borderTopColor: Palette.outlineVariant,
  },
  datePickerDoneText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  quickDateChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateText: {
    ...Type.labelBold,
    fontSize: 12,
    color: Palette.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
    gap: 2,
  },
  switchHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  customerHint: {
    ...Type.bodyMd,
    color: Palette.primary,
    marginTop: 2,
  },
  matchedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: Palette.primary,
    borderRadius: 14,
    backgroundColor: Palette.primaryContainer,
    gap: 10,
  },
  matchedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  matchedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedText: {
    flexShrink: 1,
  },
  matchedName: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  matchedMeta: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  matchedRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceContainerLow,
  },
  suggestionList: {
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: Palette.surfaceContainerLowest,
  },
  newCustomerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Palette.surfaceContainerLow,
  },
  newCustomerText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    flexShrink: 1,
  },
  submitButton: {
    height: Spacing.touchTarget,
    backgroundColor: Palette.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  submitText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
