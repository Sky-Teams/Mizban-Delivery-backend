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
    fa: 'رمز عبور تغییر کرده است. لطفا دوباره وارد شوید.',
    ps: 'پټنوم بدل شوی دی',
  },

  [ERROR_CODES.PASSWORDS_NOT_MATCHES]: {
    en: 'Passwords do not match',
    fa: 'رمزهای عبور مطابقت ندارند',
    ps: 'پټنومونه سره سمون نلري',
  },

  [ERROR_CODES.NO_FIELDS_PROVIDED]: {
    en: 'No fields provided for update',
    fa: ' هیچ فیلدی برای به‌روزرسانی ارائه نشده است.',
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
    fa: 'زمان آماده‌سازی باید یک عدد مثبت باشد',
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
    fa: 'حداکثر وزن باید یک عدد باشد',
    ps: 'اعظمي وزن باید شمېره وي',
  },

  [ERROR_CODES.MAX_WEIGHT_MUST_BE_POSITIVE]: {
    en: 'Max weight must be positive',
    fa: 'حداکثر وزن باید یک عدد مثبت باشد',
    ps: 'اعظمي وزن باید مثبت وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_NUMBER]: {
    en: 'Max packages must be a number',
    fa: 'حداکثر بسته‌ها باید یک عدد باشد',
    ps: 'اعظمي کڅوړې باید شمېره وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_INTEGER]: {
    en: 'Max packages must be an integer',
    fa: 'حداکثر بسته‌ها باید یک عدد تام باشد',
    ps: 'اعظمي کڅوړې باید تام عدد وي',
  },

  [ERROR_CODES.MAX_PACKAGES_MUST_BE_POSITIVE]: {
    en: 'Max packages must be positive',
    fa: 'حداکثر بسته‌ها باید یک عدد مثبت باشد',
    ps: 'اعظمي کڅوړې باید مثبت وي',
  },

  [ERROR_CODES.INVALID_USER_ID]: {
    en: 'Invalid user ID',
    fa: 'آیدی کاربر نامعتبر است',
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
    fa: 'طول البلد جغرافیایی خارج از محدوده است',
    ps: 'طول البلد له حد څخه بهر دی',
  },

  [ERROR_CODES.LAT_OUT_OF_RANGE]: {
    en: 'Latitude is out of range',
    fa: 'عرض البلد جغرافیایی خارج از محدوده است',
    ps: 'عرض البلد له حد څخه بهر دی',
  },

  [ERROR_CODES.PREP_TIME_MUST_BE_INTEGER]: {
    en: 'Preparation time must be an integer',
    fa: 'زمان آماده‌سازی باید یک عدد صحیح باشد',
    ps: 'د چمتو کولو وخت باید صحیح عدد وي',
  },

  [ERROR_CODES.INVALID_COORDINATES]: {
    en: 'Invalid coordinates',
    fa: 'مختصات جغرافیایی نامعتبر است',
    ps: 'مختصات ناسم دي',
  },

  [ERROR_CODES.INVALID_ISO_DATE_FORMAT]: {
    en: 'Invalid ISO date format',
    fa: 'فرمت تاریخ نامعتبر است',
    ps: 'د نټې بڼه ناسمه ده',
  },

  [ERROR_CODES.INVALID_ID]: {
    en: 'Invalid ID',
    fa: 'آیدی نامعتبر است',
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
    fa: 'زمان ختم باید بزرگتر از زمان شروع باشد',
    ps: 'د پای وخت باید د پیل وخت څخه لوی وي',
  },

  [ERROR_CODES.ADDRESS_TEXT_IS_TOO_SHORT]: {
    en: 'Address text is too short',
    fa: 'متن آدرس خیلی کوتاه است',
    ps: 'د پته متن ډېر لنډ دی',
  },
  [ERROR_CODES.INVALID_ITEM_QUANTITY]: {
    en: 'Invalid item quantity',
    fa: 'تعداد آیتم نامعتبر است',
    ps: 'د توکي شمېر ناسم دی',
  },

  [ERROR_CODES.INVALID_ITEM_UNIT_PRICE]: {
    en: 'Invalid item unit price',
    fa: 'قیمت واحد آیتم نامعتبر است',
    ps: 'د توکي واحد قیمت ناسم دی',
  },

  [ERROR_CODES.INVALID_DELIVERY_TYPE]: {
    en: 'Invalid delivery type',
    fa: 'نوع تحویل نامعتبر است',
    ps: 'د تحویلي ډول ناسم دی',
  },

  [ERROR_CODES.INVALID_SERVICE_TYPE]: {
    en: 'Invalid service type',
    fa: 'نوع سرویس نامعتبر است',
    ps: 'د خدمت ډول ناسم دی',
  },

  [ERROR_CODES.INVALID_PRIORITY]: {
    en: 'Invalid priority',
    fa: 'اولویت نامعتبر است',
    ps: 'لومړیتوب ناسم دی',
  },

  [ERROR_CODES.INVALID_PACKAGE_SIZE]: {
    en: 'Invalid package size',
    fa: 'اندازه بسته نامعتبر است',
    ps: 'د کڅوړې اندازه ناسمه ده',
  },

  [ERROR_CODES.INVALID_SERVICE_LEVEL]: {
    en: 'Invalid service level',
    fa: 'سطح سرویس نامعتبر است',
    ps: 'د خدمت کچه ناسمه ده',
  },

  [ERROR_CODES.INVALID_PAYMENT_TYPE]: {
    en: 'Invalid payment type',
    fa: 'نوع پرداخت نامعتبر است',
    ps: 'د تادیې ډول ناسم دی',
  },

  [ERROR_CODES.INVALID_PAYMENT_STATUS]: {
    en: 'Invalid payment status',
    fa: 'وضعیت پرداخت نامعتبر است',
    ps: 'د تادیې حالت ناسم دی',
  },

  [ERROR_CODES.INVALID_PACKAGE_WEIGHT]: {
    en: 'Invalid package weight',
    fa: 'وزن بسته نامعتبر است',
    ps: 'د کڅوړې وزن ناسم دی',
  },

  [ERROR_CODES.INVALID_ESTIMATED_PREP_TIME]: {
    en: 'Invalid estimated preparation time',
    fa: 'زمان تخمینی آماده‌سازی نامعتبر است',
    ps: 'د اټکلي چمتو کولو وخت ناسم دی',
  },

  [ERROR_CODES.INVALID_AMOUNT_TO_COLLECT]: {
    en: 'Invalid amount to collect',
    fa: 'مبلغ قابل دریافت نامعتبر است',
    ps: 'د راټولولو اندازه ناسمه ده',
  },

  [ERROR_CODES.INVALID_DELIVERY_PRICE]: {
    en: 'Invalid delivery price',
    fa: 'قیمت تحویل نامعتبر است',
    ps: 'د تحویلي قیمت ناسم دی',
  },

  [ERROR_CODES.INVALID_SENDER_NAME]: {
    en: 'Invalid sender name',
    fa: 'نام فرستنده نامعتبر است',
    ps: 'د لېږونکي نوم ناسم دی',
  },

  [ERROR_CODES.INVALID_SENDER_PHONE]: {
    en: 'Invalid sender phone',
    fa: 'شماره تلفن فرستنده نامعتبر است',
    ps: 'د لېږونکي د ټیلیفون شمېره ناسمه ده',
  },

  [ERROR_CODES.INVALID_RECEIVER_NAME]: {
    en: 'Invalid receiver name',
    fa: 'نام گیرنده نامعتبر است',
    ps: 'د ترلاسه کوونکي نوم ناسم دی',
  },

  [ERROR_CODES.INVALID_RECEIVER_PHONE]: {
    en: 'Invalid receiver phone',
    fa: 'شماره تلفن گیرنده نامعتبر است',
    ps: 'د ترلاسه کوونکي د ټیلیفون شمېره ناسمه ده',
  },

  [ERROR_CODES.INVALID_RECEIVER_ADDRESS]: {
    en: 'Invalid receiver address',
    fa: 'آدرس گیرنده نامعتبر است',
    ps: 'د ترلاسه کوونکي پته ناسمه ده',
  },

  [ERROR_CODES.INVALID_RECEIVER_COORDINATES]: {
    en: 'Invalid receiver coordinates',
    fa: 'مختصات گیرنده نامعتبر است',
    ps: 'د ترلاسه کوونکي مختصات ناسم دي',
  },

  [ERROR_CODES.INVALID_PICKUP_COORDINATES]: {
    en: 'Invalid pickup coordinates',
    fa: 'مختصات محل دریافت نامعتبر است',
    ps: 'د اخیستلو ځای مختصات ناسم دي',
  },

  [ERROR_CODES.INVALID_DROPOFF_COORDINATES]: {
    en: 'Invalid dropoff coordinates',
    fa: 'مختصات محل تحویل نامعتبر است',
    ps: 'د سپارلو ځای مختصات ناسم دي',
  },

  [ERROR_CODES.INVALID_DRIVER_ID]: {
    en: 'Invalid driver ID',
    fa: 'آیدی راننده نامعتبر است',
    ps: 'د چلوونکي پېژند ناسم دی',
  },

  [ERROR_CODES.INVALID_RECEIVER_ID]: {
    en: 'Invalid receiver ID',
    fa: 'آیدی گیرنده نامعتبر است',
    ps: 'د ترلاسه کوونکي پېژند ناسم دی',
  },

  [ERROR_CODES.INVALID_SENDER_ID]: {
    en: 'Invalid sender ID',
    fa: 'آیدی فرستنده نامعتبر است',
    ps: 'د لېږونکي پېژند ناسم دی',
  },

  [ERROR_CODES.BUSINESS_ALREADY_EXIST]: {
    en: 'Business already exists',
    fa: 'کسب‌وکار از قبل وجود دارد',
    ps: 'سوداګري مخکې موجوده ده',
  },

  [ERROR_CODES.UPDATE_NOT_AVAILABLE]: {
    en: 'Update not available',
    fa: 'به‌روزرسانی در دسترس نیست',
    ps: 'تازه کول شتون نه لري',
  },

  [ERROR_CODES.DRIVER_ASSIGNMENT_NOT_ALLOWED]: {
    en: 'Driver assignment is not allowed',
    fa: 'اختصاص راننده مجاز نیست',
    ps: 'د چلوونکي ټاکل اجازه نه لري',
  },

  [ERROR_CODES.DRIVER_NOT_IDLE]: {
    en: 'Driver is not idle',
    fa: 'راننده در حالت آماده نیست',
    ps: 'چلوونکی خالي نه دی',
  },

  [ERROR_CODES.PICKUP_NOT_ALLOWED]: {
    en: 'Pickup not allowed',
    fa: 'دریافت مجاز نیست',
    ps: 'اخیستل اجازه نه لري',
  },

  [ERROR_CODES.DELIVERY_NOT_DELIVERABLE]: {
    en: 'Delivery is not deliverable',
    fa: 'تحویل امکان‌پذیر نیست',
    ps: 'تحویلي ممکنه نه ده',
  },

  [ERROR_CODES.CANCEL_NOT_ALLOWED]: {
    en: 'Cancel not allowed',
    fa: 'لغو مجاز نیست',
    ps: 'لغوه اجازه نه لري',
  },

  [ERROR_CODES.INVALID_CANCEL_REASON]: {
    en: 'Invalid cancel reason',
    fa: 'دلیل لغو نامعتبر است',
    ps: 'د لغوه دلیل ناسم دی',
  },

  [ERROR_CODES.INVALID_ITEM_NAME]: {
    en: 'Invalid item name',
    fa: 'نام آیتم نامعتبر است',
    ps: 'د توکي نوم ناسم دی',
  },
  [ERROR_CODES.PAGE_PARAMETER_MUST_BE_INTEGER]: {
    en: 'Page parameter must be an integer',
    fa: 'پارامتر صفحه باید یک عدد صحیح باشد',
    ps: 'د پاڼې پارامتر باید صحیح عدد وي',
  },

  [ERROR_CODES.PAGE_PARAMETER_MUST_BE_POSITIVE]: {
    en: 'Page parameter must be positive',
    fa: 'پارامتر صفحه باید یک عدد مثبت باشد',
    ps: 'د پاڼې پارامتر باید مثبت وي',
  },

  [ERROR_CODES.LIMIT_PARAMETER_MUST_BE_INTEGER]: {
    en: 'Limit parameter must be an integer',
    fa: 'پارامتر محدودیت باید یک عدد صحیح باشد',
    ps: 'د محدودیت پارامتر باید صحیح عدد وي',
  },

  [ERROR_CODES.LIMIT_PARAMETER_MUST_BE_POSITIVE]: {
    en: 'Limit parameter must be positive',
    fa: 'پارامتر محدودیت باید یک عدد مثبت باشد',
    ps: 'د محدودیت پارامتر باید مثبت وي',
  },

  [ERROR_CODES.INVALID_BOOLEAN_TYPE]: {
    en: 'Invalid boolean value',
    fa: 'مقدار بولین نامعتبر است',
    ps: 'د بولین ارزښت ناسم دی',
  },

  [ERROR_CODES.INVALID_SORT_OPTION]: {
    en: 'Invalid sort option',
    fa: 'گزینه مرتب‌سازی نامعتبر است',
    ps: 'د ترتیب انتخاب ناسم دی',
  },

  [ERROR_CODES.INVALID_GOOGLE_TOKEN]: {
    en: 'Invalid google token',
    fa: 'توکن گوگل نامعتبر هست',
    ps: 'د گوگل توکن نامعتبر دی',
  },

  [ERROR_CODES.LOGOUT_INVALID_SESSION]: {
    en: 'Logout failed. Please try again.',
    fa: 'خروج انجام نشد، لطفاً دوباره تلاش کنید.',
    ps: 'وتل ممکن نه شول، مهرباني وکړئ بیا هڅه وکړئ.',
  },
  
  [ERROR_CODES.PASSWORD_NOT_MATCHING]: {
    en: 'Passwords do not match',
    fa: 'رمز عبور مطابقت ندارد',
    ps: 'پټنومونه سره نه سمون خوري',
  },

  [ERROR_CODES.INVALID_TOKEN]: {
    en: 'Invalid token',
    fa: 'توکن نا معتبر است',
    ps: 'توکن ناسم دی',
  },

  [ERROR_CODES.INVALID_RESET_PASSWORD_TOKEN]: {
    en: 'The password reset token is invalid',
    fa: 'توکن بازیابی رمز عبور نامعتبر است',
    ps: 'د پټنوم د بیا تنظیم ټوکن ناسم دی',
  },
  [ERROR_CODES.INVALID_ORDER_ID]: {
    en: 'Invalid order ID',
    fa: 'آیدی سفارش نامعتبر است',
    ps: 'د امر پېژند ناسم دی',
  },
};
