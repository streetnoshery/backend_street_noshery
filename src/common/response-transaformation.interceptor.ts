import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { request } from "express";
import { Observable, map } from "rxjs";
import * as crypto from 'crypto';

const SECRET_KEY = "sumitkumargodwansumitkumargodwan"; // 256-bit key
const IV = "sumitkumargodwan"; // 16-byte IV
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
    const iv = Buffer.from(IV, 'utf8'); // Convert static IV to buffer
    const key = Buffer.from(SECRET_KEY, 'utf8'); // Convert key to buffer
  
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
  
    return encrypted; // No need to append IV since it's static
}

@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const httpContext = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map(async res => {
                return this.convertToStreetNosheryResponse(res, httpContext.statusCode);
            })
        )
    }

    async convertToStreetNosheryResponse(res: unknown, statusCode: number) {
        const response = {
            state: "SUCCESS",
            status: statusCode,
            data: res,
            path: request.url
        };

        return response;
        const encryptedResponse = encrypt(JSON.stringify(response));
        return { response: encryptedResponse };
    }
}