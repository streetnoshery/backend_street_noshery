export enum CustomerOrderStatus {
    PLACED = 'PLACED',
    CONFIRMED = 'CONFIRMED',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    FAILED = "FAILED"
}

export enum PaymentStatus {
    INITIATED = "INITIATED",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}

export enum OREDER_STATUS_ID {
    placed = "orderPlaced",
    outForDelivery = "outForDelivery",
    delivered = "delivered"
}

export interface IOrderStatusFlags {
    [OREDER_STATUS_ID.placed]: STATUS_FLAGS,
    [OREDER_STATUS_ID.outForDelivery]: STATUS_FLAGS,
    [OREDER_STATUS_ID.delivered]: STATUS_FLAGS
}

export const orderTitle = {
    [OREDER_STATUS_ID.placed]: "Order placed",
    [OREDER_STATUS_ID.outForDelivery]: "Out for delivery",
    [OREDER_STATUS_ID.delivered]: "Delivered"
}

export enum STATUS_FLAGS {
    NOT_INITIATED = "NOT_INITIATED",
    IN_PROGRESS = "IN_PROGRESS",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}