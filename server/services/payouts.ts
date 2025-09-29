import { storage } from '../storage';

export interface PayoutMethod {
  id: string;
  userId: string;
  provider: 'paxum' | 'ecp' | 'cosmo' | 'wire' | 'crypto';
  accountReference: string;
  isDefault: boolean;
  status: 'active' | 'suspended' | 'pending';
  minimumPayout: number; // in cents
  fee: number; // in cents or percentage
  metadata: any;
}

export interface PayoutCalculation {
  userId: string;
  grossEarnings: number;
  platformFee: number;
  processingFee: number;
  netPayout: number;
  transactions: {
    id: string;
    type: 'subscription' | 'tip' | 'ppv' | 'commission';
    amount: number;
    fee: number;
    createdAt: Date;
  }[];
  period: {
    start: Date;
    end: Date;
  };
}

export class CreatorPayoutService {
  private readonly PLATFORM_FEE_RATE = 0.20; // 20% platform fee
  private readonly MIN_PAYOUT_THRESHOLD = 5000; // $50.00 minimum
  private readonly PAYOUT_SCHEDULE_DAY = 1; // 1st of each month

  // Calculate creator earnings for a period
  async calculateCreatorEarnings(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<PayoutCalculation> {
    try {
      // Get all transactions for the creator in the period
      const transactions = await storage.getTransactionsAsCreator(userId);
      const periodTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= startDate && txDate <= endDate && tx.status === 'completed';
      });

      let grossEarnings = 0;
      const processedTransactions = [];

      for (const transaction of periodTransactions) {
        const transactionEarnings = transaction.creatorEarnings || 0;
        grossEarnings += transactionEarnings;

        processedTransactions.push({
          id: transaction.id,
          type: transaction.type as any,
          amount: transactionEarnings,
          fee: (transaction.providerFee || 0) + (transaction.platformFee || 0),
          createdAt: new Date(transaction.createdAt)
        });
      }

      const platformFee = Math.round(grossEarnings * this.PLATFORM_FEE_RATE);
      const processingFee = this.calculateProcessingFee(grossEarnings);
      const netPayout = grossEarnings - platformFee - processingFee;

      return {
        userId,
        grossEarnings,
        platformFee,
        processingFee,
        netPayout,
        transactions: processedTransactions,
        period: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error calculating creator earnings:', error);
      throw error;
    }
  }

  // Process automatic payouts for all eligible creators
  async processScheduledPayouts(): Promise<{
    processed: number;
    failed: number;
    totalAmount: number;
  }> {
    try {
      console.log('Starting scheduled payout processing...');
      
      // Calculate payout period (previous month)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get all creators
      const creators = await this.getAllCreators();
      
      let processed = 0;
      let failed = 0;
      let totalAmount = 0;

      for (const creator of creators) {
        try {
          // Calculate earnings
          const earnings = await this.calculateCreatorEarnings(
            creator.userId, 
            startDate, 
            endDate
          );

          // Skip if below minimum threshold
          if (earnings.netPayout < this.MIN_PAYOUT_THRESHOLD) {
            console.log(`Skipping payout for ${creator.userId}: Below minimum threshold`);
            continue;
          }

          // Check if payout already processed for this period
          const existingPayout = await this.getPayoutForPeriod(
            creator.userId, 
            startDate, 
            endDate
          );
          
          if (existingPayout) {
            console.log(`Payout already processed for ${creator.userId} for period ${startDate.toISOString()}-${endDate.toISOString()}`);
            continue;
          }

          // Get creator's payout method
          const payoutAccounts = await storage.getPayoutAccounts(creator.userId);
          const defaultAccount = payoutAccounts.find(acc => acc.isDefault);
          
          if (!defaultAccount) {
            console.log(`No default payout method for creator ${creator.userId}`);
            continue;
          }

          // Create payout record
          const payout = await this.createPayout({
            userId: creator.userId,
            amount: earnings.netPayout,
            payoutAccountId: defaultAccount.id,
            period: { start: startDate, end: endDate },
            earnings
          });

          // Submit to payment processor
          await this.submitPayout(payout);

          processed++;
          totalAmount += earnings.netPayout;

          // Log the payout
          await storage.createAuditLog({
            actorId: 'system',
            action: 'payout_processed',
            targetType: 'payout',
            targetId: payout.id,
            metadata: {
              amount: earnings.netPayout,
              period: { start: startDate, end: endDate },
              provider: defaultAccount.provider
            }
          });

        } catch (error) {
          console.error(`Failed to process payout for creator ${creator.userId}:`, error);
          failed++;
        }
      }

      console.log(`Payout processing complete: ${processed} processed, ${failed} failed, $${totalAmount / 100} total`);
      
      return {
        processed,
        failed,
        totalAmount
      };

    } catch (error) {
      console.error('Error in scheduled payout processing:', error);
      throw error;
    }
  }

