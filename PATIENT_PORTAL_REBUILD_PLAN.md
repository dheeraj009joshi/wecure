# Patient Portal Rebuild Plan

## Overview
Complete rebuild of the patient portal frontend with proper API integration, loading states, error handling, and type safety. Preserving all current UI components and design.

## Core Principles
1. **Always clear loading states** - No stuck spinners
2. **Proper error handling** - User-friendly error messages
3. **Type safety** - Full TypeScript coverage
4. **API response validation** - Handle all response types
5. **No infinite loops** - Proper useEffect dependencies
6. **Clean code** - Reusable hooks and utilities

---

## Phase 1: Foundation & Architecture ✅

### 1.1 Custom Hooks
- **`useApiCall<T>`** - Generic hook for API calls with loading/error states
- **`useAppointments`** - Specialized hook for appointment data
- **`usePatientProfile`** - Hook for patient profile data
- **`useDoctorDetails`** - Hook for doctor details
- **`useAvailability`** - Hook for doctor availability

### 1.2 API Response Types
- Define proper TypeScript interfaces matching backend schemas
- Handle nested objects (doctor, patient in appointments)
- Handle optional fields correctly

### 1.3 Error Handling Strategy
- Network errors (timeout, no connection)
- API errors (404, 500, validation errors)
- Empty responses
- Invalid data structures

---

## Phase 2: Core Hooks Implementation

### 2.1 `useApiCall` Hook
```typescript
interface UseApiCallOptions {
  immediate?: boolean;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}
```

**Features:**
- Automatic loading state management
- Timeout handling (default 10s)
- Error state management
- Manual execution option
- Reset functionality

### 2.2 `useAppointments` Hook
- Fetches patient appointments
- Calculates stats (total, upcoming, completed, pending)
- Filters upcoming appointments
- Handles empty states

### 2.3 `usePatientProfile` Hook
- Fetches patient profile
- Handles profile updates
- Calculates appointment stats

---

## Phase 3: Patient Dashboard Rebuild

### 3.1 Components
- Welcome section (preserved)
- Stats cards (4 cards: Total, Upcoming, Completed, Pending)
- Upcoming appointments list (max 2)
- Quick access cards (preserved)

### 3.2 API Integration
- Use `useAppointments` hook
- Proper loading states
- Error handling with retry
- Empty state handling

### 3.3 Loading States
- Initial load: Show spinner
- After load: Show data or empty state
- Error: Show error message with retry button
- Never stuck on loading

---

## Phase 4: Appointments Page Rebuild

### 4.1 Features
- List all appointments
- Filter by status (All, Upcoming, Completed, Cancelled)
- Search functionality
- Cancel appointment with confirmation
- View appointment details

### 4.2 API Integration
- Use `useAppointments` hook
- Real-time status updates
- Proper error handling

---

## Phase 5: Patient Profile Page Rebuild

### 5.1 Features
- Display patient information
- Edit profile form
- Appointment statistics
- Profile picture (if applicable)

### 5.2 API Integration
- Use `usePatientProfile` hook
- Update profile functionality
- Validation and error handling

---

## Phase 6: Doctor Listing & Details

### 6.1 Doctor Listing Page
- List all doctors
- Search by name/specialty
- Filter by specialty
- Sort options

### 6.2 Doctor Details Page
- Doctor profile
- Reviews
- Availability
- Booking CTA

### 6.3 API Integration
- Use `useDoctorDetails` hook
- Use `useAvailability` hook
- Proper loading states

---

## Phase 7: Booking Flow Rebuild

### 7.1 Booking Page
- Doctor details display
- Date selection
- Time slot selection (from availability API)
- Consultation type selection
- Reason for visit
- Form validation
- Booking submission

### 7.2 API Integration
- Fetch doctor details
- Fetch available slots for selected date
- Validate booking
- Submit booking
- Handle errors (double booking, invalid slot, etc.)

### 7.3 Validation
- Date must be in future
- Time slot must be available
- Reason required
- Patient must be authenticated

---

## Phase 8: Testing & Polish

### 8.1 Test Scenarios
- Happy path: All features work
- Error scenarios: Network errors, API errors
- Empty states: No appointments, no doctors
- Edge cases: Invalid data, timeouts

### 8.2 Fixes
- Any remaining loading state issues
- Error message improvements
- UI/UX polish
- Performance optimization

---

## File Structure

```
src/
├── hooks/
│   ├── useApiCall.ts          # Generic API call hook
│   ├── useAppointments.ts     # Appointments hook
│   ├── usePatientProfile.ts   # Patient profile hook
│   ├── useDoctorDetails.ts    # Doctor details hook
│   └── useAvailability.ts     # Availability hook
├── app/(patient)/
│   ├── page.tsx                # Dashboard (rebuild)
│   ├── patient/
│   │   ├── appointments/
│   │   │   └── page.tsx        # Appointments list (rebuild)
│   │   └── profile/
│   │       └── page.tsx         # Profile page (rebuild)
│   ├── doctors/
│   │   ├── page.tsx            # Doctor listing (rebuild)
│   │   └── [id]/
│   │       └── page.tsx         # Doctor details (rebuild)
│   └── book/
│       └── [doctorId]/
│           └── page.tsx        # Booking page (rebuild)
└── types/
    └── patient.ts               # Patient-related types
```

---

## Implementation Order

1. ✅ **Phase 1**: Plan (Current)
2. **Phase 2**: Build core hooks
3. **Phase 3**: Rebuild Dashboard
4. **Phase 4**: Rebuild Appointments
5. **Phase 5**: Rebuild Profile
6. **Phase 6**: Rebuild Doctors pages
7. **Phase 7**: Rebuild Booking
8. **Phase 8**: Test & Fix

---

## Key Improvements

1. **Loading States**: Always clear, never stuck
2. **Error Handling**: User-friendly, actionable errors
3. **Type Safety**: Full TypeScript coverage
4. **Code Reusability**: Custom hooks for common patterns
5. **Performance**: Proper memoization, no unnecessary re-renders
6. **UX**: Loading indicators, error states, empty states

---

## Success Criteria

- ✅ No stuck loading states
- ✅ All API calls properly handled
- ✅ Error messages are clear and actionable
- ✅ Empty states are handled gracefully
- ✅ All features work as expected
- ✅ Code is clean and maintainable
- ✅ UI matches current design

