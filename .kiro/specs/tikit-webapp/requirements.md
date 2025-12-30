# Requirements Document

## Introduction

Tikit is a web-based ticketing platform designed to serve Nigeria's underserved event market including weddings, crusades, burials, festivals, and rural events. The platform addresses the digital divide through USSD integration, offline capabilities, multilingual support, and hyper-local features. Unlike existing platforms, Tikit covers private invite-only events, supports group buying, bulk bookings for religious organizations, and provides flexible payment options including mobile money and airtime.

## Glossary

- **Tikit System**: The complete web application including frontend, backend, and USSD integration
- **Event Organizer**: A user who creates and manages events on the platform
- **Event Attendee**: A user who discovers and purchases tickets for events
- **USSD Gateway**: The telecommunications interface that enables feature phone users to interact with Tikit via USSD codes
- **Offline Wallet**: A local storage mechanism that stores ticket QR codes and backup codes for access without internet connectivity
- **Hidden Event**: A private event that requires an invitation code or link to access
- **Bulk Booking**: A feature allowing purchase of 50-20,000 tickets in a single transaction
- **Group Buy**: A feature enabling multiple users to collectively purchase tickets with split payment
- **LGA**: Local Government Area, used for geographic event filtering
- **Aso-ebi**: Traditional Nigerian attire worn by wedding guests, often sold in tiers
- **Mobile Money**: Digital payment services like Opay and Palmpay
- **QR Code**: Quick Response code used for ticket verification at events

## Requirements

### Requirement 1

**User Story:** As a new user, I want to select my preferred language and state during onboarding, so that I can immediately see relevant local events in my language.

#### Acceptance Criteria

1. WHEN a user first accesses the Tikit System THEN the system SHALL display a language selection interface supporting English, Hausa, Igbo, Yoruba, and Pidgin
2. WHEN a user selects a language THEN the Tikit System SHALL persist the language preference and display all subsequent content in the selected language
3. WHEN a user completes language selection THEN the Tikit System SHALL prompt for state selection from all 36 Nigerian states plus FCT
4. WHEN a user selects their state THEN the Tikit System SHALL store the location preference and filter the home feed to prioritize events within 100km radius
5. WHEN the onboarding process completes THEN the Tikit System SHALL redirect the user to the home feed within 30 seconds of initial access

### Requirement 2

**User Story:** As an event attendee, I want to browse a personalized feed of local events with filtering options, so that I can discover relevant events near me.

#### Acceptance Criteria

1. WHEN a user accesses the home feed THEN the Tikit System SHALL display events within 100km radius of the user's selected state
2. WHEN the home feed loads THEN the Tikit System SHALL complete rendering within 2 seconds on 2G network connections
3. WHEN a user applies filters THEN the Tikit System SHALL support filtering by event type, date range, price range, LGA, distance, language, capacity status, organizer type, payment methods, and accessibility features
4. WHEN a user scrolls the feed THEN the Tikit System SHALL implement infinite scroll loading 20 events per page
5. WHEN a user clicks on an event card THEN the Tikit System SHALL navigate to the detailed event page within 1 second

### Requirement 3

**User Story:** As a wedding guest, I want to access invite-only private events using a code or link, so that I can purchase tickets for events I'm invited to.

#### Acceptance Criteria

1. WHEN an event organizer creates a hidden event THEN the Tikit System SHALL generate a unique 4-digit access code and a shareable deep link
2. WHEN a user receives a WhatsApp deep link for a hidden event THEN the Tikit System SHALL open the event page directly after code validation
3. WHEN a user enters a 4-digit access code THEN the Tikit System SHALL validate the code and grant access to the hidden event within 2 seconds
4. WHEN a user searches for events THEN the Tikit System SHALL exclude hidden events from public search results
5. WHEN a hidden event link is shared THEN the Tikit System SHALL track the invitation source for analytics

### Requirement 4

**User Story:** As a feature phone user without internet access, I want to purchase tickets via USSD, so that I can attend events without requiring a smartphone or data connection.

#### Acceptance Criteria

1. WHEN a user dials the USSD code *7477# THEN the USSD Gateway SHALL display a menu with options to buy tickets, check tickets, sponsor someone, view wallet, and access help
2. WHEN a user selects buy ticket via USSD THEN the USSD Gateway SHALL prompt for a 4-digit event code and display available ticket tiers
3. WHEN a user completes a USSD ticket purchase THEN the USSD Gateway SHALL process payment via airtime deduction or mobile money and send an SMS containing the QR code and backup code within 30 seconds
4. WHEN a user checks their ticket via USSD THEN the USSD Gateway SHALL display ticket details including event name, date, seat number, and QR code reference
5. WHEN a USSD transaction fails THEN the USSD Gateway SHALL display a clear error message and refund any deducted amount within 5 minutes

