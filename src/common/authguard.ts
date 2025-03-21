import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException } from "@nestjs/common";
import _ = require("lodash");
import jwt = require("jsonwebtoken");
import httpContext = require("express-http-context");

@Injectable()
export class AuthGuard implements CanActivate {
    constructor() {

    }

    getAuthToken(request: Request): string{
        const headers = _.get(request, "headers.authorization", "")
        return _.get(headers.split("Bearer "), "1", "")
    }

    validateAuth(request: Request): boolean {
        let isValid = true;
        let tokenPayload: any

        try {
            const token = this.getAuthToken(request);
            if(_.isEmpty(token)) {
                throw new InternalServerErrorException("Auth token missing");
            }

            tokenPayload = jwt.decode(token);
            console.log(`tokenPayload: >> ${JSON.stringify(tokenPayload)}`);
            if(!tokenPayload) {
                throw new InternalServerErrorException("Invalid token payload")
            }
            if(tokenPayload.hasOwnProperty("customerId")) {
                httpContext.set("customerId", tokenPayload.customerId)
            }
            if(tokenPayload.hasOwnProperty("STREET_NOSHERY")) {
                httpContext.set("customerId", tokenPayload.STREET_NOSHERY)
            }
            if(tokenPayload.hasOwnProperty("phone")) {
                httpContext.set("contactNo", tokenPayload.phone)
            }

            console.log(`Valid token`);
            return isValid;
        } catch (error) {
            console.log(`Auth failed`);
            isValid = false;
            return isValid;
        }
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        return this.validateAuth(request);
    }
}