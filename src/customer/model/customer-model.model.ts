import { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
    mobileNumber: string,
    countryCode: string
}

export const customerSchema = new Schema({
    mobileNumber: {type: String, require: true},
    countryCode: {type: String, require: true}
})