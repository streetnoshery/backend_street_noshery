import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { StreetnosheryOrderService } from './order.service';
import {
  CustomerOrderDto,
  CustomerOrderFTDto,
  UpdateOrderDto,
} from './dto/order.dto';

const prefix = '[STREET_NOSHERY_ORDER_CONTROLLER]';
@Controller('order')
export class StreetNosheryOrderController {
  constructor(private orderService: StreetnosheryOrderService) {}

  @Get('')
  async getOrders(@Query('customerId') customerId: string) {
    try {
      console.log(
        `${prefix} (getOrders) initiating get orders for customerId: ${customerId}`,
      );
      const res = await this.orderService.getPastOrders(customerId);
      console.log(
        `${prefix} (getOrders) Successful fetched orders for customerId: ${customerId} | Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      console.log(`${prefix} (getOrders) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Post('create/ft')
  async createOrderFT(@Body() body: CustomerOrderFTDto) {
    try {
      console.log(
        `${prefix} (createOrderFT) initiating create orders FT for customerId: ${body.customerId}`,
      );
      const res = await this.orderService.createOrderFT(body);
      console.log(
        `${prefix} (createOrderFT) Successful order FT created Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      console.log(`${prefix} (createOrderFT) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Post('create')
  async createOrder(@Body() body: CustomerOrderDto) {
    try {
      console.log(
        `${prefix} (createOrder) initiating create orders for TrackId: ${body.orderTrackId}`,
      );
      const res = await this.orderService.createOrder(body);
      console.log(
        `${prefix} (createOrder) Successful order  created Response: ${JSON.stringify(res)}`,
      );
      return res;
    } catch (error) {
      console.log(`${prefix} (createOrder) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  @Patch('update')
  async updateOrderStatus(@Body() body: UpdateOrderDto) {
    try {
      console.log(
        `${prefix} (updateOrderStatus) initiating update order for TrackId: ${body.orderTrackId} | Status: ${body.orderStatus}`,
      );
      const res = await this.orderService.updateOrders(body);
      console.log(
        `${prefix} (updateOrderStatus) updated order for TrackId: ${body.orderTrackId}`,
      );
      return res;
    } catch (error) {
      console.log(
        `${prefix} (updateOrderStatus) Error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  @Get('order-by-shopId')
  async getOrderBuShopId(@Query('shopId') shopId: number) {
    try {
      console.log(
        `${prefix} (getOrderBuShopId) initiating get order for shopId: ${shopId}`,
      );
      const res = await this.orderService.getOrderByShopId(shopId);
      console.log(
        `${prefix} (getOrderBuShopId) updated order for shopId: ${shopId}`,
      );
      return res;
    } catch (error) {
      console.log(
        `${prefix} (getOrderBuShopId) Error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }
}
