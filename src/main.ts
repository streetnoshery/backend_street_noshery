import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOption } from './common/corsOptions';
import helmet = require("helmet");
import httpContext = require("express-http-context");
import { setContext } from './common/setcontext.middleware';
import { HttpExceptionFilter } from './common/filter';
import { StandardResponseInterceptor } from './common/response-transaformation.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import mongoose from 'mongoose';
import { StreetNosheryRequestInterceptor } from './common/decryption.interseptor';

function formatErrorText(err: any): string {
  let errText = 'Uncaught Exception';
  if(err?.response?.data) {
    errText += JSON.stringify(err?.response.data)
  }else {
    errText += err?.message + err?.stack
  }

  return errText
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("street-noshery");
  app.enableCors(corsOption);
  app.use(helmet());
  app.use(httpContext.middleware);
  app.use(setContext);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new StreetNosheryRequestInterceptor());
  app.useGlobalInterceptors(new StandardResponseInterceptor());

  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }));

  useContainer(app.select(AppModule), {fallbackOnErrors: true});

  process.on('unhandledRejection', (err: any) => {
    const errorText: string = formatErrorText(err);
    console.error(errorText);
  });

  process.on('uncaughtException', (err: any) => {
    const errorText: string = formatErrorText(err);
    console.error(errorText);
  });
  mongoose.set('autoIndex', true);

  await app.listen(3000);
  console.log("App listening on port", 3000)
}
bootstrap();
