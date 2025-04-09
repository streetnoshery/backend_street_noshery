import { Document, Schema } from "mongoose";
import { CustomerOrderStatus, PaymentStatus } from "src/order/enums/order.enum";


interface IOrderItem {
    dishName: string;
    description: string;
    price: string;
    rating: number;
    foodId: number;
}

export interface ICustomerOrderData extends Document {
    customerId: string;
    shopId: number;
    orderItems: IOrderItem[];
    orderTrackId: string;
    orderStatus: CustomerOrderStatus;
    orderPlacedAt: Date; // Will set before the amount txns
    isOrderPlaced: boolean;
    paymentStatus: PaymentStatus;
    isPaymentDone: boolean;
    paymentId: string;
    paymentAmount: string,
    orderConfirmedAt?: Date;
    isOrderConfirmed: boolean;
    orderOutForDeliveryAt?: Date;
    isOrderOutForDelivery: boolean;
    orderDeliveredAt?: Date;
    isOrderDelivered: boolean;
    orderCancelledAt?: Date;
    isorderCancelled: boolean;
    isOrderInProgress: boolean;
    orderFailedAt: Date;
    isOrderFailed: boolean;
    razorpayOrderId: string;
}

const OrderItemSchema = new Schema<IOrderItem>({
    dishName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    rating: { type: Number, required: true },
    foodId: { type: Number, required: true }
}, { _id: false });

export const customerOrderDataSchema = new Schema<ICustomerOrderData>({
    customerId: { type: String, required: true },
    shopId: { type: Number, required: true },
    orderItems: { type: [OrderItemSchema], required: true },
    orderTrackId: { type: String, required: true},
    orderStatus: { type: String, enum: Object.values(CustomerOrderStatus), required: true },
    orderPlacedAt: { type: Date, required: true },
    isOrderPlaced: {type: Boolean, default: false},
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), required: true },
    isPaymentDone: {type: Boolean, default: false},
    paymentId: {type: String},
    paymentAmount: {type: String},
    orderConfirmedAt: { type: Date },
    isOrderConfirmed: {type: Boolean, default: false},
    orderOutForDeliveryAt: { type: Date },
    isOrderOutForDelivery: {type: Boolean, default: false},
    orderDeliveredAt: { type: Date },
    isOrderDelivered: {type: Boolean, default: false},
    orderCancelledAt: { type: Date },
    isorderCancelled: {type: Boolean, default: false},
    isOrderInProgress: {type: Boolean, default: true},
    orderFailedAt: { type: Date },
    isOrderFailed: {type: Boolean, default: false},
    razorpayOrderId: {type: String}
}, { timestamps: true });


// Adding indexes to improve query performance for operations involving customerId and shopId
customerOrderDataSchema.index({ customerId: 1 });        // Index on customerId for faster queries
customerOrderDataSchema.index({ shopId: 1 });            // Index on shopId for faster queries
