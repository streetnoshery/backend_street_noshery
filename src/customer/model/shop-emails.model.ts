import { Document, Schema } from "mongoose";

export interface IShopEmails extends Document {
    email: string;
    customerId: string;
}

export const shopEmails = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    customerId: { type: String, required: true },
}, { timestamps: true });