  // Create individual payout
  private async createPayout(data: {
    userId: string;
    amount: number;
    payoutAccountId: string;
    period: { start: Date; end: Date };
    earnings: PayoutCalculation;
  }): Promise<any> {
    // This would create a payout record in the database
    // For now, return a mock payout object
    return {
      id: `payout_${Date.now()}`,
      userId: data.userId,
      amount: data.amount,
      status: 'pending',
      payoutAccountId: data.payoutAccountId,
      period: data.period,
      createdAt: new Date(),
      metadata: {
        grossEarnings: data.earnings.grossEarnings,
        platformFee: data.earnings.platformFee,
        processingFee: data.earnings.processingFee,
        transactionCount: data.earnings.transactions.length
      }
    };
  }

  // Submit payout to payment processor
  private async submitPayout(payout: any): Promise<void> {
    try {
      // Get payout account details
      const payoutAccounts = await storage.getPayoutAccounts(payout.userId);
      const account = payoutAccounts.find(acc => acc.id === payout.payoutAccountId);
      
      if (!account) {
        throw new Error('Payout account not found');
      }

      console.log(`Submitting payout ${payout.id} for $${payout.amount / 100} via ${account.provider}`);

      // In production, this would integrate with actual payment processors:
      // - Paxum: API call to create payout
      // - ePayService: API call to transfer funds
      // - Wire transfers: Generate wire instructions
      // - Crypto: Submit blockchain transaction

      switch (account.provider) {
        case 'paxum':
          await this.processPaxumPayout(payout, account);
          break;
        case 'ecp':
          await this.processECPPayout(payout, account);
          break;
        case 'wire':
          await this.processWirePayout(payout, account);
          break;
        case 'crypto':
          await this.processCryptoPayout(payout, account);
          break;
        default:
          throw new Error(`Unsupported payout provider: ${account.provider}`);
      }

      // Update payout status
      payout.status = 'processing';
      payout.submittedAt = new Date();
      
    } catch (error) {
      console.error('Error submitting payout:', error);
      payout.status = 'failed';
      payout.error = error.message;
      throw error;
    }
  }

  // Adult-friendly payout processors
  private async processPaxumPayout(payout: any, account: any): Promise<void> {
    console.log(`Processing Paxum payout: $${payout.amount / 100} to ${account.accountRef}`);
    // Simulate API call to Paxum
    // In production: POST to Paxum API with payout details
  }

  private async processECPPayout(payout: any, account: any): Promise<void> {
    console.log(`Processing ePayService payout: $${payout.amount / 100} to ${account.accountRef}`);
    // Simulate API call to ePayService
  }

  private async processWirePayout(payout: any, account: any): Promise<void> {
    console.log(`Processing wire transfer: $${payout.amount / 100} to ${account.accountRef}`);
    // Generate wire transfer instructions
  }

  private async processCryptoPayout(payout: any, account: any): Promise<void> {
    console.log(`Processing crypto payout: $${payout.amount / 100} to ${account.accountRef}`);
    // Submit blockchain transaction
  }

  // Utility methods
  private calculateProcessingFee(amount: number): number {
    // Different fees for different processors
    // For example: Paxum charges 1%, wire transfers have fixed fees
    return Math.round(amount * 0.01); // 1% processing fee
  }

  private async getAllCreators(): Promise<Array<{ userId: string; handle: string }>> {
    // Get all users with creator profiles
    // This would query the database for creator profiles
    return [
      // Mock data - in production this would come from database
    ];
  }

  private async getPayoutForPeriod(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any | null> {
    // Check if payout already exists for this period
    // This would query the payouts table
    return null; // Mock - no existing payout
  }

  // Get creator earnings summary
  async getCreatorEarningsSummary(
    userId: string,
    months: number = 12
  ): Promise<{
    totalEarnings: number;
    averageMonthly: number;
    lastPayout: any;
    pendingEarnings: number;
    payoutHistory: any[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);

      const earnings = await this.calculateCreatorEarnings(userId, startDate, endDate);
      const payoutRequests = await storage.getPayoutRequests(userId);

      return {
        totalEarnings: earnings.grossEarnings,
        averageMonthly: Math.round(earnings.grossEarnings / months),
        lastPayout: payoutRequests[0] || null,
        pendingEarnings: earnings.netPayout,
        payoutHistory: payoutRequests.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting creator earnings summary:', error);
      throw error;
    }
  }

  // Schedule automatic payouts (called by cron job)
  async scheduleNextPayout(): Promise<void> {
    const now = new Date();
    
    // Check if it's payout day (1st of month)
    if (now.getDate() === this.PAYOUT_SCHEDULE_DAY) {
      console.log('Running scheduled payouts...');
      await this.processScheduledPayouts();
    }
  }
}

export const creatorPayoutService = new CreatorPayoutService();