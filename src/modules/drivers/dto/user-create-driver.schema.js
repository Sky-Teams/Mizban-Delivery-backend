// import { ERROR_CODES } from '#shared/errors/customCodes.js';
// import { ensureNumber } from '#shared/utils/ensureNumber.js';
// import { z } from 'zod';
// import { ensureISODate } from '#shared/utils/ensureISODate.js';
// const vehicleTypes = ['bike', 'car', 'van'];
// const driverStatuses = ['offline', 'idle', 'assigned', 'delivering'];
// const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Maybe in future we will need these validators.

// const createDriverSchema = z.object({
//   body: z.object({
//     vehicleType: z.enum(vehicleTypes, {
//       errorMap: () => ({ message: ERROR_CODES.INVALID_VEHICLE_TYPE }),
//     }),
//     status: z
//       .enum(driverStatuses, { errorMap: () => ({ message: ERROR_CODES.INVALID_STATUS }) })
//       .optional(),
//     capacity: z.object({
//       maxWeightKg: z.preprocess(
//         (val) => ensureNumber(val, 'capacity.maxWeightKg', ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER),
//         z.number().positive({ message: ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE })
//       ),
//       maxPackages: z.preprocess(
//         (val) => ensureNumber(val, 'capacity.maxPackages', ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER),
//         z
//           .number()
//           .int({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER })
//           .positive({ message: ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE })
//       ),
//     }),
//     vehicleRegistrationNumber: z
//       .string()
//       .min(1, { message: ERROR_CODES.VEHICLE_REGISTRATION_REQUIRED }),

//     address: z.string().optional().nullable(),
//     timeAvailability: z
//       .object({
//         start: z.string().regex(timeRegex, {
//           message: ERROR_CODES.INVALID_TIME_FORMAT,
//         }),

//         end: z.string().regex(timeRegex, {
//           message: ERROR_CODES.INVALID_TIME_FORMAT,
//         }),
//       })
//       .refine(
//         (data) => {
//           const [startH, startM] = data.start.split(':').map(Number);
//           const [endH, endM] = data.end.split(':').map(Number);

//           const startMinutes = startH * 60 + startM;
//           const endMinutes = endH * 60 + endM;

//           return startMinutes < endMinutes;
//         },
//         {
//           message: ERROR_CODES.END_TIME_MUST_BE_GREATER,
//           path: ['end'],
//         }
//       ),
//   }),
// });

// export const createDriverValidator = (req) => {
//   return createDriverSchema.safeParse({ body: req.body });
// };

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
