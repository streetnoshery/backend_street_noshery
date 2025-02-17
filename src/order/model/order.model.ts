import { Document, Schema } from "mongoose";
import { CustomerOrderStatus } from "src/order/enums/order.enum";


// Interface defining the structure of a Customer Order document in MongoDB
export interface ICustomerOrderData extends Document {
    customerId: string;            // Unique identifier for the customer
    shopId: string;                // Unique identifier for the shop
    dishName: string;              // Name of the ordered dish
    description: string;           // Description of the ordered dish
    price: string;                 // Price of the dish as a string (consider using number for arithmetic operations)
    rating: number;                // Rating of the dish (numeric value)
    foodId: number;                // Unique identifier for the food item
    orderTrackId: string;          // Unique tracking ID for the order
    orderStatus: CustomerOrderStatus;  // Current status of the order, must be one of the values from CustomerOrderStatus enum
    orderPlacedAt: Date;           // Timestamp when the order was placed
    orderConfirmedAt: Date;        // Timestamp when the order was confirmed
    orderOutForDeliveryAt: Date;   // Timestamp when the order was out for delivery
    orderDeliveredAt: Date;        // Timestamp when the order was delivered
    orderCancelledAt: Date;        // Timestamp when the order was cancelled
}

// Mongoose schema defining the structure and constraints for Customer Order data
export const customerOrderDataSchema = new Schema({
    customerId: { type: String, required: true },                  // Required customer ID
    shopId: { type: String, required: true },                      // Required shop ID
    dishName: { type: String, required: true },                    // Required dish name
    description: { type: String, required: true },                 // Required dish description
    price: { type: String, required: true },                       // Required dish price
    rating: { type: Number, required: true },                      // Required dish rating
    foodId: { type: Number, required: true },                      // Required food ID
    orderTrackId: { type: String, required: true },                // Required tracking ID for the order
    orderStatus: { type: String, enum: Object.values(CustomerOrderStatus), required: true },  // Enum validation for order status
    orderPlacedAt: { type: Date },                                 // Date field for when the order was placed
    orderConfirmedAt: { type: Date },                              // Date field for when the order was confirmed
    orderOutForDeliveryAt: { type: Date },                         // Date field for when the order was out for delivery
    orderDeliveredAt: { type: Date },                              // Date field for when the order was delivered
    orderCancelledAt: { type: Date }                               // Date field for when the order was cancelled
}, { timestamps: true });                                          // Automatically adds `createdAt` and `updatedAt` timestamps

// Adding indexes to improve query performance for operations involving customerId and shopId
customerOrderDataSchema.index({ customerId: 1 });  // Index on customerId for faster queries
customerOrderDataSchema.index({ shopId: 1 });      // Index on shopId for faster queries