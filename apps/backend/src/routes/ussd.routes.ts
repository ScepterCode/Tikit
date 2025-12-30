import { Router, Request, Response } from 'express';
import ussdService from '../services/ussd.service';

const router = Router();

/**
 * USSD callback endpoint
 * This endpoint receives callbacks from Africa's Talking USSD gateway
 * 
 * POST /api/ussd/callback
 * Body: { sessionId, serviceCode, phoneNumber, text }
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { sessionId, phoneNumber, text } = req.body;

    // Validate required fields
    if (!sessionId || !phoneNumber) {
      return res.status(400).send('END Invalid request');
    }

    // Handle USSD session
    const response = await ussdService.handleUSSDCallback({
      sessionId,
      phoneNumber,
      text: text || '',
    });

    // Return response in Africa's Talking format
    res.set('Content-Type', 'text/plain');
    res.send(response.response);
  } catch (error) {
    console.error('USSD callback error:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END Service temporarily unavailable. Please try again later.');
  }
});

/**
 * Get event by USSD code
 * This endpoint allows querying events by their 4-digit USSD code
 * 
 * GET /api/ussd/events/:code
 */
router.get('/events/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event code. Must be 4 digits.',
      });
    }

    // This would typically call a service method
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Event lookup endpoint',
      code,
    });
  } catch (error) {
    console.error('Event lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lookup event',
    });
  }
});

export default router;
