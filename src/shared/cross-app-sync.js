import { Order, Delivery, syncOrderToDelivery, syncDeliveryToOrder } from './firebase-entities.js';

// MARKETPLACE: Create order and auto-create delivery
export const createOrderWithDelivery = async (orderData) => {
  const order = await Order.create({
    ...orderData,
    delivery_status: 'pending'
  });
  
  if (orderData.requires_delivery) {
    await syncOrderToDelivery(order.id, {
      ...orderData,
      order_id: order.id
    });
  }
  
  return order;
};

// DELIVERY APP: Accept delivery and update order
export const acceptDeliveryAndSyncOrder = async (deliveryId, driverId, vehicleId) => {
  await Delivery.update(deliveryId, {
    status: 'accepted',
    driver_id: driverId,
    vehicle_id: vehicleId
  });
  
  await syncDeliveryToOrder(deliveryId, 'accepted');
};

// DELIVERY APP: Update delivery status and sync to order
export const updateDeliveryStatusAndSync = async (deliveryId, status) => {
  await Delivery.update(deliveryId, { status });
  await syncDeliveryToOrder(deliveryId, status);
};

// MARKETPLACE: Listen to delivery updates for order
export const listenToDeliveryUpdates = (orderId, callback) => {
  return Delivery.onSnapshot({ order_id: orderId }, (deliveries) => {
    if (deliveries.length > 0) {
      callback(deliveries[0]);
    }
  });
};

// DELIVERY APP: Listen to available deliveries
export const listenToAvailableDeliveries = (callback) => {
  return Delivery.onSnapshot({ status: 'available' }, callback);
};
