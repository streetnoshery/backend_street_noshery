import { Injectable } from '@nestjs/common';
import { StreetNosheryOrderModelHelperService } from './model/order-modelhelper.service';
import {
  CustomerOrderDto,
  CustomerOrderFTDto,
  OrderItemDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { CustomerOrderStatus, IOrderStatusFlags, OREDER_STATUS_ID, PaymentStatus, STATUS_FLAGS, orderTitle } from './enums/order.enum';
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
      const totalAmount = this.getOrderAmount(order.orderItems)
      const updateObject: UpdateQuery<ICustomerOrderData> = {
        customerId: order.customerId,
        shopId: order.shopId,
        orderItems: order.orderItems,
        orderTrackId: orderTrackingId,
        orderStatus: CustomerOrderStatus.PLACED,
        orderPlacedAt: new Date(),
        isOrderPlaced: true,
        paymentStatus: PaymentStatus.SUCCESS,
        isPaymentDone: true,
        paymentAmount: totalAmount,
        razorpayOrderId: order.razorpayOrderId,
        paymentId: order.paymentId
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

  getOrderAmount(orderItems: OrderItemDto[]) {
    let amount = 0;
    for (let item of orderItems) {
      const itemCount = item.count
      const totalItemPrice = Number(item.price) * itemCount;
      amount += Number(totalItemPrice)
    }
    return amount.toString();
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

      const confirmOrder = await this.orderModelHelperService.getOrderWithTrackId({ orderTrackId: order.orderTrackId })

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

      const confirmOrder = await this.orderModelHelperService.getOrderWithTrackId({ orderTrackId });

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

  async getStatus(orderTrackId: string) {
    try {
      const order = await this.orderModelHelperService.getPastOrders({ orderTrackId });

      const { orderStatus, orderConfirmedAt, orderOutForDeliveryAt, orderDeliveredAt, orderCancelledAt, orderFailedAt, paymentAmount, paymentStatus, isOrderPlaced, isOrderOutForDelivery, isOrderConfirmed, isOrderDelivered, isOrderFailed, isorderCancelled} = order[0];

      const getFlags = this.flags(orderStatus);

      console.log(`${prefix} (getStatus) flags for orderTrackId: ${orderTrackId} | flags: ${JSON.stringify(getFlags)}`);

      const statusStack = this.getStatusStack(getFlags, {
        orderPlaced: orderConfirmedAt,
        outForDelivery: orderOutForDeliveryAt,
        delivered: orderDeliveredAt,
        orderCancelledAt,
        orderFailedAt
      });

      const response = {
        flags: getFlags,
        statusStack,
        paymentAmount,
        paymentStatus,
        orderTrackId,
        orderStatus, 
        orderConfirmedAt, 
        orderOutForDeliveryAt, 
        orderDeliveredAt, 
        orderCancelledAt, 
        orderFailedAt,
        isOrderPlaced, 
        isOrderOutForDelivery, 
        isOrderConfirmed, 
        isOrderDelivered, 
        isOrderFailed, 
        isorderCancelled
      }

      console.log(`${prefix} (getStatus) response for orderTrackId: ${orderTrackId} | ${JSON.stringify(response)}`);

      return response;
    } catch (error) {
      console.log(`${prefix} (getStatus) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  flags(status: CustomerOrderStatus) {
    try {
      const flags: IOrderStatusFlags = {
        orderPlaced: STATUS_FLAGS.NOT_INITIATED,
        outForDelivery: STATUS_FLAGS.NOT_INITIATED,
        delivered: STATUS_FLAGS.NOT_INITIATED
      }


      if (!status) return flags;

      if ([CustomerOrderStatus.PLACED, CustomerOrderStatus.CONFIRMED].includes(status)) {
        flags.orderPlaced = STATUS_FLAGS.IN_PROGRESS
        if ([CustomerOrderStatus.FAILED, CustomerOrderStatus.CANCELLED].includes(status)) {
          flags.orderPlaced = STATUS_FLAGS.FAILED
        }
      }
      else if ([CustomerOrderStatus.OUT_FOR_DELIVERY].includes(status)) {
        flags.orderPlaced = STATUS_FLAGS.SUCCESS
        flags.outForDelivery = STATUS_FLAGS.IN_PROGRESS
        if ([CustomerOrderStatus.FAILED, CustomerOrderStatus.CANCELLED].includes(status)) {
          flags.outForDelivery = STATUS_FLAGS.FAILED
        }
      }
      else if ([CustomerOrderStatus.DELIVERED].includes(status)) {
        flags.orderPlaced = STATUS_FLAGS.SUCCESS
        flags.outForDelivery = STATUS_FLAGS.SUCCESS
        flags.delivered = STATUS_FLAGS.SUCCESS
        if ([CustomerOrderStatus.FAILED, CustomerOrderStatus.CANCELLED].includes(status)) {
          flags.delivered = STATUS_FLAGS.FAILED
        }
      }

      return flags;
    } catch (error) {
      console.log(`${prefix} (orderStatus) Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  getStatusStack(flags: IOrderStatusFlags, timeStamps: any) {
    const statusStack = [];
    for (let [id, status] of Object.entries(flags)) {
      const stackObj = {
        id,
        status,
        title: orderTitle[id as OREDER_STATUS_ID],
        timeStamp: timeStamps[id]
      }

      if (status == STATUS_FLAGS.FAILED) {
        stackObj.timeStamp = timeStamps?.orderCancelledAt ?? timeStamps?.orderFailedAt
      }

      statusStack.push(stackObj);
    }

    return statusStack;
  }
}