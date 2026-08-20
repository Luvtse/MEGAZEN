export type EntityId = string;
export interface DomainEvent<T extends object = object>{readonly eventId:string;readonly type:string;readonly aggregateId:EntityId;readonly occurredAt:Date;readonly payload:T}
export class AppError extends Error{constructor(public readonly message:string,public readonly statusCode=500,public readonly code="INTERNAL_ERROR"){super(message);this.name="AppError"}}
export const createId=():string=>crypto.randomUUID();
