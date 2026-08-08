# MEGAZEN Web Frontend

## Overview

Next.js 14 frontend for the MEGAZEN maritime logistics platform with dark theme, real-time updates, and professional UI components.

## Setup

```bash
cd apps/web
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Pages

### Public Pages
- `/login` - User authentication

### Dashboard Pages (Protected)
- `/dashboard` - Main dashboard with KPIs
- `/bookings` - Booking management
- `/containers` - Container registry and tracking
- `/release-orders` - Release order management
- `/delivery-orders` - Delivery order management
- `/bill-of-lading` - Bill of Lading workflow
- `/tracking` - Real-time container tracking
- `/customers` - Customer management
- `/yard` - Yard slot management
- `/reports` - Reports and analytics
- `/settings` - User settings and configuration

## Components

### Layout
- `DashboardLayout` - Main dashboard layout with sidebar

### Pages
- `LoginPage` - Authentication
- `DashboardPage` - Overview with stats and activity
- `BookingsPage` - Booking list and management
- `ContainersPage` - Container registry
- `BillOfLadingPage` - B/L form with Draft/Submit/Preview modes

## Features

### Dark Theme
- Background: `#0a0a0a`
- Card: `#1a1a1a`
- Border: `#2a2a2a`
- Text: White

### Real-time Updates
Socket.IO integration for live updates on:
- Booking status changes
- Container movements
- Order issuance
- Bill of Lading updates

### Bill of Lading Form

**Three Modes:**

1. **Draft Mode**
   - Auto-save every 30 seconds
   - No validation
   - Save at any time

2. **Submit Mode**
   - Full validation
   - Cross-checks with bookings/containers
   - Auto-issue on pass
   - Error messages with fixes

3. **Preview Mode**
   - Real-time rendering
   - Single/multi-page support
   - QR code generation
   - Digital signature placeholder
   - Print-ready formatting

**Amendment System:**
- Track amendments (max 3)
- Auto-fee generation on 3rd amendment
- Version history
- QR code versioning

## Styling

### Tailwind CSS Configuration
- Dark theme with custom colors
- No rounded corners by default (sharp, professional look)
- Custom color palette for maritime/logistics theme

### Component Classes

```css
bg-[#0a0a0a]   /* Main background */
bg-[#1a1a1a]   /* Card background */
border-gray-800 /* Card borders */
text-white     /* Primary text */
text-gray-400  /* Secondary text */
```

## Data Fetching

### React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['bookings'],
  queryFn: () => apiClient.get('/api/bookings'),
});
```

### Authentication

Token stored in `localStorage`:
```typescript
const token = localStorage.getItem('token');
```

Automatically added to API headers by `ApiClient`.

## Building for Production

```bash
pnpm run build
pnpm run start
```
