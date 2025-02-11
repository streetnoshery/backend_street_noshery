import { Document, Schema } from "mongoose";
import { OtpGenerationReasons } from "../enums/customer.enums";

export interface ICustomerOtp extends Document {
    mobileNumber: string,
    otp: string,
    reason: OtpGenerationReasons,
    createdAt: Date;
    updatedAt: Date;
    count: number
}

export const customerOtpSchema = new Schema({
    mobileNumber: { type: String, required: true },
    otp: { type: String, required: true },
    reason: { type: String, enum: Object.values(OtpGenerationReasons), required: true },
    count: {type: Number, default: 0}
},
{
    timestamps: { createdAt: true, updatedAt: true } // Enables `createdAt` and `updatedAt`
});
