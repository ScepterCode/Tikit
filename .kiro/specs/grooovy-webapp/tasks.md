# Implementation Plan

- [x] 1. Project setup and infrastructure





- [x] 1.1 Initialize monorepo with frontend and backend workspaces

  - Set up pnpm workspace with React frontend and Node.js backend
  - Configure TypeScript for both projects
  - Set up ESLint and Prettier
  - _Requirements: 15.1, 15.2_


- [x] 1.2 Configure database and ORM


  - Set up PostgreSQL database
  - Initialize Prisma with schema for User, Event, Ticket, Payment models
  - Create initial migration
  - _Requirements: 13.3, 15.2_


- [x] 1.3 Set up Firebase for real-time features

  - Initialize Firebase project
  - Configure Realtime Database for live updates
  - Set up Firebase Authentication
  - _Requirements: 6.3, 7.5_


- [x] 1.4 Configure Redis for caching and sessions

  - Set up Redis connection
  - Implement cache utility functions
  - Configure session storage
  - _Requirements: 15.2_

- [-] 2. Authentication and user management


- [x] 2.1 Implement phone number registration with OTP


  - Create registration API endpoint
  - Integrate Africa's Talking SMS for OTP
  - Implement OTP verification logic
  - _Requirements: 13.1_


- [x] 2.2 Write property test for OTP delivery

  - **Property 44: Registration OTP delivery**
  - **Validates: Requirements 13.1**

- [x] 2.3 Implement JWT authentication

  - Create login endpoint with JWT generation
  - Implement refresh token mechanism
  - Create auth middleware for protected routes
  - _Requirements: 13.2_


- [ ] 2.4 Write property test for JWT token generation


  - **Property 45: JWT token generation**
  - **Validates: Requirements 13.2**
-

- [x] 2.5 Implement rate limiting middleware

  - Create rate limiter using Redis
  - Apply to authentication endpoints
  - Configure limits per endpoint type
  - _Requirements: 13.4_

- [x] 2.6 Write property test for rate limiting enforcement

  - **Property 47: Rate limiting enforcement**
  - **Validates: Requirements 13.4**

- [x] 2.7 Implement security breach detection and account locking





  - Create breach detection logic
  - Implement account locking mechanism
  - Add SMS notification for security events
  - _Requirements: 13.5_

- [ ] 2.8 Write property test for security breach response
  - **Property 48: Security breach response**
  - **Validates: Requirements 13.5**

- [x] 3. Onboarding flow




- [x] 3.1 Create language selection component


  - Build UI with 5 language options (English, Hausa, Igbo, Yoruba, Pidgin)
  - Implement i18next configuration
  - Create translation files for each language
  - _Requirements: 1.1_



- [x] 3.2 Implement language persistence
  - Store language preference in user profile
  - Apply language to all UI content

  - _Requirements: 1.2_

- [x] 3.3 Write property test for language persistence

  - **Property 1: Language persistence round-trip**
  - **Validates: Requirements 1.2**

- [x] 3.4 Create state selection component


  - Build searchable dropdown with 37 Nigerian states
  - Implement state selection logic
  - _Requirements: 1.3_

- [x] 3.5 Implement state-based event filtering


  - Calculate 100km radius from state center
  - Filter events by geographic distance
  - _Requirements: 1.4_

- [x] 3.6 Write property test for state-based filtering


  - **Property 2: State-based event filtering**
  - **Validates: Requirements 1.4, 2.1**

- [x] 4. Event discovery and feed



- [x] 4.1 Create event feed API endpoint


  - Implement pagination with 20 events per page
  - Add geographic filtering by user state
  - Optimize query performance with indexes
  - _Requirements: 2.1, 2.4_

- [x] 4.2 Write property test for pagination consistency


  - **Property 4: Pagination consistency**
  - **Validates: Requirements 2.4**

- [x] 4.3 Implement multi-filter system


  - Add filters for event type, date, price, LGA, distance, language, capacity, organizer type, payment methods
  - Create filter API with conjunction logic
  - _Requirements: 2.3_

