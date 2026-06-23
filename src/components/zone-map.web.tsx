import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ZoneMapProps } from '@/components/zone-map.types';
import { Spacing } from '@/constants/theme';

/**
 * `expo-maps` is native-only. On web we render a readable summary of the same
 * zones so the screen still works in a browser preview during development.
 */
export function ZoneMap({ zones, userLocation, highlightedZoneId, style }: ZoneMapProps) {
  return (
    <View style={[styles.container, style]}>
      <ThemedText type="subtitle">Neighbourhood zones</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.caption}>
        Interactive map is available on iOS and Android.
      </ThemedText>

      <View style={styles.list}>
        {zones.map((zone) => (
          <View key={zone.id} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: zone.color }]} />
            <View style={styles.rowText}>
              <ThemedText type="smallBold">
                {zone.name}
                {zone.id === highlightedZoneId ? '  •  matched' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {zone.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {userLocation ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.coords}>
          Your location: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  caption: {
    marginBottom: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: Spacing.one,
  },
  coords: {
    marginTop: Spacing.two,
  },
});
