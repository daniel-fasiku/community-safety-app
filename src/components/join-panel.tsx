import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { JoinFlow, JoinPhase } from '@/hooks/use-join-flow';

const PRIMARY = '#208AEF';
const APPROVED = '#16A34A';
const PENDING = '#D97706';

function buttonLabel(phase: JoinPhase): string {
  switch (phase) {
    case 'locating':
      return 'Checking your location…';
    case 'submitting':
      return 'Submitting request…';
    case 'done':
      return 'Check again';
    default:
      return 'Request to Join';
  }
}

/**
 * The bottom action panel: the primary "Request to Join" button plus the
 * approved / pending-review verdict once a request has run.
 */
export function JoinPanel({ flow }: { flow: JoinFlow }) {
  const insets = useSafeAreaInsets();
  const { phase, outcome, error, isBusy, requestToJoin } = flow;

  console.log('JoinPanel render', { phase, outcome, error, isBusy });
  
  const approved = outcome?.decision.status === 'approved';
  const matchedZone = outcome?.decision.zone;

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.panel, { paddingBottom: insets.bottom + Spacing.four }]}>

      {outcome ? (
        <View style={styles.result}>
          <View style={styles.badgeRow}>
            <View style={[styles.dot, { backgroundColor: approved ? APPROVED : PENDING }]} />
            <ThemedText type="smallBold" style={{ color: approved ? APPROVED : PENDING }}>
              {approved ? 'Approved' : 'Pending review'}
            </ThemedText>
          </View>

          <ThemedText type="subtitle">
            {approved ? `Welcome to ${matchedZone?.name}` : 'Flagged for manual review'}
          </ThemedText>

          <ThemedText themeColor="textSecondary">
            {approved
              ? 'Your location is inside this neighbourhood, so your request was approved automatically.'
              : "You're outside our mapped zones, so a community admin will review your request."}
          </ThemedText>

          {outcome.address ? (
            <ThemedText type="small" themeColor="textSecondary">
              Location: {outcome.address}
            </ThemedText>
          ) : outcome.decision.coordinates ? (
            <ThemedText type="small" themeColor="textSecondary">
              Location: {outcome.decision.coordinates.latitude.toFixed(5)},{' '}
              {outcome.decision.coordinates.longitude.toFixed(5)}
            </ThemedText>
          ) : null}
        </View>
      ) : (
        <View style={styles.intro}>
          <ThemedText type="subtitle">Join your neighbourhood</ThemedText>
          <ThemedText themeColor="textSecondary">
            Tap below and we&apos;ll check whether you&apos;re currently inside one of our community
            safety zones.
          </ThemedText>
        </View>
      )}

      {/** only show api related errors in dev builds */}
      {error && __DEV__ ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isBusy}
        onPress={requestToJoin}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: PRIMARY },
          (pressed || isBusy) && styles.buttonPressed,
        ]}>
        {isBusy ? <ActivityIndicator color="#ffffff" /> : null}
        <ThemedText style={[styles.buttonLabel, { color: '#ffffff' }]}>
          {buttonLabel(phase)}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  intro: {
    gap: Spacing.two,
  },
  result: {
    gap: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  error: {
    color: '#DC2626',
  },
  button: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
});
