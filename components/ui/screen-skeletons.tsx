import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonBlock, SkeletonCard, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <View style={styles.hero}>
        <SkeletonCircle size={48} />
        <SkeletonBlock width={140} height={16} style={styles.heroTitle} />
      </View>
      <SkeletonBlock width={200} height={14} />
      <View style={styles.metricGrid}>
        <SkeletonCard style={styles.metricCard}>
          <SkeletonCircle size={40} />
          <View style={styles.metricText}>
            <SkeletonText width={80} height={12} />
            <SkeletonText width={90} height={20} />
          </View>
        </SkeletonCard>
        <SkeletonCard style={styles.metricCard}>
          <SkeletonCircle size={40} />
          <View style={styles.metricText}>
            <SkeletonText width={90} height={12} />
            <SkeletonText width={100} height={20} />
          </View>
        </SkeletonCard>
        <SkeletonCard style={styles.metricCard}>
          <SkeletonCircle size={40} />
          <View style={styles.metricText}>
            <SkeletonText width={70} height={12} />
            <SkeletonText width={60} height={20} />
          </View>
        </SkeletonCard>
        <SkeletonCard style={styles.metricCard}>
          <SkeletonCircle size={40} />
          <View style={styles.metricText}>
            <SkeletonText width={90} height={12} />
            <SkeletonText width={100} height={20} />
          </View>
        </SkeletonCard>
      </View>
      <SkeletonBlock width={140} height={18} />
      <View style={styles.actionRow}>
        <SkeletonBlock height={48} radius={16} style={styles.actionCol} />
        <SkeletonBlock height={48} radius={16} style={styles.actionCol} />
        <SkeletonBlock height={48} radius={16} style={styles.actionCol} />
      </View>
      <SkeletonBlock width={170} height={18} />
      {[0, 1].map((i) => (
        <SkeletonCard key={i}>
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryText}>
              <SkeletonText width="70%" height={16} />
              <SkeletonText width="45%" height={12} />
            </View>
            <SkeletonBlock width={64} height={36} radius={999} />
          </View>
        </SkeletonCard>
      ))}
      </View>
    </Skeleton>
  );
}

export function JobCardsSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <SkeletonBlock height={52} radius={8} />
      <View style={styles.chipRow}>
        <SkeletonBlock width={72} height={44} radius={999} />
        <SkeletonBlock width={90} height={44} radius={999} />
        <SkeletonBlock width={104} height={44} radius={999} />
        <SkeletonBlock width={80} height={44} radius={999} />
      </View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i}>
          <SkeletonText width="65%" height={16} />
          <View style={styles.metaRow}>
            <SkeletonText width={100} height={12} />
            <SkeletonText width={80} height={12} />
          </View>
          <SkeletonText width="35%" height={20} />
        </SkeletonCard>
      ))}
      </View>
    </Skeleton>
  );
}

export function KarigarsSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <View style={styles.chipRow}>
        <SkeletonBlock width={80} height={40} radius={999} />
        <SkeletonBlock width={70} height={40} radius={999} />
      </View>
      <SkeletonCard>
        <View style={styles.avatarRow}>
          <SkeletonCircle size={56} />
          <View style={styles.metricText}>
            <SkeletonText width={110} height={16} />
            <SkeletonText width={70} height={12} />
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.metricText}>
            <SkeletonText width={80} height={12} />
            <SkeletonText width={70} height={20} />
          </View>
          <View style={styles.metricText}>
            <SkeletonText width={80} height={12} />
            <SkeletonText width={90} height={20} />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonText width={140} height={16} />
        <View style={styles.statRow}>
          <SkeletonBlock width="48%" height={54} radius={8} />
          <SkeletonBlock width="48%" height={54} radius={8} />
        </View>
      </SkeletonCard>
      <SkeletonBlock width={140} height={18} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.ledgerRow}>
          <SkeletonCircle size={40} />
          <View style={styles.deliveryText}>
            <SkeletonText width="55%" height={14} />
            <SkeletonText width="35%" height={12} />
          </View>
        </View>
      ))}
      </View>
    </Skeleton>
  );
}

