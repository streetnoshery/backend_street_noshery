import { Document, Schema } from "mongoose";
import { OnboardingStages } from "../enums/customer.enums";

// Define Address interface
interface IAddress {
    firstLine: string;
    secondLine?: string; // Optional field
    shopId: number;
}

// Define Customer interface
export interface ICustomer extends Document {
    mobileNumber: string;
    countryCode: string;
    email: string;
    password: string;
    userName: string;
    address: IAddress;
    status: OnboardingStages;
    customerId: string
}

// Define Customer Schema
export const customerSchema = new Schema<ICustomer>({
    mobileNumber: { type: String, required: true },
    countryCode: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userName: { type: String, required: true },
    address: {
        firstLine: { type: String, required: true },
        secondLine: { type: String }, // Optional field
        shopId: {type: Number}
    },
    status: { type: String, enum: Object.values(OnboardingStages), required: true },
    customerId: { type: String, required: true }
}, { timestamps: true }); // Adds createdAt & updatedAt fields automatically