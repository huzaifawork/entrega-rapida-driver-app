import { acceptDeliveryAndSyncOrder, updateDeliveryStatusAndSync } from '@shared/cross-app-sync.js';

export const webhook = async (data) => {
  return { success: true };
};

export const syncStatus = async (data) => {
  return { success: true };
};

export const transportAPI = async ({ action, data }) => {
  if (action === 'update_delivery_status') {
    await updateDeliveryStatusAndSync(data.deliveryId, data.status);
    return { success: true };
  }
  if (action === 'accept_delivery') {
    await acceptDeliveryAndSyncOrder(data.deliveryId, data.driverId, data.vehicleId);
    return { success: true };
  }
};

