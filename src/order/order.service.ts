import { Injectable } from '@nestjs/common';
import { StreetNosheryOrderModelHelperService } from './model/order-modelhelper.service';
import {
  CustomerOrderDto,
  CustomerOrderFTDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { CustomerOrderStatus, PaymentStatus } from './enums/order.enum';
import { UpdateQuery } from 'mongoose';
import { ICustomerOrderData } from './model/order.model';

const prefix = '[STREET_NOSHERY_ORDER_SERVICE]';
@Injectable()
export class StreetnosheryOrderService {
  constructor(
    private readonly orderModelHelperService: StreetNosheryOrderModelHelperService,
  ) {}

  async getPastOrders(customerId: string) {
    try {
      const res = await this.orderModelHelperService.getPastOrders({
        customerId,
      });
      console.log(`${prefix} (getPastOrders) Response: ${JSON.stringify(res)}`);
      return res;
    } catch (error) {
      console.log(`${prefix} (getPastOrders) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async createOrderFT(order: CustomerOrderFTDto) {
    try {
      const orderTrackingId = this.generateOrderTrackId();
      const updateObject: UpdateQuery<ICustomerOrderData> = {
        customerId: order.customerId,
        shopId: order.shopId,
        orderItems: order.orderItems,
        orderTrackId: orderTrackingId,
        orderStatus: CustomerOrderStatus.PLACED,
        orderPlacedAt: new Date(),
        isOrderPlaced: true,
        paymentStatus: PaymentStatus.SUCCESS,
        isPaymentDone: true
      };
      const res = await this.orderModelHelperService.createOrupdateOrder(
        { orderTrackId: orderTrackingId },
        updateObject,
      );
      console.log(
        `${prefix} (createOrderFT) Order FT created successfully for trackingId: ${orderTrackingId}`,
      );

      // TODO: Payment API
      return res;
    } catch (error) {
      console.log(`${prefix} (createOrderFT) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  generateOrderTrackId() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';

    for (let i = 0; i < 16; i++) {
      uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uniqueId;
  }

  async createOrder(order: CustomerOrderDto) {
    try {
      const updateobje: UpdateQuery<ICustomerOrderData> = {
        isOrderConfirmed: true,
        orderConfirmedAt: new Date(),
        orderStatus: CustomerOrderStatus.CONFIRMED,
      };
      console.log(`${prefix} (createOrder) Order query: ${JSON.stringify(order)}`);
      await this.orderModelHelperService.createOrupdateOrder(
          order,
          updateobje
        );

      const confirmOrder = await this.orderModelHelperService.getPastOrders({orderTrackId: order.orderTrackId})
        
      console.log(
        `${prefix} (createOrder) Order confirmed for TrackId: ${order.orderTrackId} | Response: ${JSON.stringify(confirmOrder)}`,
      );
      return confirmOrder;
    } catch (error) {
      console.log(`${prefix} (createOrder) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateOrders(order: UpdateOrderDto) {
    try {
      const { orderTrackId, shopId, customerId } = order;
      const updateobje: UpdateQuery<ICustomerOrderData> = this.getUpdateObj(
        order.orderStatus,
      );

      await this.orderModelHelperService.createOrupdateOrder(
          { orderTrackId, shopId, customerId },
          updateobje,
        );
      
      const confirmOrder = await this.orderModelHelperService.getPastOrders({orderTrackId});
        
      console.log(
        `${prefix} (updateOrders) Order confirmed for TrackId: ${orderTrackId} | Response: ${JSON.stringify(confirmOrder)}`,
      );
      return confirmOrder;
    } catch (error) {
      console.log(`${prefix} (updateOrders) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  getUpdateObj(Status: CustomerOrderStatus) {
    switch (Status) {
      case CustomerOrderStatus.OUT_FOR_DELIVERY:
        return {
          orderOutForDeliveryAt: new Date(),
          isOrderOutForDelivery: true,
          orderStatus: CustomerOrderStatus.OUT_FOR_DELIVERY,
        };
      case CustomerOrderStatus.DELIVERED:
        return {
          orderDeliveredAt: new Date(),
          isOrderDelivered: true,
          orderStatus: CustomerOrderStatus.DELIVERED,
          isOrderInProgress: false,
        };
      case CustomerOrderStatus.CANCELLED:
        return {
          orderCancelledAt: new Date(),
          isorderCancelled: true,
          isOrderInProgress: false
        };
    }
  }

  async getOrderByShopId(shopId: number) {
    try {
      console.log(shopId);
        const res = await this.orderModelHelperService.getPastOrders({
            shopId
        });
        console.log(`${prefix} (getOrderByShopId) Response: ${JSON.stringify(res)}`);
        return res;
      } catch (error) {
        console.log(`${prefix} (getOrderByShopId) Error: ${JSON.stringify(error)}`);
        throw error;
      }
}
}