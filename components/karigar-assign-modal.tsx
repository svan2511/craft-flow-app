import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette, Spacing, Type } from '@/constants/theme';

export type KarigarOption = {
  id: number;
  name: string;
  role: string | null;
  default_rate?: number | null;
  orders_count?: number;
};

export function KarigarAssignModal({
  visible,
  title,
  karigars,
  currentId,
  onClose,
  onSelect,
  onRemove,
  submitLoading = false,
}: {
  visible: boolean;
  title: string;
  karigars: KarigarOption[];
  currentId: number | null;
  onClose: () => void;
  onSelect: (karigarId: number) => void;
  onRemove: () => void;
  submitLoading?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <View style={styles.headerAccent} />

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Icon name="engineering" size={22} color={Palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Select a karigar for this order</Text>
            </View>
          </View>

          <View style={styles.ornamentRow}>
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {karigars.length === 0 ? (
              <Text style={styles.emptyText}>
                No karigars available. Add karigars first from the Karigars tab.
              </Text>
            ) : (
              karigars.map((karigar) => {
                const selected = karigar.id === currentId;
                return (
                  <Pressable
                    key={karigar.id}
                    style={[styles.item, selected && styles.itemSelected]}
                    onPress={() => onSelect(karigar.id)}
                    disabled={submitLoading}>
                    <View style={[styles.itemIcon, selected && styles.itemIconSelected]}>
                      <Icon
                        name={selected ? 'check_circle' : 'person'}
                        size={20}
                        color={selected ? Palette.onPrimary : Palette.primary}
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{karigar.name}</Text>
                      {karigar.role ? <Text style={styles.itemRole}>{karigar.role}</Text> : null}
                    </View>
                    {selected ? <Text style={styles.assignedText}>Assigned</Text> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitLoading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            {currentId !== null ? (
              <Pressable
                style={[styles.removeButton, submitLoading && styles.buttonDisabled]}
                onPress={onRemove}
                disabled={submitLoading}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
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
    maxHeight: '80%',
  },
  headerAccent: {
    height: 6,
    marginHorizontal: -20,
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
  list: {
    flexGrow: 0,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    paddingVertical: 16,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: {
    backgroundColor: Palette.primaryContainer,
    borderColor: Palette.primary,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
  },
  itemIconSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  itemRole: {
    ...Type.labelBold,
    color: Palette.outline,
  },
  assignedText: {
    ...Type.labelBold,
    color: Palette.primary,
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
  removeButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderWidth: 2,
    borderColor: Palette.error,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceContainerLowest,
  },
  removeText: {
    ...Type.labelBold,
    color: Palette.error,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
