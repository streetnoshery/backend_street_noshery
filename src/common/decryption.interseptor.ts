import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { createDecipheriv } from "crypto";
import { Observable } from "rxjs";

const IgnoredPropertyName = Symbol('IgnoredPropertyName');

export function SkipInterceptor() {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    descriptor.value[IgnoredPropertyName] = true;
  };
}

@Injectable()
export class StreetNosheryRequestInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const isIgnoreInterceptor = context.getHandler()[IgnoredPropertyName];

    if (isIgnoreInterceptor) {
      return next.handle(); // Skip decryption if decorator is used
    }

    if (request.method !== 'GET') {
      request.body = this.decryptPayload(request.body?.payload, request.method);
    } else {
      request.query = this.decryptPayload(request.query?.data, request.method);
    }

    return next.handle();
  }

  decryptPayload(encryptedData: string, method: string) {
    if (!encryptedData) return null;

    try {
      // Decryption parameters
      const algorithm = process.env.ALGORITHM || 'aes-256-cbc'; // Default if not set
      const key = Buffer.from(process.env.DECRYPT_SECRET_KEY, 'hex');
      const iv = Buffer.from(process.env.DECRYPT_IV, 'hex');

      // Decryption
      const decipher = createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      if (method !== 'GET') {
        return JSON.parse(decrypted);
      }

      // Handle GET requests (decrypt query string)
      const queryParams = new URLSearchParams(decrypted);
      const queryParamsObject: Record<string, string> = {};
      for (const [key, value] of queryParams.entries()) {
        queryParamsObject[key] = value;
      }
      return queryParamsObject;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }
}
