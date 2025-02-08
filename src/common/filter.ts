import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import _ = require("lodash");
import { ICustomErrorResponse } from "./error-response.interface";
import { Request, Response } from "express";
const tracer = require("./tracer");


export class HttpExceptionFilter extends BaseExceptionFilter {

    getStatus(response: any, originalStatus: any) {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (response?.statusCode) {
            status = response?.statusCode;
        } else if (response?.data?.statusCode) {
            status = response?.data?.statusCode;
        } else if (response.status) {
            /* eslint-disable */
            status = response.status;
        } else if (originalStatus) {
            status = originalStatus;
        }
        return status;
    }

    getStatusText(response: any, responseData: any) {
        let statusText =
            "Something went wrong! Please wait while we get this checked.";
        if (response?.data?.statusText) {
            statusText = response?.data?.statusText;
        } else if (_.isArray(responseData) && !_.isEmpty(responseData)) {
            // class-validator errors
            statusText = responseData[0];
        } else if (this.getData(response)?.message) {
            // else fallback to the message
            statusText = this.getData(response).message;
        } else if (response?.statusText) {
            statusText = response?.statusText;
        }
        return statusText;
    }

    getSource(response: any) {
        let source = "STREET-NOSHERY";
        if (response?.errorSource) {
            source = response?.errorSource;
        } else if (response?.data?.errorSource) {
            source = response?.data?.errorSource;
        } else if (response?.data?.source) {
            source = response?.data?.source;
        }
        return source;
    }

    getData(response: any) {
        let data = { message: "Looks like an unhandled error." };
        if (response.data?.data) {
            data = response.data?.data;
        } else if (response?.data) {
            data =
                typeof response.data === "string"
                    ? {
                        message: response.data
                    }
                    : response.data;
        } else if (response?.message) {
            data = {
                message: response?.message
            };
        }
        return data;
    }

    getPath(response: any, originalUrl: any) {
        let path = originalUrl;
        if (response?.data?.path) {
            path = response?.data?.path;
        }
        return path;
    }

    /* -------------------------------------------------------------------------- */
    /*                              EXCEPTION HANDLER                             */
    /* -------------------------------------------------------------------------- */

    catch(exception: any, host: ArgumentsHost) {
        const httpHost = host.switchToHttp();
        const response = httpHost.getResponse<Response>();
        const request = httpHost.getRequest<Request>() as Record<string, any>;
        const niyoExceptionHeader = "x-streetNoshery-exception";
        const errorMessage =
            "Exception " +
            " occured while hitting " +
            request.url +
            " Message : " +
            exception?.message +
            ` ${JSON.stringify(exception?.response?.data)} | ${JSON.stringify(exception?.response?.message)}`;


        const errResp: ICustomErrorResponse = {
            state: "FAILURE",
            status: 500,
            statusText: "",
            source: "SBM-BFF-CREDIT-CARD",
            data: {},
            path: ""
        };
        if (exception?.response) {
            errResp.status = this.getStatus(exception.response, exception?.status);
            errResp.statusText = this.getStatusText(
                exception.response,
                exception.response?.message
            );
            errResp.data = this.getData(exception.response);
            errResp.path = this.getPath(exception.response, request.url);
            if (exception.response?.data?.source) {
                errResp.source = exception.response.source;
            }
        } else {
            errResp.status = HttpStatus.INTERNAL_SERVER_ERROR;
            errResp.statusText =
                "Something went wrong! Please wait while we get this checked.";
            errResp.source = "SBM-BFF-CREDIT-CARD";
            errResp.data = { message: "Looks like an unhandled error." };
            errResp.path = request.url;
        }

        if (exception?.code) { // platform | mongodb exceptions that are unhandled by code
            errResp.statusText = exception.code;
            const data = {
                message: exception.code
            };
            errResp.data = data;
        }
        const exceptionFilterSpan = tracer.startSpan("exception-sbm-cc")
        if (exception?.response?.xNiyoException) { // known exceptions thrown by sbm-card-bff
            response.setHeader(
                niyoExceptionHeader,
                exception?.response?.xNiyoException
            );
            errResp.statusText = exception?.response?.xNiyoException;
            request['sbm-exception'] = exception?.response?.xNiyoException;
            exceptionFilterSpan.setTag('exception', exception?.response?.xNiyoException);
        } else {
            request['sbm-exception'] = errResp.statusText || 'Unknown Error'
            response.setHeader(niyoExceptionHeader, errResp.statusText);
            exceptionFilterSpan.setTag('exception', errResp.statusText);
        }
        exceptionFilterSpan.finish()
        response.status(errResp.status).json(errResp);
    }
}