- [x] 4.4 Write property test for multi-filter conjunction


  - **Property 3: Multi-filter conjunction**
  - **Validates: Requirements 2.3**

- [x] 4.5 Build event feed UI component


  - Create EventCard component with image, title, date, price
  - Implement infinite scroll with lazy loading
  - Add FilterPanel component
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.6 Create event detail page


  - Build EventDetailPage component
  - Display full event information
  - Add ticket purchase CTA
  - _Requirements: 2.5_

- [-] 5. Hidden/private events


- [x] 5.1 Implement hidden event creation
  - Generate unique 4-digit access codes
  - Create shareable deep links
  - Store hidden event metadata
  - _Requirements: 3.1_

- [x] 5.2 Write property test for hidden event code uniqueness

  - **Property 5: Hidden event code uniqueness**
  - **Validates: Requirements 3.1**


- [x] 5.3 Implement access code validation


  - Create validation endpoint
  - Grant access for valid codes
  - Deny access for invalid codes
  - _Requirements: 3.3_

- [x] 5.4 Write property test for access code validation


  - **Property 7: Access code validation**
  - **Validates: Requirements 3.3**

- [x] 5.5 Implement deep link navigation


  - Configure deep link routing
  - Handle WhatsApp deep links
  - Navigate to event page after validation
  - _Requirements: 3.2_

- [x] 5.6 Write property test for deep link navigation





  - **Property 6: Deep link navigation**
  - **Validates: Requirements 3.2**

- [x] 5.7 Exclude hidden events from public search

  - Update search query to filter hidden events
  - Verify exclusion in all public endpoints
  - _Requirements: 3.4_

- [x] 5.8 Write property test for hidden event exclusion





  - **Property 8: Hidden event exclusion from search**
  - **Validates: Requirements 3.4**

- [x] 5.9 Implement invitation source tracking




  - Track source parameter in deep links
  - Store analytics data for invitations
  - _Requirements: 3.5_

- [x] 5.10 Write property test for invitation tracking

  - **Property 9: Invitation source tracking**
  - **Validates: Requirements 3.5**

- [x] 6. Ticket purchase flow




- [x] 6.1 Create ticket selection UI


  - Build TicketSelector component with tier options
  - Add quantity controls
  - Display pricing information
  - _Requirements: 5.1_

- [x] 6.2 Implement payment method selection


  - Create PaymentMethodSelector with 6 options (card, bank transfer, Opay, Palmpay, airtime, sponsor)
  - Build InstallmentCalculator for 2-4 part payments
  - _Requirements: 5.1, 11.1_


- [x] 6.3 Write property test for payment option availability

  - **Property 14: Payment option availability**
  - **Validates: Requirements 5.1**

- [x] 6.3 Integrate Paystack payment gateway


  - Set up Paystack SDK
  - Implement payment initialization
  - Handle payment callbacks and verification
  - _Requirements: 11.1, 11.5_

- [x] 6.4 Integrate Flutterwave as backup gateway


  - Set up Flutterwave SDK
  - Implement failover logic
  - _Requirements: 11.1_

- [x] 6.5 Implement airtime payment


  - Integrate with mobile operator APIs
  - Deduct airtime from user balance
  - Confirm payment
  - _Requirements: 11.2_

- [x] 6.6 Write property test for airtime deduction


  - **Property 37: Airtime payment deduction**
  - **Validates: Requirements 11.2**

- [x] 6.7 Implement sponsorship request flow


  - Generate unique sponsorship codes
  - Create OTP approval mechanism
  - Handle sponsor payment
  - _Requirements: 11.3_

- [x] 6.8 Write property test for sponsorship code uniqueness


  - **Property 38: Sponsorship code uniqueness**
  - **Validates: Requirements 11.3**

- [x] 6.9 Implement payment error handling


  - Display error messages for failed payments
  - Offer alternative payment methods
  - _Requirements: 11.4_

