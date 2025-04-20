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
// import { StreetNosheryRequestInterceptor } from './common/decryption.interseptor';
const {initializeFirebaseApp} = require("./common/firebase/firebase_utils");

function formatErrorText(err: any): string {
  let errText = 'Uncaught Exception';
  if(err?.response?.data) {
    errText += JSON.stringify(err?.response.data)
  }else {
    errText += err?.message + err?.stack
  }

  return errText
}

const port = process.env.PORT || 3000;
const globalPrefix = process.env.GLOBAL_PREFIX || "street-noshery"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(`global prefix: ${globalPrefix}`);
  app.setGlobalPrefix(globalPrefix);
  app.enableCors(corsOption);
  app.use(helmet());
  app.use(httpContext.middleware);
  app.use(setContext);
  app.useGlobalFilters(new HttpExceptionFilter());
  // app.useGlobalInterceptors(new StreetNosheryRequestInterceptor());
  app.useGlobalInterceptors(new StandardResponseInterceptor());
  initializeFirebaseApp();

  app.use((req, res, next) => {
    console.log('Request Body:', req.body);
    next();
  });
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

  await app.listen(port);
  console.log("App listening on port", port);
}
bootstrap();