export function CustomersSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <SkeletonBlock height={52} radius={8} />
      <View style={styles.chipRow}>
        <SkeletonBlock width={110} height={44} radius={999} />
        <SkeletonBlock width={150} height={44} radius={999} />
      </View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={styles.customerCard}>
          <View style={styles.customerLeft}>
            <SkeletonCircle size={44} />
            <View style={styles.metricText}>
              <SkeletonText width={120} height={14} />
              <SkeletonText width={90} height={12} />
            </View>
          </View>
          <SkeletonText width={64} height={16} />
        </SkeletonCard>
      ))}
      </View>
    </Skeleton>
  );
}

export function ProfileSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <View style={styles.hero}>
        <SkeletonCircle size={60} />
        <View style={styles.metricText}>
          <SkeletonText width={120} height={13} />
          <SkeletonText width={160} height={21} />
        </View>
      </View>
      <SkeletonCard>
        <SkeletonText width="40%" height={14} />
        <SkeletonBlock height={1} style={styles.divider} />
        <View style={styles.avatarRow}>
          <SkeletonCircle size={36} />
          <View style={styles.metricText}>
            <SkeletonText width={120} height={12} />
            <SkeletonText width={150} height={15} />
          </View>
        </View>
        <View style={styles.avatarRow}>
          <SkeletonCircle size={36} />
          <View style={styles.metricText}>
            <SkeletonText width={90} height={12} />
            <SkeletonText width={130} height={15} />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonBlock width="40%" height={14} />
        <SkeletonBlock style={styles.divider} height={1} />
        <View style={styles.avatarRow}>
          <SkeletonCircle size={36} />
          <View style={styles.metricText}>
            <SkeletonText width={90} height={12} />
            <SkeletonText width={140} height={15} />
          </View>
        </View>
        <View style={styles.avatarRow}>
          <SkeletonCircle size={36} />
          <View style={styles.metricText}>
            <SkeletonText width={80} height={12} />
            <SkeletonText width={120} height={15} />
          </View>
        </View>
      </SkeletonCard>
      <SkeletonBlock height={56} radius={16} />
      </View>
    </Skeleton>
  );
}

export function ReportsSkeleton() {
  return (
    <Skeleton>
      <View style={styles.gap}>
      <View>
        <SkeletonText width={180} height={20} />
        <SkeletonText width={220} height={13} />
      </View>
      <View style={styles.chipRow}>
        <SkeletonBlock height={40} radius={999} style={styles.periodCol} />
        <SkeletonBlock height={40} radius={999} style={styles.periodCol} />
        <SkeletonBlock height={40} radius={999} style={styles.periodCol} />
        <SkeletonBlock height={40} radius={999} style={styles.periodCol} />
      </View>
      <SkeletonCard>
        <SkeletonText width={90} height={16} />
        <SkeletonText width={160} height={28} />
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonText width={130} height={16} />
        <SkeletonText width={140} height={28} />
      </SkeletonCard>
      <View style={styles.miniRow}>
        <SkeletonBlock height={90} radius={8} style={styles.miniCol} />
        <SkeletonBlock height={90} radius={8} style={styles.miniCol} />
        <SkeletonBlock height={90} radius={8} style={styles.miniCol} />
      </View>
      <SkeletonCard>
        <SkeletonText width={170} height={16} />
        <View style={styles.barRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} height={70 + (i % 3) * 30} radius={8} style={styles.barCol} />
          ))}
        </View>
      </SkeletonCard>
      </View>
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 20,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
    width: '100%',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48.5%',
    height: 136,
  },
  metricText: {
    gap: 6,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCol: {
    flex: 1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deliveryText: {
    flex: 1,
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCol: {
    flex: 1,
  },
  periodCol: {
    flex: 1,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 140,
    marginTop: 20,
  },
  barCol: {
    flex: 1,
  },
});
