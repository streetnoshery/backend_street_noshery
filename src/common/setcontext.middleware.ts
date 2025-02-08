import { NextFunction, Request, Response } from "express";
import httpContext = require("express-http-context");
import _ = require("lodash");


export function setContext(req: Request, res: Response, next: NextFunction) {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);

    _.each(req.headers, (value, key) => {
        httpContext.set(key, value);
    });

    let correlationId = req.get("x-correlation-id");
    let appsflyerId = req.get("x-appsflyer-id");
    let deviceInfo = req.get("x-device-info");
    let appInfo = req.get('x-app-info');

    const authToken = req.get("Authorization");

    httpContext.set("correlationId", correlationId);
    httpContext.set("authToken", authToken);
    httpContext.set("appsflyerId", appsflyerId);
    httpContext.set("deviceInfo", deviceInfo);
    httpContext.set("appInfo", appInfo);

    next();
}