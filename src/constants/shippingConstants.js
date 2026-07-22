export const SHIPPING_COURIER = {
  POSTEX: 'POSTEX',
  OTHER: 'OTHER',
};

export const SHIPPING_BOOKING_STATUS = {
  NOT_BOOKED: 'NOT_BOOKED',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
};

export const SHIPPING_SHIPMENT_STATUS = {
  PENDING: 'PENDING',
  BOOKED: 'BOOKED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  RETURN_IN_TRANSIT: 'RETURN_IN_TRANSIT',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
};

export const POSTEX_TRACKING_URL = 'https://postex.pk/tracking';

export const SHIPPING_COURIER_OPTIONS = [
  { value: SHIPPING_COURIER.POSTEX, label: 'PostEx' },
  { value: SHIPPING_COURIER.OTHER, label: 'Other' },
];

export const SHIPPING_BOOKING_STATUS_OPTIONS = [
  { value: SHIPPING_BOOKING_STATUS.NOT_BOOKED, label: 'Not Booked' },
  { value: SHIPPING_BOOKING_STATUS.BOOKED, label: 'Booked' },
  { value: SHIPPING_BOOKING_STATUS.CANCELLED, label: 'Cancelled' },
];

export const SHIPPING_SHIPMENT_STATUS_OPTIONS = [
  { value: SHIPPING_SHIPMENT_STATUS.PENDING, label: 'Pending' },
  { value: SHIPPING_SHIPMENT_STATUS.BOOKED, label: 'Booked' },
  { value: SHIPPING_SHIPMENT_STATUS.PICKED_UP, label: 'Picked Up' },
  { value: SHIPPING_SHIPMENT_STATUS.IN_TRANSIT, label: 'In Transit' },
  { value: SHIPPING_SHIPMENT_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { value: SHIPPING_SHIPMENT_STATUS.DELIVERED, label: 'Delivered' },
  { value: SHIPPING_SHIPMENT_STATUS.DELIVERY_FAILED, label: 'Delivery Attempt Failed' },
  { value: SHIPPING_SHIPMENT_STATUS.RETURN_IN_TRANSIT, label: 'Returning to Sender' },
  { value: SHIPPING_SHIPMENT_STATUS.RETURNED, label: 'Returned' },
  { value: SHIPPING_SHIPMENT_STATUS.CANCELLED, label: 'Cancelled' },
];

export const SHIPPING_SHIPMENT_STATUS_LABELS = Object.fromEntries(
  SHIPPING_SHIPMENT_STATUS_OPTIONS.map((item) => [item.value, item.label])
);

export const getShippingFormDefaults = (order) => {
  const shipping = order?.shipping || {};

  return {
    courier: shipping.courier || SHIPPING_COURIER.POSTEX,
    courierName: shipping.courierName || (shipping.courier === SHIPPING_COURIER.POSTEX ? 'PostEx' : ''),
    trackingId: shipping.trackingId || order?.trackingNumber || '',
    trackingUrl:
      shipping.trackingUrl ||
      order?.trackingUrl ||
      (shipping.courier === SHIPPING_COURIER.OTHER ? '' : POSTEX_TRACKING_URL),
    bookingStatus: shipping.bookingStatus || SHIPPING_BOOKING_STATUS.NOT_BOOKED,
    shipmentStatus: shipping.shipmentStatus || SHIPPING_SHIPMENT_STATUS.PENDING,
    internalNote: shipping.internalNote || '',
  };
};
