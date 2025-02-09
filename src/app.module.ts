import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreetNosheryCustomerModule } from './customer/customer.module';
import { DatabaseProvider } from './database/database-provider.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true
    }),
    StreetNosheryCustomerModule, 
    DatabaseProvider],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
