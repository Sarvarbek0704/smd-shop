import { DeliveryStatus } from '../../database/entities/enums';

const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.WAITING]: [DeliveryStatus.ASSIGNED],
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.FAILED],
  [DeliveryStatus.PICKED_UP]: [
    DeliveryStatus.ON_THE_WAY,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.ON_THE_WAY]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [DeliveryStatus.ASSIGNED], // qayta tayinlash mumkin
};

export function canDeliveryTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
): boolean {
  return transitions[from]?.includes(to) ?? false;
}
