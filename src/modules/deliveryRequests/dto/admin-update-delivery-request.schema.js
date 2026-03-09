import { z } from 'zod';
import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { ensureISODate } from '#shared/utils/ensureISODate.js';
import mongoose from 'mongoose';
import { createGeoPointSchema } from '#shared/utils/dto.helper.js';
import { isValidPhoneNumber } from 'libphonenumber-js';

// Enums from schema
const deliveryTypes = ['food', 'parcel', 'grocery', 'other'];
const serviceTypes = ['immediate', 'scheduled'];
const priorities = ['normal', 'high', 'critical'];
const packageSizes = ['small', 'medium', 'large'];
const serviceLevels = ['standard', 'express'];
const paymentTypes = ['online', 'COD'];
const paymentStatuses = ['pending', 'paid', 'failed'];

const adminUpdateDeliveryRequestSchema = z.object({
  body: z.object({
    type: z
      .enum(deliveryTypes, { errorMap: () => ({ message: ERROR_CODES.INVALID_DELIVERY_TYPE }) })
      .optional(),
    serviceType: z
      .enum(serviceTypes, { errorMap: () => ({ message: ERROR_CODES.INVALID_SERVICE_TYPE }) })
      .optional(),
    scheduledFor: z.preprocess(
      (val) =>
        val ? ensureISODate(val, ERROR_CODES.INVALID_ISO_DATE_FORMAT, 'scheduledFor') : undefined,
      z.date().optional()
    ),
    deliveryDeadline: z.preprocess(
      (val) =>
        val
          ? ensureISODate(val, ERROR_CODES.INVALID_ISO_DATE_FORMAT, 'deliveryDeadline')
          : undefined,
      z.date().optional()
    ),
    priority: z
      .enum(priorities, { errorMap: () => ({ message: ERROR_CODES.INVALID_PRIORITY }) })
      .optional(),

    sender: z
      .object({
        id: z
          .string()
          .nullable()
          .optional()
          .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: ERROR_CODES.INVALID_SENDER_ID,
          }),
        name: z.string().min(1, { message: ERROR_CODES.INVALID_SENDER_NAME }).optional(),
        phone: z
          .string()
          .refine((val) => !val || isValidPhoneNumber(val, 'AF'), {
            message: ERROR_CODES.INVALID_PHONE_NUMBER,
          })
          .optional(),
      })
      .partial()
      .optional(),

    receiver: z
      .object({
        id: z
          .string()
          .nullable()
          .optional()
          .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
            message: ERROR_CODES.INVALID_RECEIVER_ID,
          }),
        name: z.string().min(1, { message: ERROR_CODES.INVALID_RECEIVER_NAME }).optional(),
        phone: z
          .string()
          .refine((val) => !val || isValidPhoneNumber(val, 'AF'), {
            message: ERROR_CODES.INVALID_PHONE_NUMBER,
          })
          .optional(),
        address: z.string().min(1, { message: ERROR_CODES.INVALID_RECEIVER_ADDRESS }).optional(),
      })
      .partial()
      .optional(),

    pickupLocation: createGeoPointSchema(ERROR_CODES.INVALID_PICKUP_COORDINATES).optional(),
    dropoffLocation: createGeoPointSchema(ERROR_CODES.INVALID_DROPOFF_COORDINATES).optional(),

    items: z
      .array(
        z
          .object({
            name: z.string().min(1, { message: ERROR_CODES.INVALID_DELIVERY_TYPE }).optional(),
            quantity: z.preprocess(
              (val) =>
                val !== undefined
                  ? ensureNumber(val, 'items.quantity', ERROR_CODES.INVALID_ITEM_QUANTITY)
                  : undefined,
              z.number().positive({ message: ERROR_CODES.INVALID_ITEM_QUANTITY }).optional()
            ),
            unitPrice: z.preprocess(
              (val) =>
                val !== undefined
                  ? ensureNumber(val, 'items.unitPrice', ERROR_CODES.INVALID_ITEM_UNIT_PRICE)
                  : undefined,
              z.number().nonnegative({ message: ERROR_CODES.INVALID_ITEM_UNIT_PRICE }).optional()
            ),
          })
          .partial()
      )
      .optional(),

    packageDetails: z
      .object({
        weight: z.preprocess(
          (val) =>
            val !== undefined
              ? ensureNumber(val, 'packageDetails.weight', ERROR_CODES.INVALID_PACKAGE_WEIGHT)
              : undefined,
          z.number().nonnegative({ message: ERROR_CODES.INVALID_PACKAGE_WEIGHT }).optional()
        ),
        size: z
          .enum(packageSizes, { errorMap: () => ({ message: ERROR_CODES.INVALID_PACKAGE_SIZE }) })
          .optional(),
        fragile: z.boolean().optional(),
        note: z.string().optional(),
      })
      .partial()
      .optional(),

    serviceLevel: z
      .enum(serviceLevels, { errorMap: () => ({ message: ERROR_CODES.INVALID_SERVICE_LEVEL }) })
      .optional(),

    estimatedPrepTimeMinutes: z.preprocess(
      (val) =>
        val !== undefined
          ? ensureNumber(val, 'estimatedPrepTimeMinutes', ERROR_CODES.INVALID_ESTIMATED_PREP_TIME)
          : undefined,
      z.number().nonnegative({ message: ERROR_CODES.INVALID_ESTIMATED_PREP_TIME }).optional()
    ),

    paymentType: z
      .enum(paymentTypes, { errorMap: () => ({ message: ERROR_CODES.INVALID_PAYMENT_TYPE }) })
      .optional(),
    paymentStatus: z
      .enum(paymentStatuses, { errorMap: () => ({ message: ERROR_CODES.INVALID_PAYMENT_STATUS }) })
      .optional(),

    amountToCollect: z.preprocess(
      (val) =>
        val !== undefined
          ? ensureNumber(val, 'amountToCollect', ERROR_CODES.INVALID_AMOUNT_TO_COLLECT)
          : undefined,
      z.number().nonnegative({ message: ERROR_CODES.INVALID_AMOUNT_TO_COLLECT }).optional()
    ),

    deliveryPrice: z
      .object({
        total: z.preprocess(
          (val) =>
            val !== undefined
              ? ensureNumber(val, 'deliveryPrice.total', ERROR_CODES.INVALID_DELIVERY_PRICE)
              : undefined,
          z.number().nonnegative({ message: ERROR_CODES.INVALID_DELIVERY_PRICE }).optional()
        ),
      })
      .partial()
      .optional(),

    driverId: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
        message: ERROR_CODES.INVALID_DRIVER_ID,
      }),
  }),
});

export const adminUpdateDeliveryRequestValidator = (req) => {
  return adminUpdateDeliveryRequestSchema.safeParse({ body: req.body });
};
