import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreetNosheryCustomerModule } from './customer/customer.module';
import { DatabaseProvider } from './database/database-provider.module';
import { ConfigModule } from '@nestjs/config';
import { StreetNosheryFirebaseModule } from './common/firebase/firebase.module';
import { StreetNosheryEventhandlerModule } from './common/events/event-handler.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StreetNosheryMenuModule } from './menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true
    }),
    EventEmitterModule.forRoot(),
    DatabaseProvider,
    StreetNosheryEventhandlerModule,
    StreetNosheryCustomerModule,
    StreetNosheryFirebaseModule,
    StreetNosheryMenuModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
