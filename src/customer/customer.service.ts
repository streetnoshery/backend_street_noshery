import { BadRequestException, Injectable } from "@nestjs/common";
import { StreetNosheryCreateCustomer, UpdateAddressDto, UpdateCustomerDetailsDto } from "./dto/customer.dto";
import { StreetNosheryCustomerModelHelper } from "./model/customer-modelhelper.service";
import { StreetNosheryGenerateOtp } from "./dto/otp.dto";
import * as moment from 'moment';
import { OnboardingStages } from "./enums/customer.enums";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventHnadlerEnums } from "src/common/events/enums";
import { NotificationService } from "src/notification/notification.service";

const prefix = "[STREET_NOSHERY_CUSTOMER_SERVICE]"
@Injectable()
export class StreetNosheryCustomerService {
    constructor(
        private readonly streetNosheryCustomerModelhelper: StreetNosheryCustomerModelHelper,
        private readonly emitterService: EventEmitter2,
        private readonly smsService: NotificationService
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
                const isRegisterForShop = await this.streetNosheryCustomerModelhelper.getEmail({ email });
                console.log(`${prefix} (createUser) is user going to register for shop: ${JSON.stringify(isRegisterForShop)}`)
                updateObj = {
                    email,
                    password,
                    status: OnboardingStages.EMAIL_VERIFICATION,
                    isRegisterForShop: isRegisterForShop ? true : false
                }
            }
            else if (userDetails?.status == OnboardingStages.EMAIL_VERIFICATION) {
                const { firstLine, secondLine, shopId, userName } = body;
                updateObj = {
                    address: {
                        firstLine,
                        secondLine,
                        shopId: Number(shopId)
                    },
                    userName,
                    status: OnboardingStages.USER_DETAILS_VERIFICATION,
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
            const MAX_RETRIALS = 5;

            const otpData = await this.streetNosheryCustomerModelhelper.getOtp(body);

            // Check if OTP data exists and retrials exceeded
            if (otpData && otpData.count >= MAX_RETRIALS && !this.isExpiredOtp(otpData.updatedAt)) {
                console.log(`${prefix} (generateOtp) Failed to generate OTP: ${JSON.stringify(otpData)}`);
                throw new BadRequestException('Limit Exceeded');
            }

            let generatedOtp = this.generateRandomOtp();
            let updateQuery;

            if (otpData) {
                if (this.isExpiredOtp(otpData.updatedAt)) {
                    // OTP expired: generate new OTP and reset count
                    updateQuery = { otp: generatedOtp, count: 1 };
                } else {
                    // OTP not expired: generate new OTP and increment count
                    updateQuery = { otp: generatedOtp, $inc: { count: 1 } };
                }
            } else {
                // No OTP data: generate new OTP and set count to 1
                updateQuery = { otp: generatedOtp, count: 1 };
            }

            const res = await this.streetNosheryCustomerModelhelper.otp({ mobileNumber, reason }, updateQuery);

            const user = await this.streetNosheryCustomerModelhelper.getUser({ mobileNumber });

            if (user?.email) {
                const email = user.email;
                await this.smsService.sendOtpViaEmail(email, generatedOtp);
            } else {
                await this.smsService.sendSMSTwilio(generatedOtp, mobileNumber);
            }

            console.log(`${prefix} (generateOtp) Successful || Response: ${JSON.stringify(res)}`);
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
            return "ok"
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
            const { customerId, ...obj } = body;

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