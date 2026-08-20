export const containerStatuses=["REGISTERED","IN_YARD","GATED_OUT","LOADED","DISCHARGED","AVAILABLE","RELEASED","DELIVERED","DAMAGED"] as const;
export type ContainerStatus=typeof containerStatuses[number];
export const bookingStatuses=["DRAFT","CONFIRMED","CANCELLED","COMPLETED"] as const;
export type BookingStatus=typeof bookingStatuses[number];
export interface ApiResponse<T>{success:boolean;data:T|null;error:{code:string;message:string}|null;timestamp:string}
