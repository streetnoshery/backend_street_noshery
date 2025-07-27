import { Document, Schema } from "mongoose";

export interface IEmail extends Document {
    email: string;
    mobileNumbers: string;
    promotionalCode: string;
}

export const emailSchema = new Schema({
    email: { type: String },
    mobileNumbers: { type: String },
    promotionalCode: { type: String }
},
    { timestamps: true })