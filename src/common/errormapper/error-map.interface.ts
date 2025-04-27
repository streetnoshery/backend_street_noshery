// error-map.interface.ts
import { ExceptionMessage } from "./error-mapper.utils";

export type IExceptionMap = {
    [Key in ExceptionMessage]: IExceptionObject;
}

export type IExceptionObject = {
    data: {
        message: string;
        errorCode: ExceptionMessage;
        [key: string]: string | Record<string, any>;
    };
    xStreetNosheryException: string;
}

export type IexceptionResponse = {
    response: IExceptionObject;
}