- [x] 6.10 Write property test for payment failure handling


  - **Property 39: Payment failure error handling**
  - **Validates: Requirements 11.4**

- [x] 6.11 Implement ticket issuance on successful payment


  - Generate QR code and backup code
  - Store ticket in database
  - Send SMS and email confirmation
  - _Requirements: 11.5_



- [-] 6.12 Write property test for ticket issuance

  - **Property 40: Successful payment ticket issuance**
  - **Validates: Requirements 11.5**

- [-] 7. Group buying feature


- [x] 7.1 Create group buy initiation flow


  - Build GroupBuyCreator UI component
  - Allow selection of 2-5000 participants
  - Generate unique payment links for each participant
  - _Requirements: 5.2_

- [x] 7.2 Write property test for group buy link uniqueness





  - **Property 15: Group buy link uniqueness**
  - **Validates: Requirements 5.2**

- [x] 7.3 Implement group buy payment tracking


  - Track payment status for each participant in real-time
  - Update Firebase Realtime Database
  - _Requirements: 5.3_

- [x] 7.4 Write property test for payment status consistency


  - **Property 16: Group buy payment status consistency**
  - **Validates: Requirements 5.3**

- [x] 7.5 Implement group buy completion logic


  - Issue tickets when all participants pay
  - Send notifications to all participants
  - _Requirements: 5.4_


- [x] 7.6 Write property test for group buy ticket issuance

  - **Property 17: Group buy ticket issuance**
  - **Validates: Requirements 5.4**

- [x] 7.7 Implement group buy expiration and refunds


  - Set expiration timer
  - Refund partial payments on expiration
  - _Requirements: 5.5_

- [x] 7.8 Write property test for expired group buy refunds



  - **Property 18: Expired group buy refunds**


  - **Validates: Requirements 5.5**



- [x] 8. Cultural features for weddings and burials

- [x] 8.1 Create wedding event template

  - Add fields for aso-ebi tiers, food options, dietary restrictions
  - Build UI for wedding-specific features
  - _Requirements: 6.1_

- [x] 8.2 Implement wedding ticket purchase flow

  - Prompt for food RSVP and aso-ebi tier selection
  - Store cultural selections with ticket
  - _Requirements: 6.2_

- [x] 8.3 Write property test for wedding purchase prompts


  - **Property 19: Wedding ticket purchase prompts**
  - **Validates: Requirements 6.2**

- [x] 8.4 Implement spray money leaderboard


  - Create real-time leaderboard using Firebase
  - Update on each spray money transaction
  - Display top contributors
  - _Requirements: 6.3_

- [x] 8.5 Write property test for leaderboard updates

  - **Property 20: Spray money leaderboard updates**
  - **Validates: Requirements 6.3**


- [x] 8.6 Implement wedding analytics aggregation


  - Aggregate food counts by option
  - Calculate aso-ebi sales by tier
  - Sum total spray money collected
  - _Requirements: 6.4_

- [x] 8.7 Write property test for wedding analytics accuracy



  - **Property 21: Wedding analytics accuracy**
  - **Validates: Requirements 6.4**
-

- [x] 9. Bulk booking for religious organizations





- [x] 9.1 Create bulk booking UI component

  - Build slider for 50-20,000 seat selection
  - Display real-time cost calculation
  - Show seat availability counter
  - _Requirements: 7.1, 7.2_


- [x] 9.2 Write property test for bulk booking cost calculation

  - **Property 22: Bulk booking cost calculation**
  - **Validates: Requirements 7.2**


- [x] 9.3 Implement bulk ticket generation

  - Generate unique QR codes for each seat
  - Create downloadable CSV file
  - Store all tickets in database
  - _Requirements: 7.3_


- [x] 9.4 Write property test for QR code generation

  - **Property 23: Bulk booking QR code generation**
  - **Validates: Requirements 7.3**


