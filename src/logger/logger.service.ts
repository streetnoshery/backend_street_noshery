import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { DatadogTransport } from './datadog.transport';

@Injectable()
export class LoggerService {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.Console(),
        new DatadogTransport({
          apiKey: process.env.DATADOG_KEY,
          service: 'street-noshery',
          hostname: 'nestjs-app',
          ddtags: 'env:dev,nestjs',
        }),
      ],
    });
  }

  log(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }
}
