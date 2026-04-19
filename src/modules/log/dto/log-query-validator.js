import { ERROR_CODES } from '#shared/errors/customCodes.js';
import z from 'zod';

export const queryValidator = z.object({
  query: z.object({
    page: z.coerce
      .number({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_INTEGER })
      .int({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_INTEGER })
      .positive({ message: ERROR_CODES.PAGE_PARAMETER_MUST_BE_POSITIVE })
      .optional(),
    limit: z.coerce
      .number({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_INTEGER })
      .int({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_INTEGER })
      .positive({ message: ERROR_CODES.LIMIT_PARAMETER_MUST_BE_POSITIVE })
      .optional(),
    date: z.string().date({ message: ERROR_CODES.INVALID_DATE_FORMAT }).optional(),
    sort: z
      .enum(['newest', 'oldest'], {
        message: ERROR_CODES.INVALID_SORT_OPTION,
      })
      .optional(),
    type: z
      .enum(['application', 'error', 'audit', 'exceptions'], {
        message: ERROR_CODES.INVALID_LOG_FILE_TYPE,
      })
      .optional(),
    method: z
      .enum(['post', 'get', 'delete', 'put', 'patch'], {
        message: ERROR_CODES.INVALID_METHOD_OPTIONS,
      })
      .optional(),
  }),
});

export const logQueryValidator = (req) => {
  return queryValidator.safeParse({ query: req.query });
};
