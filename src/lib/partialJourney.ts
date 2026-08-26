import type { RouteStopResponse } from '@/types/api';
export interface PartialJourneySegment {
  distanceKm: number;
  durationMinutes: number | null;
}
function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}
export function computePartialJourney(
  boarding: RouteStopResponse,
  deboarding: RouteStopResponse,
): PartialJourneySegment | null {
  const [from, to] =
    boarding.sequenceNo <= deboarding.sequenceNo ? [boarding, deboarding] : [deboarding, boarding];
  if (from.sequenceNo === to.sequenceNo) return null;
  const distanceKm = from.distance != null && to.distance != null ? to.distance - from.distance : 0;
  const departureMinutes = parseTimeToMinutes(from.departureTime ?? from.arrivalTime);
  const arrivalMinutes = parseTimeToMinutes(to.arrivalTime ?? to.departureTime);
  let durationMinutes: number | null = null;
  if (departureMinutes != null && arrivalMinutes != null) {
    durationMinutes =
      (to.journeyDay - from.journeyDay) * 24 * 60 + (arrivalMinutes - departureMinutes);
    if (durationMinutes < 0) durationMinutes = null;
  }
  return { distanceKm, durationMinutes };
}
export function formatPartialDuration(minutes: number | null): string {
  if (minutes == null) return '--';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}
