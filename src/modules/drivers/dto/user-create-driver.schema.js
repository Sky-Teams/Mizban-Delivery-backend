import { ERROR_CODES } from '#shared/errors/customCodes.js';
import { DateHelper } from '#shared/utils/date.helper.js';
import { ensureNumber } from '#shared/utils/ensureNumber.js';
import { FUEL_TYPE, VEHICLE_TYPE } from '#shared/utils/enums.js';
import { getObjectValues } from '#shared/utils/object.helper.js';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';
const vehicleTypes = getObjectValues(VEHICLE_TYPE);
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
// import { ensureISODate } from '#shared/utils/ensureISODate.js';
// const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];

const createDriverProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),

    phone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    vehicleType: z
      .enum(vehicleTypes, {
        errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
      })
      .optional(),

    vehicleRegistrationNumber: z
      .string()
      .min(1, {
        message: ERROR_CODES.VEHICLE_REGISTRATION_REQUIRED,
      })
      .optional(),

    address: z.string().optional().nullable(),

    dateOfBirth: z
      .string()
      .refine(DateHelper.isValidBirthDate, {
        message: ERROR_CODES.INVALID_BIRTH_DATE,
      })
      .optional(),

    vehicleName: z.string().min(2).optional(),

    fuelType: z
      .enum(getObjectValues(FUEL_TYPE), {
        errorMap: () => ({ message: ERROR_CODES.INVALID_FUEL_TYPE }),
      })
      .optional(),

    vehicleColor: z.string().min(2).optional(),

    emergencyContactName: z.string().min(3).optional(),

    emergencyContactNumber: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'AF'), {
        message: ERROR_CODES.INVALID_PHONE_NUMBER,
      })
      .optional(),

    emergencyContactRelation: z.string().min(2).optional(),

    capacity: z
      .object({
        maxWeightKg: z.preprocess(
          (val) =>
            val !== undefined
              ? ensureNumber(val, 'capacity.maxWeightKg', ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER)
              : val,
          z.number().positive().optional()
        ),

        maxPackages: z.preprocess(
          (val) =>
            val !== undefined
              ? ensureNumber(val, 'capacity.maxPackages', ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER)
              : val,
          z.number().int().positive().optional()
        ),
      })
      .optional(),

    timeAvailability: z
      .object({
        start: z
          .string()
          .regex(timeRegex, {
            message: ERROR_CODES.INVALID_TIME_FORMAT,
          })
          .optional(),

        end: z
          .string()
          .regex(timeRegex, {
            message: ERROR_CODES.INVALID_TIME_FORMAT,
          })
          .optional(),
      })
      .partial()
      .refine(
        (data) => {
          if (!data.start || !data.end) return true;

          const [sh, sm] = data.start.split(':').map(Number);
          const [eh, em] = data.end.split(':').map(Number);

          return sh * 60 + sm < eh * 60 + em;
        },
        {
          message: ERROR_CODES.END_TIME_MUST_BE_GREATER,
          path: ['end'],
        }
      )
      .optional(),
  }),
});

export const createDriverProfileValidator = (req) => {
  return createDriverProfileSchema.safeParse({ body: req.body });
};

// const updateDriverSchema = z.object({
//   body: z
//     .object({
//       vehicleType: z
//         .enum(vehicleTypes, {
//           errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
//         })
//         .optional(),

//       status: z
//         .enum(driverStatuses, {
//           errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }),
//         })
//         .optional(),

//       capacity: z
//         .object({
//           maxWeightKg: z
//             .preprocess(
//               (val) =>
//                 val !== undefined &&
//                 ensureNumber(val, 'capacity.maxWeightKg', ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER),
//               z.number().positive({ message: ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE })
//             )
//             .optional(),

//           maxPackages: z
//             .preprocess(
//               (val) =>
//                 val !== undefined &&
//                 ensureNumber(val, 'capacity.maxPackages', ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER),
//               z
//                 .number()
//                 .int({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER })
//                 .positive({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE })
//             )
//             .optional(),
//         })
//         .partial()
//         .optional(),

//       currentLocation: z
//         .object({
//           type: z.literal('Point').optional(),
//           coordinates: z
//             .preprocess(
//               (val) => {
//                 if (!Array.isArray(val) || val.length !== 2) return val;
//                 return val.map((v, i) =>
//                   ensureNumber(
//                     v,
//                     `currentLocation.coordinates[${i}]`,
//                     ERROR_CODES.INVALID_COORDINATES
//                   )
//                 );
//               },
//               z.array(z.number()).length(2, { message: ERROR_CODES.INVALID_COORDINATES })
//             )
//             .optional(),
//         })
//         .partial()
//         .optional(),

//       lastLocationAt: z.preprocess(
//         (val) =>
//           val
//             ? ensureISODate(val, ERROR_CODES.INVALID_ISO_DATE_FORMAT, 'lastLocationAt')
//             : undefined,
//         z.date().optional()
//       ),
//     })
//     .partial(),
// });

// export const updateDriverValidator = (req) => {
//   return updateDriverSchema.safeParse({ body: req.body });
// };
