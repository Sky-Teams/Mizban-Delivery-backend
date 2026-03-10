import { ERROR_CODES } from '../errors/customCodes.js';

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: {
    en: 'Validation error',
    fa: 'خطای اعتبارسنجی',
    ps: 'د اعتبار تېروتنه',
  },
  [ERROR_CODES.ROUTE_NOT_FOUND]: {
    en: 'Route not found',
    fa: 'مسیر پیدا نشد',
    ps: 'لار ونه موندل شو',
  },

  [ERROR_CODES.INVALID_CREDENTIAL]: {
    en: 'Invalid credentials',
    fa: 'اطلاعات ورود نادرست است',
    ps: 'د ننوتلو معلومات ناسم دي',
  },

  [ERROR_CODES.SERVER_ERROR]: {
    en: 'Server error',
    fa: 'خطای سرور',
    ps: 'د سرور تېروتنه',
  },

  [ERROR_CODES.UNAUTHORIZED]: {
    en: 'Unauthorized access',
    fa: 'دسترسی غیرمجاز',
    ps: 'غیر مجاز لاسرسی',
  },

  [ERROR_CODES.FORBIDDEN]: {
    en: 'Access forbidden',
    fa: 'دسترسی ممنوع',
    ps: 'لاسرسی منع ده',
  },

  [ERROR_CODES.INVALID_JWT]: {
    en: 'Invalid or expired token',
    fa: 'توکن نامعتبر یا منقضی شده است',
    ps: 'توکن ناسم یا پای ته رسېدلی دی',
  },

  [ERROR_CODES.NOT_FOUND]: {
    en: 'Resource not found',
    fa: 'مورد پیدا نشد',
    ps: 'مورد ونه موندل شو',
  },

  [ERROR_CODES.DUPLICATE]: {
    en: 'Duplicate value detected',
    fa: 'مقدار تکراری است',
    ps: 'تکراري ارزښت وموندل شو',
  },

  [ERROR_CODES.REQUIRED_FIELD]: {
    en: 'Required field is missing',
    fa: 'فیلد الزامی است',
    ps: 'اړین فیلډ نشته',
  },

  [ERROR_CODES.PASSWORD_CHANGED]: {
    en: 'Password has been changed',
    fa: 'رمز عبور تغییر کرده است',
    ps: 'پټنوم بدل شوی دی',
  },

  [ERROR_CODES.NO_FIELDS_PROVIDED]: {
    en: 'No fields provided for update',
    fa: 'هیچ فیلدی برای به‌روزرسانی ارائه نشده',
    ps: 'د تازه کولو لپاره هېڅ فیلډ نه دی ورکړل شوی',
  },

  [ERROR_CODES.BUSINESS_CUSTOMER_ALREADY_EXIST]: {
    en: 'Business customer already exists',
    fa: 'مشتری تجاری از قبل وجود دارد',
    ps: 'سوداګریز مشتری مخکې موجود دی',
  },

  [ERROR_CODES.LENGTH_IS_TOO_SHORT]: {
    en: 'Value length is too short',
    fa: 'طول مقدار خیلی کوتاه است',
    ps: 'د ارزښت اوږدوالی ډېر لنډ دی',
  },

  [ERROR_CODES.INVALID_BUSINESS_TYPE]: {
    en: 'Invalid business type',
    fa: 'نوع کسب‌وکار نامعتبر است',
    ps: 'د سوداګرۍ ډول ناسم دی',
  },

  [ERROR_CODES.PREP_TIME_MUST_BE_POSITIVE]: {
    en: 'Preparation time must be positive',
    fa: 'زمان آماده‌سازی باید مثبت باشد',
    ps: 'د چمتو کولو وخت باید مثبت وي',
  },

  [ERROR_CODES.INVALID_LOCATION_TYPE]: {
    en: 'Invalid location type',
    fa: 'نوع موقعیت نامعتبر است',
    ps: 'د موقعیت ډول ناسم دی',
  },

  [ERROR_CODES.ACCOUNT_DISABLED]: {
    en: 'Account is disabled',
    fa: 'حساب کاربری غیرفعال است',
    ps: 'حساب غیر فعال دی',
  },

  [ERROR_CODES.PASSWORD_TOO_SHORT]: {
    en: 'Password is too short',
    fa: 'رمز عبور خیلی کوتاه است',
    ps: 'پټنوم ډېر لنډ دی',
  },

  [ERROR_CODES.INVALID_EMAIL_FORMAT]: {
    en: 'Invalid email format',
    fa: 'فرمت ایمیل نامعتبر است',
    ps: 'د ایمیل بڼه ناسمه ده',
  },

  [ERROR_CODES.INVALID_PHONE_NUMBER]: {
    en: 'Invalid phone number',
    fa: 'شماره تلفن نامعتبر است',
    ps: 'د ټیلیفون شمېره ناسمه ده',
  },

  [ERROR_CODES.INVALID_EMAIL]: {
    en: 'Invalid email address',
    fa: 'ایمیل نامعتبر است',
    ps: 'ایمیل ناسم دی',
  },

  [ERROR_CODES.NAME_TOO_SHORT]: {
    en: 'Name is too short',
    fa: 'نام خیلی کوتاه است',
    ps: 'نوم ډېر لنډ دی',
  },

  [ERROR_CODES.PASSWORD_MUST_BE_AT_LEAST_6_CHARACTERS]: {
    en: 'Password must be at least 6 characters',
    fa: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    ps: 'پټنوم باید لږ تر لږه ۶ توري ولري',
  },

  [ERROR_CODES.DRIVER_ALREADY_EXIST]: {
    en: 'Driver already exists',
    fa: 'راننده از قبل وجود دارد',
    ps: 'چلوونکی مخکې موجود دی',
  },

  [ERROR_CODES.INVALID_VEHICLE_TYPE]: {
    en: 'Invalid vehicle type',
    fa: 'نوع وسیله نقلیه نامعتبر است',
    ps: 'د موټر ډول ناسم دی',
  },

  [ERROR_CODES.INVALID_STATUS]: {
    en: 'Invalid status value',
    fa: 'وضعیت نامعتبر است',
    ps: 'حالت ناسم دی',
  },

  [ERROR_CODES.MAX_WEIGHT_MUST_BE_NUMBER]: {
    en: 'Max weight must be a number',
    fa: 'حداکثر وزن باید عدد باشد',
    ps: 'اعظمي وزن باید شمېره وي',
  },

  [ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE]: {
    en: 'Max weight must be positive',
    fa: 'حداکثر وزن باید مثبت باشد',
    ps: 'اعظمي وزن باید مثبت وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER]: {
    en: 'Max packages must be a number',
    fa: 'حداکثر بسته‌ها باید عدد باشد',
    ps: 'اعظمي کڅوړې باید شمېره وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER]: {
    en: 'Max packages must be an integer',
    fa: 'حداکثر بسته‌ها باید عدد صحیح باشد',
    ps: 'اعظمي کڅوړې باید صحیح عدد وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE]: {
    en: 'Max packages must be positive',
    fa: 'حداکثر بسته‌ها باید مثبت باشد',
    ps: 'اعظمي کڅوړې باید مثبت وي',
  },

  [ERROR_CODES.INVALID_USER_ID]: {
    en: 'Invalid user ID',
    fa: 'شناسه کاربر نامعتبر است',
    ps: 'د کارونکي پېژند ناسم دی',
  },

  [ERROR_CODES.INVALID_NOTIFICATION_TYPE]: {
    en: 'Invalid notification type',
    fa: 'نوع اعلان نامعتبر است',
    ps: 'د خبرتیا ډول ناسم دی',
  },

  [ERROR_CODES.TITLE_REQUIRED]: {
    en: 'Title is required',
    fa: 'عنوان الزامی است',
    ps: 'سرلیک اړین دی',
  },

  [ERROR_CODES.TITLE_TOO_LONG]: {
    en: 'Title is too long',
    fa: 'عنوان خیلی طولانی است',
    ps: 'سرلیک ډېر اوږد دی',
  },

  [ERROR_CODES.MESSAGE_TOO_LONG]: {
    en: 'Message is too long',
    fa: 'پیام خیلی طولانی است',
    ps: 'پیغام ډېر اوږد دی',
  },

  [ERROR_CODES.ALREADY_MARKED_AS_READ]: {
    en: 'Already marked as read',
    fa: 'قبلاً خوانده شده است',
    ps: 'مخکې لوستل شوی',
  },

  [ERROR_CODES.ALREADY_MARKED_AS_UNREAD]: {
    en: 'Already marked as unread',
    fa: 'قبلاً خوانده نشده است',
    ps: 'مخکې نالوستل شوی',
  },

  [ERROR_CODES.LNG_OUT_OF_RANGE]: {
    en: 'Longitude is out of range',
    fa: 'طول جغرافیایی خارج از محدوده است',
    ps: 'طول البلد له حد څخه بهر دی',
  },

  [ERROR_CODES.LAT_OUT_OF_RANGE]: {
    en: 'Latitude is out of range',
    fa: 'عرض جغرافیایی خارج از محدوده است',
    ps: 'عرض البلد له حد څخه بهر دی',
  },

  [ERROR_CODES.PREP_TIME_MUST_BE_INTEGER]: {
    en: 'Preparation time must be an integer',
    fa: 'زمان آماده‌سازی باید عدد صحیح باشد',
    ps: 'د چمتو کولو وخت باید صحیح عدد وي',
  },

  [ERROR_CODES.INVALID_COORDINATES]: {
    en: 'Invalid coordinates',
    fa: 'مختصات نامعتبر است',
    ps: 'مختصات ناسم دي',
  },

  [ERROR_CODES.INVALID_ISO_DATE_FORMAT]: {
    en: 'Invalid ISO date format',
    fa: 'فرمت تاریخ نامعتبر است',
    ps: 'د نټې بڼه ناسمه ده',
  },

  [ERROR_CODES.INVALID_ID]: {
    en: 'Invalid ID',
    fa: 'شناسه نامعتبر است',
    ps: 'پېژند ناسم دی',
  },

  [ERROR_CODES.TRANSACTION_FAILED]: {
    en: 'Transaction failed',
    fa: 'تراکنش ناموفق بود',
    ps: 'معامله ناکامه شوه',
  },

  [ERROR_CODES.INVALID_TIME_FORMAT]: {
    en: 'Invalid time format',
    fa: 'فرمت زمان نامعتبر است',
    ps: 'د وخت بڼه ناسمه ده',
  },

  [ERROR_CODES.END_TIME_MUST_BE_GREATER]: {
    en: 'End time must be greater than start time',
    fa: 'زمان پایان باید بزرگتر از زمان شروع باشد',
    ps: 'د پای وخت باید د پیل وخت څخه لوی وي',
  },

  [ERROR_CODES.ADDRESS_TEXT_IS_TOO_SHORT]: {
    en: 'Address text is too short',
    fa: 'متن آدرس خیلی کوتاه است',
    ps: 'د پته متن ډېر لنډ دی',
  },
};
