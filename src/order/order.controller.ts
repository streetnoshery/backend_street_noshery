import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { StreetnosheryOrderService } from './order.service';
import {
  CustomerOrderDto,
  CustomerOrderFTDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { LoggerService } from 'src/logger/logger.service';

const prefix = '[STREET_NOSHERY_ORDER_CONTROLLER]';
@Controller('order')
export class StreetNosheryOrderController {
  constructor(
    private orderService: StreetnosheryOrderService,
    private readonly logger: LoggerService
    ) {}

  @Get('')
  async getOrders(@Query('customerId') customerId: string) {
    try {
      this.logger.log(
        `${prefix} (getOrders) initiating get orders for customerId: ${customerId}`,
      );
      const res = await this.orderService.getPastOrders(customerId);
      this.logger.log(
        `${prefix} (getOrders) Successful fetched orders for customerId: ${customerId} | Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      this.logger.error(`${prefix} (getOrders) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Post('create/ft')
  async createOrderFT(@Body() body: CustomerOrderFTDto) {
    try {
      this.logger.log(
        `${prefix} (createOrderFT) initiating create orders FT for customerId: ${body.customerId}`,
      );
      const res = await this.orderService.createOrderFT(body);
      this.logger.log(
        `${prefix} (createOrderFT) Successful order FT created Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      this.logger.error(`${prefix} (createOrderFT) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Post('create')
  async createOrder(@Body() body: CustomerOrderDto) {
    try {
      this.logger.log(
        `${prefix} (createOrder) initiating create orders for TrackId: ${body.orderTrackId}`,
      );
      const res = await this.orderService.createOrder(body);
      this.logger.log(
        `${prefix} (createOrder) Successful order  created Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      this.logger.error(`${prefix} (createOrder) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Patch('update')
  async updateOrderStatus(@Body() body: UpdateOrderDto) {
    try {
      this.logger.log(
        `${prefix} (updateOrderStatus) initiating update order for TrackId: ${body.orderTrackId} | Status: ${body.orderStatus}`,
      );
      const res = await this.orderService.updateOrders(body);
      this.logger.log(
        `${prefix} (updateOrderStatus) updated order for TrackId: ${body.orderTrackId}`,
      );
      return res;
    } catch (error) {
      this.logger.error(
        `${prefix} (updateOrderStatus) Error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  @Get('status')
  async getOrderStatus(@Query("orderTrackId") orderTrackId: string) {
    try {
      this.logger.log(
        `${prefix} (getOrderStatus) initiating get order status for orderTrackId: ${orderTrackId}`,
      );
      const res = await this.orderService.getStatus(orderTrackId);
      this.logger.log(
        `${prefix} (getOrderStatus) Response get order status for orderTrackId: ${orderTrackId} | ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      this.logger.error(
        `${prefix} (getOrderStatus) Error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  @Get('order-by-shopId')
  async getOrderBuShopId(@Query('shopId') shopId: number) {
    try {
      this.logger.log(
        `${prefix} (getOrderBuShopId) initiating get order for shopId: ${shopId}`,
      );
      const res = await this.orderService.getOrderByShopId(shopId);
      this.logger.log(
        `${prefix} (getOrderBuShopId) updated order for shopId: ${shopId}`,
      );
      return res;
    } catch (error) {
      this.logger.error(
        `${prefix} (getOrderBuShopId) Error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }
}
