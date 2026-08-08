export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_ME: '/api/auth/me',
  AUTH_LOGOUT: '/api/auth/logout',

  // Customers
  CUSTOMERS: '/api/customers',
  CUSTOMER: (id: string) => `/api/customers/${id}`,
  CUSTOMER_CREDIT: (id: string) => `/api/customers/${id}/credit`,

  // Bookings
  BOOKINGS: '/api/bookings',
  BOOKING: (id: string) => `/api/bookings/${id}`,
  BOOKING_APPROVE: (id: string) => `/api/bookings/${id}/approve`,
  BOOKING_STATUS: (id: string) => `/api/bookings/${id}/status`,

  // Containers
  CONTAINERS: '/api/containers',
  CONTAINER: (id: string) => `/api/containers/${id}`,
  CONTAINER_TRACKING: (id: string) => `/api/containers/${id}/tracking`,

  // Bill of Lading
  BOL_DRAFT: '/api/bill-of-lading/draft',
  BOL_SUBMIT: '/api/bill-of-lading/submit',
  BOL_PREVIEW: '/api/bill-of-lading/preview',
  BOL: (id: string) => `/api/bill-of-lading/${id}`,
  BOL_PDF: (id: string) => `/api/bill-of-lading/${id}/pdf`,
  BOL_AMEND: (id: string) => `/api/bill-of-lading/${id}/amend`,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
