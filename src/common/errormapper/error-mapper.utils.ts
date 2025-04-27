// error-mapper.utils.ts
import { IExceptionMap } from "./error-map.interface";

export enum ExceptionMessage {
    ERROR = "ERROR",
    OTP_LIMIT_EXCEEDED = "OTP_LIMIT_EXCEEDED",
    INVALID_OTP = "INVALID_OTP",
    EXPIRE_OTP = "EXPIRE_OTP",
    MENU_NOT_EXISTS = "MENU_NOT_EXISTS"
}

export const EXCEPTION_MAP: IExceptionMap = {
    [ExceptionMessage.ERROR]: {
        data: {
            message: "new error",
            errorCode: ExceptionMessage.ERROR
        },
        xStreetNosheryException: "new error"
    },
    [ExceptionMessage.OTP_LIMIT_EXCEEDED]: {
        data: {
            message: "otp limit exceed more than 5 time, pleasw try after some time",
            errorCode: ExceptionMessage.OTP_LIMIT_EXCEEDED
        },
        xStreetNosheryException: "otp limit exceed more than 5 time, pleasw try after some time"
    },
    [ExceptionMessage.INVALID_OTP]: {
        data: {
            message: "Invalid otp",
            errorCode: ExceptionMessage.INVALID_OTP
        },
        xStreetNosheryException: "Invalid otp"
    },
    [ExceptionMessage.EXPIRE_OTP]: {
        data: {
            message: "Otp has been expired",
            errorCode: ExceptionMessage.EXPIRE_OTP
        },
        xStreetNosheryException: "Otp has been expired"
    },
    [ExceptionMessage.MENU_NOT_EXISTS]: {
        data: {
            message: "menu not exists for the given shop",
            errorCode: ExceptionMessage.MENU_NOT_EXISTS
        },
        xStreetNosheryException: "menu not exists for the given shop"
    }
}
