import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'features';
export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_KEY, feature);
