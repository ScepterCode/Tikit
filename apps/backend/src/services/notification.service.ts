import prisma from '../lib/prisma.js';
import { getTrendingEvents } from './recommendation.service.js';
import whatsappService from '../lib/whatsapp.js';

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  trendingEventsEnabled: boolean;
  eventRemindersEnabled: boolean;
  eventUpdatesEnabled: boolean;
}

/**
 * Send push notification to user
 * This is a placeholder implementation - in production, this would integrate with
 * a push notification service like Firebase Cloud Messaging (FCM) or OneSignal
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    // TODO: Integrate with actual push notification service
    // For now, just log the notification
    console.log('Push notification sent:', {
      userId,
      title,
      body,
      data,
      timestamp: new Date().toISOString(),
    });

    // In production, this would call FCM or similar service:
    // await fcm.send({
    //   token: userDeviceToken,
    //   notification: { title, body },
    //   data,
    // });

    return {
      success: true,
      message: 'Push notification sent',
    };
  } catch (error) {
    console.error('Send push notification error:', error);
    return {
      success: false,
      message: 'Failed to send push notification',
    };
  }
}

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // For now, return default preferences
    // In production, these would be stored in the database
    const preferences: NotificationPreferences = {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      trendingEventsEnabled: true,
      eventRemindersEnabled: true,
      eventUpdatesEnabled: true,
    };

    return {
      success: true,
      preferences,
    };
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return {
      success: false,
      message: 'Failed to get notification preferences',
    };
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // TODO: Store preferences in database
    // For now, just acknowledge the update
    console.log('Notification preferences updated:', {
      userId,
      preferences,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Notification preferences updated',
      preferences,
    };
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return {
      success: false,
      message: 'Failed to update notification preferences',
    };
  }
}

/**
 * Check for trending events and send notifications to interested users
 * This would typically be run as a scheduled job (e.g., every hour)
 */
export async function sendTrendingEventNotifications() {
  try {
    // Get all users with their preferences
    const users = await prisma.user.findMany({
      include: {
        tickets: {
          include: {
            event: true,
          },
          where: {
            status: 'valid',
          },
        },
      },
    });

    const notificationsSent = [];

    for (const user of users) {
      // Get user's notification preferences
      const preferencesResult = await getNotificationPreferences(user.id);
      
      if (!preferencesResult.success || !preferencesResult.preferences) {
        continue;
      }

      const preferences = preferencesResult.preferences;

      // Skip if user has disabled trending event notifications
      if (!preferences.pushEnabled || !preferences.trendingEventsEnabled) {
        continue;
      }

      // Determine user's preferred event types from past attendance
      const pastEvents = user.tickets.map((ticket) => ticket.event);
      const eventTypeCounts: Record<string, number> = {};

      pastEvents.forEach((event) => {
        eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
      });

      // Get the most attended event type
      const preferredEventType = Object.entries(eventTypeCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      if (!preferredEventType) {
        // User has no past attendance, skip
        continue;
      }

      // Get trending events for user's preferred type and state
      const trendingResult = await getTrendingEvents(
        preferredEventType,
        user.state,
        5
      );

      if (!trendingResult.success || !trendingResult.trendingEvents) {
        continue;
      }

      const trendingEvents = trendingResult.trendingEvents;

      // Only send notification if there are trending events
      if (trendingEvents.length > 0) {
        const topEvent = trendingEvents[0].event;

        // Send personalized notification
        const notificationResult = await sendPushNotification(
          user.id,
          `Trending ${preferredEventType} events near you!`,
          `${topEvent.title} and ${trendingEvents.length - 1} other ${preferredEventType} events are trending in ${user.state}. Check them out!`,
          {
            type: 'trending_events',
            eventType: preferredEventType,
            state: user.state,
            topEventId: topEvent.id,
          }
        );

        if (notificationResult.success) {
          notificationsSent.push({
            userId: user.id,
            eventType: preferredEventType,
            eventCount: trendingEvents.length,
          });
        }
      }
    }

    return {
      success: true,
      message: `Sent ${notificationsSent.length} trending event notifications`,
      notificationsSent,
    };
  } catch (error) {
    console.error('Send trending event notifications error:', error);
    return {
      success: false,
      message: 'Failed to send trending event notifications',
    };
  }
}

/**
 * Send notification for a specific event to a user
 */
export async function sendEventNotification(
  userId: string,
  eventId: string,
  type: 'reminder' | 'update' | 'trending',
  customMessage?: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Get user's notification preferences
    const preferencesResult = await getNotificationPreferences(user.id);
    
    if (!preferencesResult.success || !preferencesResult.preferences) {
      return {
        success: false,
        message: 'Failed to get notification preferences',
      };
    }

    const preferences = preferencesResult.preferences;

    // Check if user has enabled this type of notification
    if (!preferences.pushEnabled) {
      return {
        success: false,
        message: 'User has disabled push notifications',
      };
    }

    if (type === 'reminder' && !preferences.eventRemindersEnabled) {
      return {
        success: false,
        message: 'User has disabled event reminders',
      };
    }

    if (type === 'update' && !preferences.eventUpdatesEnabled) {
      return {
        success: false,
        message: 'User has disabled event updates',
      };
    }

    if (type === 'trending' && !preferences.trendingEventsEnabled) {
      return {
        success: false,
        message: 'User has disabled trending event notifications',
      };
    }

    // Prepare notification content based on type
    let title = '';
    let body = '';

    switch (type) {
      case 'reminder':
        title = 'Event Reminder';
        body = customMessage || `Don't forget: ${event.title} is coming up soon!`;
        break;
      case 'update':
        title = 'Event Update';
        body = customMessage || `${event.title} has been updated. Check the latest details.`;
        break;
      case 'trending':
        title = 'Trending Event';
        body = customMessage || `${event.title} is trending in ${event.state}!`;
        break;
    }

    // Send notification
    const result = await sendPushNotification(user.id, title, body, {
      type,
      eventId: event.id,
      eventTitle: event.title,
    });

    return result;
  } catch (error) {
    console.error('Send event notification error:', error);
    return {
      success: false,
      message: 'Failed to send event notification',
    };
  }
}

