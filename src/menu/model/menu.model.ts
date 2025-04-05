import { Document, Schema } from "mongoose";

export interface IDish {
    dishName: string;
    description: string;
    price: string;
    rating: number;
    foodId: number;
    ratingCount: number
}

export interface IMenu extends Document {
    shopId: number;
    menu: IDish[];
}

export const DishSchema = new Schema({
    dishName: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    rating: { type: Number, required: true },
    foodId: { type: Number, required: true },
    ratingCount:  { type: Number, required: true, default: 0}
}, { _id: false });

export const MenuSchema = new Schema({
    shopId: { type: Number, required: true },
    menu: { type: [DishSchema], required: true }
}, { timestamps: true });