### Requirement 5

**User Story:** As a ticket buyer, I want flexible payment options including installments and group buying, so that I can afford tickets and share costs with friends.

#### Acceptance Criteria

1. WHEN a user selects a ticket tier THEN the Tikit System SHALL display payment options including full payment, 2-part installment, 3-part installment, and 4-part installment
2. WHEN a user initiates a group buy THEN the Tikit System SHALL allow selection of 2 to 5000 participants and generate unique payment links for each participant
3. WHEN a user shares a group buy link via WhatsApp THEN the Tikit System SHALL track payment status for each participant in real-time
4. WHEN all group buy participants complete payment THEN the Tikit System SHALL issue tickets to all participants simultaneously
5. WHEN a group buy expires before completion THEN the Tikit System SHALL refund all partial payments within 24 hours

### Requirement 6

**User Story:** As a wedding organizer, I want to create events with cultural features like aso-ebi tiers and food RSVP, so that I can manage traditional Nigerian wedding logistics digitally.

#### Acceptance Criteria

1. WHEN an organizer creates a wedding event THEN the Tikit System SHALL provide fields for aso-ebi tier pricing, food menu options, and dietary restrictions
2. WHEN a guest purchases a wedding ticket THEN the Tikit System SHALL prompt for food RSVP selection and aso-ebi tier preference
3. WHEN guests spray money during an event THEN the Tikit System SHALL display a live leaderboard showing top contributors in real-time
4. WHEN an organizer views wedding analytics THEN the Tikit System SHALL display food count summaries, aso-ebi sales by tier, and total spray money collected
5. WHEN a burial event is created THEN the Tikit System SHALL provide condolence message fields and donation tracking features

### Requirement 7

**User Story:** As a church usher, I want to book 50 to 20,000 seats in bulk for congregation members, so that I can efficiently manage large religious gatherings.

#### Acceptance Criteria

1. WHEN an organizer enables bulk booking THEN the Tikit System SHALL display a slider allowing selection from 50 to 20,000 seats
2. WHEN a bulk booking is initiated THEN the Tikit System SHALL calculate total cost and display a real-time seat availability counter
3. WHEN a bulk booking is confirmed THEN the Tikit System SHALL generate individual QR codes for each seat and provide a downloadable CSV file
4. WHEN a bulk booking exceeds 1000 seats THEN the Tikit System SHALL offer split payment links for distribution to congregation members
5. WHEN bulk tickets are generated THEN the Tikit System SHALL update event capacity in real-time across all user sessions

### Requirement 8

**User Story:** As a regular user, I want personalized event recommendations based on my preferences and behavior, so that I can discover events I'm likely to attend.

#### Acceptance Criteria

1. WHEN a user views the home feed THEN the Tikit System SHALL prioritize events matching the user's past attendance history and cultural preferences
2. WHEN an event is nearing capacity THEN the Tikit System SHALL display a prominent "Almost Full" banner on the event card
3. WHEN a user has attended similar events THEN the Tikit System SHALL recommend related upcoming events in a dedicated section
4. WHEN a user's preferred event type is trending THEN the Tikit System SHALL send a push notification with personalized recommendations
5. WHEN the recommendation engine processes user data THEN the Tikit System SHALL use rule-based filtering combining past events, tribe, location, and event type

### Requirement 9

**User Story:** As a rural user with intermittent internet access, I want to store my tickets offline, so that I can access them at the event venue without requiring data connectivity.

#### Acceptance Criteria

1. WHEN a user purchases a ticket THEN the Tikit System SHALL store the ticket QR code and 6-digit backup code in local browser storage
2. WHEN a user accesses the offline wallet without internet THEN the Tikit System SHALL display all stored tickets with QR codes and event details
3. WHEN a user shares a ticket via WhatsApp THEN the Tikit System SHALL generate a shareable image containing the QR code and event information
4. WHEN internet connectivity is restored THEN the Tikit System SHALL synchronize offline wallet data with the server within 10 seconds
5. WHEN a ticket is scanned at an event THEN the Tikit System SHALL mark it as used and prevent duplicate entry attempts

### Requirement 10

**User Story:** As an event organizer, I want a comprehensive dashboard to create events and monitor sales, so that I can manage my events efficiently.

#### Acceptance Criteria