/**
 * Send broadcast notification to all ticket holders of an event
 */
export async function sendEventBroadcast(
  eventId: string,
  title: string,
  message: string
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          where: {
            status: 'valid',
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Get unique users (in case they have multiple tickets)
    const uniqueUsers = Array.from(
      new Map(event.tickets.map((ticket) => [ticket.user.id, ticket.user])).values()
    );

    const notificationsSent = [];

    for (const user of uniqueUsers) {
      const result = await sendPushNotification(user.id, title, message, {
        type: 'broadcast',
        eventId: event.id,
        eventTitle: event.title,
      });

      if (result.success) {
        notificationsSent.push(user.id);
      }
    }

    return {
      success: true,
      message: `Broadcast sent to ${notificationsSent.length} users`,
      recipientCount: notificationsSent.length,
    };
  } catch (error) {
    console.error('Send event broadcast error:', error);
    return {
      success: false,
      message: 'Failed to send event broadcast',
    };
  }
}

/**
 * Send WhatsApp broadcast to all ticket holders of an event
 */
export async function sendWhatsAppBroadcast(
  eventId: string,
  message: string
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: {
          where: {
            status: 'valid',
          },
          include: {
            user: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        message: 'Event not found',
      };
    }

    // Get unique users with phone numbers
    const uniqueUsers = Array.from(
      new Map(event.tickets.map((ticket) => [ticket.user.id, ticket.user])).values()
    );

    // Filter users with valid phone numbers
    const phoneNumbers = uniqueUsers
      .filter((user) => user.phoneNumber)
      .map((user) => user.phoneNumber);

    if (phoneNumbers.length === 0) {
      return {
        success: false,
        message: 'No valid phone numbers found for ticket holders',
      };
    }

    // Format the message with event context
    const formattedMessage = `📢 *${event.title}*\n\n${message}\n\n_Sent via Tikit_`;

    // Send broadcast via WhatsApp
    const result = await whatsappService.sendBroadcast(phoneNumbers, formattedMessage);

    return {
      success: result.success,
      message: `WhatsApp broadcast sent to ${result.sentCount} of ${phoneNumbers.length} recipients`,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      totalRecipients: phoneNumbers.length,
      details: result.results,
    };
  } catch (error) {
    console.error('Send WhatsApp broadcast error:', error);
    return {
      success: false,
      message: 'Failed to send WhatsApp broadcast',
    };
  }
}
