# Announcement Carousel & Image Support - Implementation Plan

## Status: ✅ COMPLETED

### 1. Update Admin Announcements Page (`app/(admin)/announcements.tsx`)

- [x] Extend `Announcement` type to support `type`, `imageUrl`, `duration`, `expiresAt`
- [x] Add `duration` selector (1d, 3d, 7d, 14d, 30d, never)
- [x] Add `type` toggle (Text / Image)
- [x] Add `imageUrl` input field (appears when Image type selected)
- [x] Send new fields to API on publish (`type`, `duration`, `imageUrl`/`title`+`message`)
- [x] Show image announcement type in the published list
- [x] Show duration/expiry on each announcement card

### 2. Update User Home Page (`app/(user)/index.tsx`)

- [x] Extend `Announcement` type for new fields (`type`, `imageUrl`, `expiresAt`, `duration`)
- [x] Replace vertical list with horizontal FlatList carousel (paging/snapping)
- [x] Add pagination dots (clickable)
- [x] Support image-only announcements (full-width image with border radius)
- [x] Support text announcements (card design with priority styles)
- [x] Client-side carousel with snap and active index tracking

### 3. Backend AI Text

- [x] `backend_ai_instructions.txt` created with full endpoint details
