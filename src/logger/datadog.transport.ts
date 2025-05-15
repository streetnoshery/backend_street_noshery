import TransportStream = require('winston-transport');
import axios from "axios";

interface DatadogTransportOptions extends TransportStream.TransportStreamOptions {
  apiKey: string;
  service?: string;
  hostname?: string;
  ddtags?: string;
}

export class DatadogTransport extends TransportStream {
  private apiKey: string;
  private service: string;
  private hostname: string;
  private ddtags: string;

  constructor(opts: DatadogTransportOptions) {
    super(opts);
    this.apiKey = opts.apiKey;
    this.service = opts.service || 'nestjs-service';
    this.hostname = opts.hostname || 'nestjs-app';
    this.ddtags = opts.ddtags || 'env:dev,nestjs';
  }

  async log(info: any, callback: () => void) {
    const { level, message, ...meta } = info;

    const payload = {
      message,
      ddsource: 'nodejs',
      ddtags: this.ddtags,
      hostname: this.hostname,
      service: this.service,
      status: level,
      ...meta,
    };

    try {
      await axios.post(
        'https://http-intake.logs.datadoghq.com/v1/input',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': this.apiKey,
          },
        },
      );
    } catch (error) {
      console.error('Failed to send log to Datadog', error.message);
    }

    callback();
  }
}
