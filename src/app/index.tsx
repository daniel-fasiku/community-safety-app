import { StyleSheet, View } from 'react-native';

import { JoinPanel } from '@/components/join-panel';
import { ThemedView } from '@/components/themed-view';
import { ZoneMap } from '@/components/zone-map';
import { ZONES } from '@/constants/zones';
import { useJoinFlow } from '@/hooks/use-join-flow';

export default function JoinZoneScreen() {
  const flow = useJoinFlow();
  const matchedZoneId = flow.outcome?.decision.zone?.id ?? null;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mapWrapper}>
        <ZoneMap
          zones={ZONES}
          userLocation={flow.userLocation}
          highlightedZoneId={matchedZoneId}
          style={styles.map}
        />
      </View>

      <JoinPanel flow={flow} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