- [x] 9.5 Implement split payment links for large bookings

  - Generate payment links for bookings > 1000 seats
  - Track payment status per link
  - _Requirements: 7.4_


- [x] 9.6 Implement real-time capacity updates

  - Update event capacity using Firebase
  - Broadcast updates to all connected clients
  - Handle concurrent booking conflicts
  - _Requirements: 7.5_


- [x] 9.7 Write property test for capacity updates

  - **Property 24: Bulk booking capacity update**
  - **Validates: Requirements 7.5**

- [x] 10. AI-powered personalized recommendations



- [x] 10.1 Implement rule-based recommendation engine


  - Create scoring algorithm based on past attendance
  - Factor in cultural preferences and event type
  - Consider location and date preferences
  - _Requirements: 8.1_

- [x] 10.2 Write property test for feed prioritization


  - **Property 25: Personalized feed prioritization**
  - **Validates: Requirements 8.1**

- [x] 10.3 Implement capacity warning banners


  - Calculate capacity percentage
  - Display "Almost Full" banner when > 80%
  - Update in real-time
  - _Requirements: 8.2_

- [x] 10.4 Create related event recommendation section


  - Query events by similar type and location
  - Display in dedicated UI section
  - _Requirements: 8.3_

- [x] 10.5 Write property test for related recommendations


  - **Property 26: Related event recommendations**
  - **Validates: Requirements 8.3**


- [x] 10.6 Implement push notification system

  - Set up notification service
  - Trigger notifications for trending events
  - Personalize notification content
  - _Requirements: 8.4_


- [x] 10.7 Write property test for trending notifications

  - **Property 27: Trending notification trigger**
  - **Validates: Requirements 8.4**

- [-] 11. Offline wallet functionality

- [x] 11.1 Implement local storage for tickets
  - Store QR codes and backup codes in IndexedDB
  - Cache event details
  - Handle storage quota limits
  - _Requirements: 9.1_


- [x] 11.2 Write property test for offline ticket storage

  - **Property 28: Offline ticket storage**
  - **Validates: Requirements 9.1**

- [x] 11.3 Create offline wallet UI


  - Build ticket list view
  - Display QR codes in full-screen mode
  - Show offline indicator
  - _Requirements: 9.2_

- [x] 11.4 Write property test for offline accessibility

  - **Property 29: Offline wallet accessibility**
  - **Validates: Requirements 9.2**

- [x] 11.5 Implement WhatsApp ticket sharing
  - Generate shareable ticket images
  - Include QR code and event details
  - Create share functionality
  - _Requirements: 9.3_

- [x] 11.6 Write property test for ticket share completeness

  - **Property 30: Ticket share image completeness**
  - **Validates: Requirements 9.3**

- [x] 11.7 Implement offline sync mechanism


  - Detect connectivity changes
  - Sync local data with server
  - Handle sync conflicts
  - _Requirements: 9.4_

- [x] 11.8 Write property test for offline sync consistency



  - **Property 31: Offline sync consistency**
  - **Validates: Requirements 9.4**

- [x] 11.9 Implement duplicate scan prevention




  - Mark tickets as used on first scan
  - Reject subsequent scan attempts
  - Display warning with scan history
  - _Requirements: 9.5_

- [x] 11.10 Write property test for scan idempotence

  - **Property 32: Ticket scan idempotence**
  - **Validates: Requirements 9.5**

- [ ] 12. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [-] 13. Organizer dashboard


- [x] 13.1 Create event creation interface


  - Build form with 5 event templates
  - Add fields for all event types
  - Implement template selection
  - _Requirements: 10.1_

- [x] 13.2 Implement real-time analytics dashboard


  - Display sales counters
  - Show revenue totals
  - Visualize attendee demographics
  - Update in real-time using Firebase
  - _Requirements: 10.2_

- [x] 13.3 Write property test for analytics accuracy


  - **Property 33: Event analytics calculation accuracy**
  - **Validates: Requirements 10.2**

