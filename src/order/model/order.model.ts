import { Document, Schema } from "mongoose";
import { CustomerOrderStatus } from "src/order/enums/order.enum";


interface IOrderItem {
    dishName: string;
    description: string;
    price: string;
    rating: number;
    foodId: number;
}

export interface ICustomerOrderData extends Document {
    customerId: string;
    shopId: string;
    orderItems: IOrderItem[];
    orderTrackId: string;
    orderStatus: CustomerOrderStatus;
    orderPlacedAt: Date; // Will set before the amount txns
    orderConfirmedAt?: Date;
    orderOutForDeliveryAt?: Date;
    orderDeliveredAt?: Date;
    orderCancelledAt?: Date;
    isOrderInProgress: boolean;
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
    shopId: { type: String, required: true },
    orderItems: { type: [OrderItemSchema], required: true },
    orderTrackId: { type: String, required: true, unique: true },
    orderStatus: { type: String, enum: Object.values(CustomerOrderStatus), required: true },
    orderPlacedAt: { type: Date, required: true },
    orderConfirmedAt: { type: Date },
    orderOutForDeliveryAt: { type: Date },
    orderDeliveredAt: { type: Date },
    orderCancelledAt: { type: Date },
    isOrderInProgress: {type: Boolean, default: true}
}, { timestamps: true });


// Adding indexes to improve query performance for operations involving customerId and shopId
customerOrderDataSchema.index({ customerId: 1 });        // Index on customerId for faster queries
customerOrderDataSchema.index({ shopId: 1 });            // Index on shopId for faster queries
