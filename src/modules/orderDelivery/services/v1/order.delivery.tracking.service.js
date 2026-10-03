import { OrderDeliveryModel } from '#modules/orderDelivery/models/v1/order.delivery.tracking.model.js';
import { notFound } from '#shared/errors/error.js';

export const createOrderDelivery = async (driverId, orderId) => {
  await OrderDeliveryModel.findOneAndUpdate(
    {
      order: orderId,
    },
    {
      $setOnInsert: {
        order: orderId,
        driver: driverId,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
};

export const getOrderDeliveryByOrderId = async (orderId) => {
  const delivery = await OrderDeliveryModel.findOne({
    order: orderId,
  });

  if (!delivery) {
    throw notFound('order delivery');
  }

  return delivery;
};

export const startToPickup = async (orderId) => {
  const startedAt = new Date();

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
      'toPickUp.startedAt': null,
    },
    {
      $set: {
        'toPickUp.startedAt': startedAt,
      },
    }
  );
};

export const addToPickupDistance = async (orderId, distance) => {
  if (distance <= 0) return;

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
    },
    {
      $inc: {
        'toPickUp.distanceMeters': distance,
      },
    }
  );
};

export const completeToPickup = async (orderId) => {
  const orderDelivery = await getOrderDeliveryByOrderId(orderId);

  const endedAt = new Date();
  const startedAt = orderDelivery.toPickUp.startedAt;

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
    },
    {
      $set: {
        'toPickUp.endedAt': endedAt,
        'toPickUp.durationSeconds': Math.floor((endedAt - startedAt) / 1000),
      },
    }
  );
};

export const startToDelivery = async (orderId) => {
  const startedAt = new Date();

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
      'toDelivery.startedAt': null,
    },
    {
      $set: {
        'toDelivery.startedAt': startedAt,
      },
    }
  );
};

export const addToDeliveryDistance = async (orderId, distance) => {
  if (distance <= 0) return;

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
    },
    {
      $inc: {
        'toDelivery.distanceMeters': distance,
      },
    }
  );
};

export const completeToDelivery = async (orderId) => {
  const orderDelivery = await getOrderDeliveryByOrderId(orderId);

  const endedAt = new Date();
  const startedAt = orderDelivery.toDelivery.startedAt;

  await OrderDeliveryModel.updateOne(
    {
      order: orderId,
      'toDelivery.endedAt': null,
    },
    {
      $set: {
        'toDelivery.endedAt': endedAt,
        'toDelivery.durationSeconds': Math.floor((endedAt - startedAt) / 1000),
      },
    }
  );
};
