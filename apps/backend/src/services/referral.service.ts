import prisma from '../lib/prisma.js';

/**
 * Generate a unique referral code
 * Uses 8-character alphanumeric code (uppercase)
 */
export const generateReferralCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  while (exists) {
    // Generate 8-character alphanumeric code
    code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const user = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    exists = !!user;
  }

  return code!;
};

/**
 * Get user's referral code
 */
export const getUserReferralCode = async (
  userId: string
): Promise<{ success: boolean; referralCode?: string; message: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    return {
      success: true,
      referralCode: user.referralCode,
      message: 'Referral code retrieved successfully',
    };
  } catch (error) {
    console.error('Error getting referral code:', error);
    return {
      success: false,
      message: 'Failed to retrieve referral code',
    };
  }
};

/**
 * Apply referral code during registration
 * Creates a pending referral record
 */
export const applyReferralCode = async (
  referralCode: string,
  newUserId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return {
        success: false,
        message: 'Invalid referral code',
      };
    }

    // Check if user is trying to refer themselves
    if (referrer.id === newUserId) {
      return {
        success: false,
        message: 'Cannot use your own referral code',
      };
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUserId,
        status: 'pending',
        rewardAmount: 200, // ₦200 reward
      },
    });

    return {
      success: true,
      message: 'Referral code applied successfully',
    };
  } catch (error) {
    console.error('Error applying referral code:', error);
    return {
      success: false,
      message: 'Failed to apply referral code',
    };
  }
};

/**
 * Track referred user's first purchase and credit referrer
 * Called when a referred user makes their first ticket purchase
 */
export const trackReferralPurchase = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Find pending referral for this user
    const referral = await prisma.referral.findFirst({
      where: {
        referredUserId: userId,
        status: 'pending',
      },
      include: {
        referrer: true,
      },
    });

    if (!referral) {
      // No pending referral found - user wasn't referred or already completed
      return {
        success: true,
        message: 'No pending referral found',
      };
    }

    // Update referral status and credit referrer
    await prisma.$transaction(async (tx) => {
      // Mark referral as completed
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          rewardPaid: true,
        },
      });

      // Credit ₦200 to referrer's wallet
      await tx.user.update({
        where: { id: referral.referrerId },
        data: {
          walletBalance: {
            increment: 200,
          },
        },
      });

      // Check if referrer has completed 5 referrals for bonus
      const completedReferrals = await tx.referral.count({
        where: {
          referrerId: referral.referrerId,
          status: 'completed',
        },
      });

      // Award ₦1000 bonus on 5th referral
      if (completedReferrals === 5) {
        await tx.user.update({
          where: { id: referral.referrerId },
          data: {
            walletBalance: {
              increment: 1000,
            },
          },
        });
      }
    });

    return {
      success: true,
      message: 'Referral reward credited successfully',
    };
  } catch (error) {
    console.error('Error tracking referral purchase:', error);
    return {
      success: false,
      message: 'Failed to track referral purchase',
    };
  }
};

/**
 * Get referral leaderboard
 * Returns top referrers sorted by referral count
 */
export const getReferralLeaderboard = async (
  limit: number = 50
): Promise<{
  success: boolean;
  leaderboard?: Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
    referralCount: number;
    totalEarnings: number;
  }>;
  message: string;
}> => {
  try {
    // Get all users with their referral counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referrals: {
          where: {
            status: 'completed',
          },
          select: {
            rewardAmount: true,
          },
        },
      },
    });

    // Calculate referral counts and earnings
    const leaderboard = users
      .map((user) => {
        const referralCount = user.referrals.length;
        const baseEarnings = user.referrals.reduce(
          (sum, ref) => sum + ref.rewardAmount,
          0
        );
        
        // Add ₦1000 bonus for every 5 referrals
        const bonuses = Math.floor(referralCount / 5) * 1000;
        const totalEarnings = baseEarnings + bonuses;

        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          referralCount,
          totalEarnings,
        };
      })
      .filter((user) => user.referralCount > 0) // Only include users with referrals
      .sort((a, b) => b.referralCount - a.referralCount) // Sort by referral count descending
      .slice(0, limit);

    return {
      success: true,
      leaderboard,
      message: 'Leaderboard retrieved successfully',
    };
  } catch (error) {
    console.error('Error getting referral leaderboard:', error);
    return {
      success: false,
      message: 'Failed to retrieve leaderboard',
    };
  }
};

/**
 * Get user's referral earnings and statistics
 */
export const getUserReferralStats = async (
  userId: string
): Promise<{
  success: boolean;
  stats?: {
    referralCode: string;
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    walletBalance: number;
  };
  message: string;
}> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        walletBalance: true,
        referrals: {
          select: {
            status: true,
            rewardAmount: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const completedReferrals = user.referrals.filter(
      (r) => r.status === 'completed'
    );
    const pendingReferrals = user.referrals.filter(
      (r) => r.status === 'pending'
    );

    const baseEarnings = completedReferrals.reduce(
      (sum, ref) => sum + ref.rewardAmount,
      0
    );
    
    // Add ₦1000 bonus for every 5 completed referrals
    const bonuses = Math.floor(completedReferrals.length / 5) * 1000;
    const totalEarnings = baseEarnings + bonuses;

    return {
      success: true,
      stats: {
        referralCode: user.referralCode,
        totalReferrals: user.referrals.length,
        completedReferrals: completedReferrals.length,
        pendingReferrals: pendingReferrals.length,
        totalEarnings,
        walletBalance: user.walletBalance,
      },
      message: 'Referral stats retrieved successfully',
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      success: false,
      message: 'Failed to retrieve referral stats',
    };
  }
};

/**
 * Withdraw wallet balance to mobile money
 * Minimum balance: ₦500
 */
export const withdrawWalletBalance = async (
  userId: string,
  amount: number,
  method: 'opay' | 'palmpay',
  accountDetails: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate minimum withdrawal amount
    if (amount < 500) {
      return {
        success: false,
        message: 'Minimum withdrawal amount is ₦500',
      };
    }

    // Get user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
      };
    }

    // Deduct from wallet
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });

    // TODO: Integrate with mobile money API (Opay/Palmpay)
    // For now, we just deduct from wallet
    // In production, this would trigger actual withdrawal to mobile money account

    return {
      success: true,
      message: `Withdrawal of ₦${amount} initiated successfully`,
    };
  } catch (error) {
    console.error('Error withdrawing wallet balance:', error);
    return {
      success: false,
      message: 'Failed to process withdrawal',
    };
  }
};

/**
 * Use wallet balance as payment credit for ticket purchase
 */
export const useWalletCredit = async (
  userId: string,
  amount: number
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
      };
    }

    // Deduct from wallet
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount,
        },
      },
    });

    return {
      success: true,
      message: `₦${amount} deducted from wallet successfully`,
    };
  } catch (error) {
    console.error('Error using wallet credit:', error);
    return {
      success: false,
      message: 'Failed to use wallet credit',
    };
  }
};