- [x] 13.4 Implement attendee data export

  - Query all attendees for event
  - Generate Excel file with SheetJS
  - Include names, phone numbers, tiers, payment status
  - _Requirements: 10.3_

- [ ] 13.5 Write property test for export completeness



  - **Property 34: Attendee export completeness**
  - **Validates: Requirements 10.3**

- [x] 13.6 Implement WhatsApp broadcast feature
  - Integrate WhatsApp Business API
  - Create message composer
  - Send to all ticket holders
  - _Requirements: 10.4_

- [ ] 13.7 Write property test for broadcast delivery
  - **Property 35: Broadcast delivery completeness**
  - **Validates: Requirements 10.4**

- [x] 13.8 Implement role-based access control
  - Create permission system (viewer, editor, financial)
  - Apply middleware to dashboard routes
  - Restrict actions based on role
  - _Requirements: 10.5_

- [ ] 13.9 Write property test for RBAC
  - **Property 36: Role-based access control**
  - **Validates: Requirements 10.5**

- [x] 14. USSD integration
- [x] 14.1 Set up Africa's Talking USSD gateway
  - Register USSD shortcode *7477#
  - Configure webhook endpoint
  - Set up SMS gateway
  - _Requirements: 4.1_

- [x] 14.2 Implement USSD menu navigation
  - Create session management
  - Build menu tree (Buy, Check, Sponsor, Wallet, Help)
  - Handle user input
  - _Requirements: 4.1_

- [x] 14.3 Implement USSD ticket purchase flow
  - Prompt for event code
  - Display ticket tiers
  - Process payment
  - Send SMS with QR and backup code
  - _Requirements: 4.2, 4.3_

- [x] 14.4 Write property test for USSD tier display
  - **Property 10: USSD ticket tier display**
  - **Validates: Requirements 4.2**

- [x] 14.5 Write property test for USSD purchase confirmation
  - **Property 11: USSD purchase confirmation**
  - **Validates: Requirements 4.3**

- [x] 14.6 Implement USSD ticket checking
  - Query ticket by phone number
  - Display event details
  - Show QR code reference
  - _Requirements: 4.4_

- [x] 14.7 Write property test for USSD ticket details
  - **Property 12: USSD ticket detail completeness**
  - **Validates: Requirements 4.4**

- [x] 14.8 Implement USSD error handling and refunds
  - Detect failed transactions
  - Initiate automatic refunds
  - Display clear error messages
  - _Requirements: 4.5_

- [x] 14.9 Write property test for USSD refunds
  - **Property 13: USSD refund on failure**
  - **Validates: Requirements 4.5**

- [x] 15. Referral and rewards system
- [x] 15.1 Generate unique referral codes
  - Create code generation algorithm
  - Ensure uniqueness across all users
  - Store in user profile
  - _Requirements: 12.1_

- [x] 15.2 Write property test for referral code uniqueness
  - **Property 41: Referral code uniqueness**
  - **Validates: Requirements 12.1**

- [x] 15.3 Implement referral tracking and rewards
  - Track referred user purchases
  - Credit ₦200 on first purchase
  - Award ₦1000 bonus after 5 referrals
  - _Requirements: 12.2, 12.3_

- [x] 15.4 Write property test for referral rewards
  - **Property 42: Referral reward calculation**
  - **Validates: Requirements 12.2**

- [x] 15.5 Create referral leaderboard
  - Query top referrers
  - Sort by referral count
  - Display earnings
  - _Requirements: 12.4_

- [x] 15.6 Write property test for leaderboard sorting
  - **Property 43: Leaderboard sorting accuracy**
  - **Validates: Requirements 12.4**

- [x] 15.7 Implement wallet withdrawal
  - Allow withdrawal to mobile money
  - Enable use as ticket payment credit
  - Minimum balance: ₦500
  - _Requirements: 12.5_

- [x] 16. Ticket verification system
- [x] 16.1 Create QR code scanner interface
  - Activate device camera
  - Implement QR code detection
  - Display scan results
  - _Requirements: 14.1_

