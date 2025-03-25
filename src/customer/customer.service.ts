import { BadRequestException, Injectable } from "@nestjs/common";
import { StreetNosheryCreateCustomer, UpdateAddressDto, UpdateCustomerDetailsDto } from "./dto/customer.dto";
import { StreetNosheryCustomerModelHelper } from "./model/customer-modelhelper.service";
import { StreetNosheryGenerateOtp } from "./dto/otp.dto";
import * as moment from 'moment';
import { OnboardingStages } from "./enums/customer.enums";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventHnadlerEnums } from "src/common/events/enums";

const prefix = "[STREET_NOSHERY_CUSTOMER_SERVICE]"
@Injectable()
export class StreetNosheryCustomerService {
    constructor(
        private readonly streetNosheryCustomerModelhelper: StreetNosheryCustomerModelHelper,
        private readonly emitterService: EventEmitter2
    ) { }

    async getUser(mobileNumber: string) {
        try {
            const res = await this.streetNosheryCustomerModelhelper.getUser({ mobileNumber });
            return res;
        } catch (error) {
            console.log(`${prefix} (getUser) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async createUser(body: StreetNosheryCreateCustomer) {
        let updateObj: any = {};
        const { mobileNumber } = body;
        try {

            const userDetails = await this.streetNosheryCustomerModelhelper.getUser({ mobileNumber });
            console.log(`${prefix} (createUser) user details: ${JSON.stringify(userDetails)}`);
            if (!userDetails) {
                updateObj = {
                    mobileNumber,
                    countryCode: body.countryCode,
                    status: OnboardingStages.MOBILE_VERIFICATION,
                    customerId: this.generateStreetNosheryId()
                }
            }
            else if (userDetails?.status == OnboardingStages.MOBILE_VERIFICATION) {
                const { email, password } = body;
                updateObj = {
                    email,
                    password,
                    status: OnboardingStages.EMAIL_VERIFICATION
                }
            }
            else if (userDetails?.status == OnboardingStages.EMAIL_VERIFICATION) {
                const { address, userName } = body;
                updateObj = {
                    address,
                    userName,
                    status: OnboardingStages.USER_DETAILS_VERIFICATION
                }
            }
            const res = await this.streetNosheryCustomerModelhelper.createOrUpdateUser({ mobileNumber }, updateObj);
            console.log(`${prefix} (createUser) Successful || Response: ${JSON.stringify(res)}`);
            const { _id, __v, ...result } = res;
            this.emitterService.emit(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, { data: result, mobileNumber: res.mobileNumber })
            return res;
        } catch (error) {
            console.log(`${prefix} (createUser) Error: ${JSON.stringify(error)}`);
            updateObj = {
                status: OnboardingStages.FAILED
            }
            const res = await this.streetNosheryCustomerModelhelper.createOrUpdateUser({ mobileNumber }, updateObj);
            const { _id, __v, ...result } = res;
            this.emitterService.emit(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, { data: result, mobileNumber: res.mobileNumber })
            throw error;
        }
    }

    async generateOtp(body: StreetNosheryGenerateOtp) {
        try {
            const { mobileNumber, reason } = body;
            const otpData = await this.streetNosheryCustomerModelhelper.getOtp(body);
            const MAX_RETRIALS = 5;

            let res;
            if (otpData) {
                const { updatedAt } = otpData;
                if (this.isExpiredOtp(updatedAt)) {
                    const generatedOtp = this.generateRandomOtp();
                    const updateQuery = { otp: generatedOtp, count: 1 }
                    res = await this.streetNosheryCustomerModelhelper.otp({ mobileNumber, reason }, updateQuery);
                    console.log(`${prefix} (generateOtp) Successful || Response: ${JSON.stringify(res)}`);
                    return;
                }
            }

            if (otpData && otpData?.count >= MAX_RETRIALS) {
                console.log(`${prefix} (generateOtp) Failed to generate Otp: ${JSON.stringify(otpData)}`);
                throw new BadRequestException('Limit Exceed');
            }

            const generatedOtp = this.generateRandomOtp();
            const updateQuery = { otp: generatedOtp, $inc: { count: 1 } } // Increment count by 1
            res = await this.streetNosheryCustomerModelhelper.otp({ mobileNumber, reason }, updateQuery);

            console.log(`${prefix} (generateOtp) Successful || Response: ${JSON.stringify(res)}`);
            /* TODO 
            Function to send OTP on SMS
            */
            return "ok";
        } catch (error) {
            console.log(`${prefix} (generateOtp) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async verifyOtp(body: StreetNosheryGenerateOtp) {
        try {
            const res = await this.streetNosheryCustomerModelhelper.getOtp(body);

            if (!res) {
                console.log(`${prefix} (verifyOtp) Failed: ${JSON.stringify(res)}`);
                throw new BadRequestException('Invalid OTP');
            }

            const { updatedAt } = res;
            if (this.isExpiredOtp(updatedAt)) {
                throw new BadRequestException('Expired OTP');
            }
            return
        } catch (error) {
            console.log(`${prefix} (verifyOtp) Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    isExpiredOtp(updatedAt: Date) {
        const expiryTime = moment(updatedAt).add(5, 'minutes'); // Add 10 minutes to updatedAt
        return moment().isAfter(expiryTime);
    }

    generateRandomOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    generateStreetNosheryId(): string {
        const prefix = 'STREET_NOSHERY';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomString = '';

        for (let i = 0; i < 20; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters[randomIndex];
        }

        return `${prefix}_${randomString}`;
    }

    async enableEmailNotification(body: { customerId: string, isEnable: boolean }) {
        try {
            const { customerId, isEnable } = body;
            const res = await this.streetNosheryCustomerModelhelper.createOrUpdateUser({ customerId }, { isEmailNotificationEnable: isEnable });
            const { _id, __v, ...result } = res;
            this.emitterService.emit(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, { data: result, mobileNumber: res.mobileNumber })
            return res;
        } catch (error) {
            console.log(`${prefix} (enableEmailNotification) Error: ${JSON.stringify(error)} `);
            throw error;
        }
    }

    async updateAddress(body: UpdateAddressDto) {
        try {
            const { firstLine, secondLine, shopId, customerId } = body;
            const createUser = {
                $set: {
                    "address.firstLine": firstLine,
                    "address.secondLine": secondLine,
                    "address.shopId": shopId
                }
            };
            
            const res = await this.streetNosheryCustomerModelhelper.createOrUpdateUser({ customerId }, createUser);
            const { _id, __v, ...result } = res;
            this.emitterService.emit(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, { data: result, mobileNumber: res.mobileNumber })
            return res;
        } catch (error) {
            console.log(`${prefix} (updateAddress) Error: ${JSON.stringify(error)} `);
            throw error;
        }
    }

    async updateUserDetails(body: UpdateCustomerDetailsDto) {
        try {
            const {customerId, ...obj} = body;
            
            const res = await this.streetNosheryCustomerModelhelper.createOrUpdateUser({ customerId }, obj);
            const { _id, __v, ...result } = res;
            this.emitterService.emit(EventHnadlerEnums.CUSTOMER_DETAILS_REFRESH, { data: result, mobileNumber: res.mobileNumber })
            return res;
        } catch (error) {
            console.log(`${prefix} (updateUserDetails) Error: ${JSON.stringify(error)} `);
            throw error;
        }
    }
}