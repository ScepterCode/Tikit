# 🎨 Grooovy UI Architecture & Design System

## Overview

Complete authentication and dashboard system for three user types:
1. **Attendees** - Event goers who browse and purchase tickets
2. **Organizers** - Event creators who manage events
3. **System Admins** - Platform administrators

## User Roles & Permissions

### Role Hierarchy
```
System Admin (highest privileges)
├── Full platform access
├── User management
├── Analytics & reporting
├── Platform settings
└── Content moderation

Event Organizer
├── Create/manage own events
├── View attendee data
├── Financial reports
├── Team management
└── Broadcast messages

Attendee (default)
├── Browse events
├── Purchase tickets
├── Manage wallet
├── Referral program
└── Profile settings
```

## Authentication Flow

### Landing Page → Registration/Login → Onboarding → Dashboard

See detailed flows in sections below.