1. WHEN an organizer accesses the dashboard THEN the Tikit System SHALL display options to create events using 5 templates for weddings, crusades, burials, festivals, and general events
2. WHEN an organizer views event analytics THEN the Tikit System SHALL display real-time sales counters, revenue totals, and attendee demographics
3. WHEN an organizer exports attendee data THEN the Tikit System SHALL generate an Excel file containing names, phone numbers, ticket tiers, and payment status
4. WHEN an organizer broadcasts updates THEN the Tikit System SHALL send WhatsApp messages to all ticket holders with event changes
5. WHEN multiple organizers manage one event THEN the Tikit System SHALL support role-based access control with permissions for viewing, editing, and financial access

### Requirement 11

**User Story:** As a ticket buyer, I want multiple payment options including card, mobile money, and airtime, so that I can pay using my preferred method.

#### Acceptance Criteria

1. WHEN a user initiates payment THEN the Tikit System SHALL display options for debit card, bank transfer, Opay, Palmpay, airtime deduction, and sponsor request
2. WHEN a user selects airtime payment THEN the Tikit System SHALL deduct the ticket amount from the user's mobile airtime balance and confirm within 30 seconds
3. WHEN a user requests sponsorship THEN the Tikit System SHALL generate a unique code that the sponsor can approve via OTP verification
4. WHEN a payment fails THEN the Tikit System SHALL display a clear error message and offer alternative payment methods
5. WHEN a payment is successful THEN the Tikit System SHALL issue the ticket immediately and send confirmation via SMS and email

### Requirement 12

**User Story:** As a user who refers friends, I want to earn rewards for successful referrals, so that I can benefit from promoting the platform.

#### Acceptance Criteria

1. WHEN a user accesses their referral section THEN the Tikit System SHALL display a unique referral code and shareable link
2. WHEN a referred user completes their first ticket purchase THEN the Tikit System SHALL credit ₦200 to the referrer's wallet
3. WHEN a user successfully refers 5 people THEN the Tikit System SHALL award a ₦1000 bonus to the referrer's wallet
4. WHEN a user views the referral leaderboard THEN the Tikit System SHALL display top referrers with their total referral counts and earnings
5. WHEN a user's wallet balance exceeds ₦500 THEN the Tikit System SHALL allow withdrawal to mobile money or use as ticket payment credit

### Requirement 13

**User Story:** As a system administrator, I want to ensure secure authentication and data protection, so that user information and transactions are protected.

#### Acceptance Criteria

1. WHEN a user registers THEN the Tikit System SHALL require phone number verification via OTP sent within 30 seconds
2. WHEN a user logs in THEN the Tikit System SHALL generate a JWT token with 24-hour expiration and refresh token capability
3. WHEN sensitive data is stored THEN the Tikit System SHALL encrypt payment information and personal details using AES-256 encryption
4. WHEN API requests are made THEN the Tikit System SHALL implement rate limiting of 100 requests per minute per user to prevent abuse
5. WHEN a security breach is detected THEN the Tikit System SHALL lock the affected account and notify the user via SMS within 5 minutes

### Requirement 14

**User Story:** As a ticket scanner at an event, I want to verify tickets quickly using QR codes, so that I can efficiently manage event entry.

#### Acceptance Criteria

1. WHEN a scanner accesses the verification interface THEN the Tikit System SHALL activate the device camera for QR code scanning
2. WHEN a valid QR code is scanned THEN the Tikit System SHALL display ticket details including attendee name, ticket tier, and validity status within 1 second
3. WHEN a duplicate ticket is scanned THEN the Tikit System SHALL display a warning showing the previous scan time and location
4. WHEN a backup code is entered manually THEN the Tikit System SHALL validate the 6-digit code and display ticket information
5. WHEN scanning occurs offline THEN the Tikit System SHALL queue validation requests and process them when connectivity is restored

### Requirement 15

**User Story:** As a platform operator, I want to ensure the system performs well under load and scales efficiently, so that users have a reliable experience during peak times.

#### Acceptance Criteria

1. WHEN 10,000 concurrent users access the platform THEN the Tikit System SHALL maintain response times under 3 seconds for all operations
2. WHEN database queries are executed THEN the Tikit System SHALL use indexed queries and caching to return results within 500 milliseconds
3. WHEN images are served THEN the Tikit System SHALL use a CDN to deliver event images with 95% cache hit rate
4. WHEN the system scales THEN the Tikit System SHALL automatically provision additional server resources when CPU usage exceeds 70%
5. WHEN system errors occur THEN the Tikit System SHALL log errors with full context and alert administrators within 2 minutes
