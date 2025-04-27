import { IExceptionObject } from "./error-map.interface";
import { EXCEPTION_MAP, ExceptionMessage } from "./error-mapper.utils";
import _ = require("lodash")

export const exceptionMapper = (errorEnum: ExceptionMessage, additional?: Record<string, any>) : IExceptionObject => {
    let exceptionObj = {...EXCEPTION_MAP[errorEnum]}
    if(_.isPlainObject(additional)) {
        exceptionObj.data = Object.assign(additional, exceptionObj.data);
    }
    return exceptionObj;
}