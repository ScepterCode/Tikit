import { Router, Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';

const router = Router();

// Test endpoint to update event capacity (for demonstration)
router.post('/event-capacity', async (req: Request, res: Response) => {
  try {
    const { eventId, ticketsSold, capacity } = req.body;

    if (!eventId || ticketsSold === undefined || !capacity) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, ticketsSold, capacity'
      });
    }

    const success = await SupabaseService.updateEventCapacity(eventId, ticketsSold, capacity);

    if (success) {
      res.json({
        success: true,
        message: 'Event capacity updated successfully',
        data: {
          eventId,
          ticketsSold,
          capacity,
          available: capacity - ticketsSold
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to update event capacity'
      });
    }
  } catch (error) {
    console.error('Error updating event capacity:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Test endpoint to update group buy status
router.post('/group-buy-status', async (req: Request, res: Response) => {
  try {
    const { groupBuyId, currentParticipants, totalParticipants, participants } = req.body;

    if (!groupBuyId || currentParticipants === undefined || !totalParticipants || !participants) {
      return res.status(400).json({
        error: 'Missing required fields: groupBuyId, currentParticipants, totalParticipants, participants'
      });
    }

    const success = await SupabaseService.updateGroupBuyStatus(
      groupBuyId, 
      currentParticipants, 
      totalParticipants, 
      participants
    );

    if (success) {
      res.json({
        success: true,
        message: 'Group buy status updated successfully',
        data: {
          groupBuyId,
          currentParticipants,
          totalParticipants,
          status: currentParticipants >= totalParticipants ? 'completed' : 'active'
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to update group buy status'
      });
    }
  } catch (error) {
    console.error('Error updating group buy status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Test endpoint to update spray money leaderboard
router.post('/spray-money', async (req: Request, res: Response) => {
  try {
    const { eventId, userId, userName, amount } = req.body;

    if (!eventId || !userId || !userName || amount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, userId, userName, amount'
      });
    }

    const success = await SupabaseService.updateSprayMoneyLeaderboard(eventId, userId, userName, amount);

    if (success) {
      res.json({
        success: true,
        message: 'Spray money leaderboard updated successfully',
        data: {
          eventId,
          userId,
          userName,
          amount
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to update spray money leaderboard'
      });
    }
  } catch (error) {
    console.error('Error updating spray money leaderboard:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Test endpoint to send notification
router.post('/notification', async (req: Request, res: Response) => {
  try {
    const { userId, eventId, type, title, message, data } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, title, message'
      });
    }

    const success = await SupabaseService.sendNotification(userId, eventId || null, type, title, message, data || {});

    if (success) {
      res.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to send notification'
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get event capacity
router.get('/event-capacity/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const capacity = await SupabaseService.getEventCapacity(eventId);

    if (capacity) {
      res.json({
        success: true,
        data: capacity
      });
    } else {
      res.status(404).json({
        error: 'Event capacity not found'
      });
    }
  } catch (error) {
    console.error('Error getting event capacity:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get spray money leaderboard
router.get('/spray-money/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const leaderboard = await SupabaseService.getSprayMoneyLeaderboard(eventId, limit);

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting spray money leaderboard:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;