import { StyleProp, ViewStyle } from 'react-native';

import { Zone } from '@/constants/zones';
import { LatLng } from '@/lib/geo';

export type ZoneMapProps = {
  zones: Zone[];
  userLocation: LatLng | null;
  /** Zone to emphasise (the one the user matched), drawn with a thicker outline. */
  highlightedZoneId?: string | null;
  style?: StyleProp<ViewStyle>;
};
