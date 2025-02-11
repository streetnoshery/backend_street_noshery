import { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
    mobileNumber: string,
    countryCode: string
}

export const customerSchema = new Schema({
    mobileNumber: {type: String, required: true},
    countryCode: {type: String, required: true}
})