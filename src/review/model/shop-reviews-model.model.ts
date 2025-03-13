import { Document, Schema } from "mongoose";

export interface IShop extends Document {
    customerId: string;
    shopId: number;
    reviews: string;
    rating: number
}

export const ShopSchema = new Schema<IShop>({
    shopId: { type: Number, required: true},
    customerId: { type: String, required: true },
    reviews: { type: String, required: true},
    rating: { type: Number, required: true}
}, { timestamps: true }); // Adds createdAt & updatedAt