import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreetNosheryCustomerModule } from './customer/customer.module';
import { DatabaseProvider } from './database/database-provider.module';
import { ConfigModule } from '@nestjs/config';
import { StreetNosheryFirebaseModule } from './common/firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true
    }),
    DatabaseProvider,
    StreetNosheryCustomerModule,
    StreetNosheryFirebaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
