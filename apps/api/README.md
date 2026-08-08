# MEGAZEN API Documentation

## Overview

This is the Express.js backend API for the MEGAZEN maritime logistics platform. It provides comprehensive REST endpoints for managing bookings, containers, vessels, release orders, delivery orders, and bills of lading.

## Setup

```bash
cd apps/api
pnpm install
pnpm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://megazen:megazen123@localhost:5432/megazen
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
API_PORT=3001
NODE_ENV=development
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Customers

- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/credit` - Check customer credit

### Bookings

- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking (auto-approval)
- `PUT /api/bookings/:id` - Update booking
- `PUT /api/bookings/:id/approve` - Manual approval
- `GET /api/bookings/:id/status` - Get booking status

### Containers

- `GET /api/containers` - List containers
- `GET /api/containers/:id` - Get container details
- `POST /api/containers` - Register container
- `PUT /api/containers/:id` - Update container
- `GET /api/containers/:id/tracking` - Real-time tracking

### Bill of Lading

- `POST /api/bill-of-lading/draft` - Save B/L draft
- `POST /api/bill-of-lading/submit` - Submit B/L for validation
- `POST /api/bill-of-lading/preview` - Generate preview
- `PUT /api/bill-of-lading/:id` - Update B/L
- `PUT /api/bill-of-lading/:id/amend` - Amend B/L (max 3 amendments)
- `POST /api/bill-of-lading/:id/issue` - Issue B/L
- `GET /api/bill-of-lading/:id/pdf` - Download PDF
- `GET /api/bill-of-lading/verify/:hash` - Verify authenticity

## Business Logic

### Auto-Approval Workflow

Bookings are automatically approved when:
1. Customer is active and not suspended
2. Credit limit covers booking value
3. No dangerous goods (Class 1-7)
4. All mandatory fields are filled
5. No active holds on customer

Manual approval required for:
- Credit limit exceeded
- Dangerous goods shipments
- New customers (first 3 bookings)
- Overweight containers (>30 tons)
- High-value cargo (>$1,000,000)

### Container Assignment

Intelligent matching based on cargo type:
- **Food products**: Clean, food-grade containers
- **Chemicals**: Specific lining, no previous residue
- **Electronics**: Ventilated, low humidity
- **Refrigerated**: Reefer with working sensors
- **Oversized**: Open top/Flat rack
- **Heavy cargo**: Weight capacity verification

### Bill of Lading Amendments

- Maximum 3 amendments per B/L
- After 3rd amendment: fee invoice auto-generated
- Each amendment requires reason
- Version tracking
- QR code reflects version

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## WebSocket Events

### Subscribe to Real-time Updates

```javascript
const socket = io('http://localhost:3001');

socket.emit('subscribe_tracking', {
  containerId: 'container-id',
  tenantId: 'tenant-id'
});

socket.on('container_status_changed', (data) => {
  console.log('Container status updated:', data);
});
```

### Available Events

- `booking_created`
- `booking_approved`
- `booking_updated`
- `container_status_changed`
- `release_order_issued`
- `delivery_order_issued`
- `bol_draft_saved`
- `bol_submitted`
- `bol_issued`
- `bol_amended`