- [x] 16.2 Implement ticket validation logic
  - Verify QR code against database
  - Display attendee details
  - Show validity status
  - _Requirements: 14.2_

- [x] 16.3 Write property test for valid QR display
  - **Property 49: Valid QR code detail display**
  - **Validates: Requirements 14.2**

- [x] 16.4 Implement duplicate scan detection
  - Check if ticket already used
  - Display warning with scan history
  - Show previous scan time and location
  - _Requirements: 14.3_

- [x] 16.5 Write property test for duplicate detection
  - **Property 50: Duplicate scan detection**
  - **Validates: Requirements 14.3**

- [x] 16.6 Implement backup code validation
  - Accept 6-digit manual entry
  - Validate against database
  - Display ticket information
  - _Requirements: 14.4_

- [x] 16.7 Write property test for backup code validation
  - **Property 51: Backup code validation**
  - **Validates: Requirements 14.4**

- [x] 16.8 Implement offline scan queueing
  - Queue validation requests when offline
  - Process queue on reconnection
  - _Requirements: 14.5_

- [x] 16.9 Write property test for offline scan queueing
  - **Property 52: Offline scan queueing**
  - **Validates: Requirements 14.5**

- [-] 17. Performance optimization and monitoring
- [x] 17.1 Implement database indexing
  - Create composite indexes for event queries
  - Add indexes for ticket and user queries
  - Set up geospatial indexes
  - _Requirements: 15.2_

- [x] 17.2 Set up Redis caching
  - Cache frequently accessed data
  - Implement cache invalidation
  - Configure cache warming
  - _Requirements: 15.2_

- [x] 17.3 Implement CDN for static assets
  - Configure Cloudflare CDN
  - Optimize image delivery
  - Set cache headers
  - _Requirements: 15.3_

- [x] 17.4 Set up auto-scaling
  - Configure resource monitoring
  - Set scaling thresholds
  - Test scaling behavior
  - _Requirements: 15.4_

- [x] 17.5 Implement error logging and monitoring
  - Integrate Sentry for error tracking
  - Set up log aggregation
  - Configure alerts
  - _Requirements: 15.5_

- [x] 17.6 Write property test for error logging
  - **Property 53: Error logging completeness**
  - **Validates: Requirements 15.5**

- [x] 18. Security hardening
- [x] 18.1 Implement data encryption
  - Encrypt sensitive fields with AES-256
  - Set up encryption key management
  - Apply to payment and PII data
  - _Requirements: 13.3_

- [x] 18.2 Write property test for data encryption
  - **Property 46: Sensitive data encryption**
  - **Validates: Requirements 13.3**

- [x] 18.3 Implement CORS and CSRF protection
  - Configure CORS whitelist
  - Add CSRF tokens to forms
  - Test security measures
  - _Requirements: 13.4_

- [x] 18.4 Set up security monitoring
  - Implement breach detection
  - Configure account locking
  - Set up security alerts
  - _Requirements: 13.5_

- [x] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. PWA configuration and deployment
- [x] 20.1 Configure service worker
  - Set up Workbox
  - Implement offline caching strategy
  - Configure background sync
  - _Requirements: 9.1, 9.2_

- [x] 20.2 Create PWA manifest
  - Configure app icons
  - Set theme colors
  - Define display mode
  - _Requirements: 2.2_

- [x] 20.3 Set up CI/CD pipeline
  - Configure GitHub Actions
  - Set up automated testing
  - Configure deployment to Vercel/Railway
  - _Requirements: 15.1_

- [x] 20.4 Deploy to production
  - Deploy frontend to Vercel
  - Deploy backend to Railway
  - Configure environment variables
  - Run smoke tests
  - _Requirements: 15.1_

- [x] 20.5 Write integration tests for critical flows
  - Test complete user registration flow
  - Test ticket purchase with different payment methods
  - Test group buy flow
  - Test offline wallet functionality
  - Test organizer dashboard operations
