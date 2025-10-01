"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCBillService = void 0;
exports.createCCBillService = createCCBillService;
const crypto_1 = __importDefault(require("crypto"));
const storage_1 = require("../storage");
class CCBillService {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.sandboxMode
            ? 'https://bill.ccbill.com/jpost/billingattest.cgi'
            : 'https://bill.ccbill.com/jpost/billing.cgi';
    }
    // Generate hosted checkout URL for subscriptions
    generateSubscriptionCheckoutUrl(params) {
        const formDigest = this.generateFormDigest({
            clientAccnum: this.config.accountNumber,
            clientSubacc: '0000',
            formName: this.config.formName,
            subscriptionTypeId: '1', // Recurring subscription
            price: (params.pricePerMonth / 100).toFixed(2),
            period: '30', // 30 days for monthly
            currencyCode: params.currency === 'USD' ? '840' : '840',
            formDigest: '',
        });
        const queryParams = new URLSearchParams({
            clientAccnum: this.config.accountNumber,
            clientSubacc: '0000',
            formName: this.config.formName,
            subscriptionTypeId: '1',
            price: (params.pricePerMonth / 100).toFixed(2),
            period: '30',
            currencyCode: params.currency === 'USD' ? '840' : '840',
            formDigest,
            // Custom fields for tracking
            customer_fname: 'Fan',
            customer_lname: 'User',
            // Pass through custom data
            UDT1: params.userId, // Fan user ID
            UDT2: params.creatorId, // Creator ID
            UDT3: 'subscription', // Transaction type
            UDT4: params.planName,
        });
        return `${this.baseUrl}?${queryParams.toString()}`;
    }
    // Generate hosted checkout URL for one-time purchases
    generatePurchaseCheckoutUrl(params) {
        const formDigest = this.generateFormDigest({
            clientAccnum: this.config.accountNumber,
            clientSubacc: '0000',
            formName: this.config.formName,
            initialPrice: (params.amount / 100).toFixed(2),
            currencyCode: params.currency === 'USD' ? '840' : '840',
            formDigest: '',
        });
        const queryParams = new URLSearchParams({
            clientAccnum: this.config.accountNumber,
            clientSubacc: '0000',
            formName: this.config.formName,
            initialPrice: (params.amount / 100).toFixed(2),
            currencyCode: params.currency === 'USD' ? '840' : '840',
            formDigest,
            // Custom fields
            customer_fname: 'Fan',
            customer_lname: 'User',
            // Pass through custom data
            UDT1: params.userId,
            UDT2: params.creatorId || '',
            UDT3: params.type,
            UDT4: params.mediaId || '',
        });
        return `${this.baseUrl}?${queryParams.toString()}`;
    }
    // Generate form digest for security - CCBill specific format
    generateFormDigest(params) {
        // CCBill digest format: clientAccnum + clientSubacc + formName + (price + period OR initialPrice) + currencyCode + salt
        let stringToHash;
        if (params.price && params.period) {
            // Subscription digest
            stringToHash = params.clientAccnum + params.clientSubacc + params.formName +
                params.price + params.period + params.currencyCode + this.config.clientSecret;
        }
        else if (params.initialPrice) {
            // One-time purchase digest  
            stringToHash = params.clientAccnum + params.clientSubacc + params.formName +
                params.initialPrice + params.currencyCode + this.config.clientSecret;
        }
        else {
            throw new Error('Invalid parameters for digest generation');
        }
        // Generate MD5 hash
        return crypto_1.default.createHash('md5').update(stringToHash).digest('hex');
    }
    // Verify CCBill webhook using MD5 verification (not HMAC)
    verifyWebhookData(formData) {
        // CCBill sends verification via built-in fields
        const { verificationHash } = formData, data = __rest(formData, ["verificationHash"]);
        if (!verificationHash) {
            return false;
        }
        // Create verification string from form data
        // CCBill concatenates specific fields for verification
        const verificationString = [
            data.clientAccnum || '',
            data.clientSubacc || '',
            data.subscriptionId || data.transactionId || '',
            this.config.webhookSecret // Verification key
        ].join('');
        const expectedHash = crypto_1.default.createHash('md5').update(verificationString).digest('hex');
        return expectedHash.toLowerCase() === verificationHash.toLowerCase();
    }
    // Process webhook notification
    async processWebhookNotification(webhookData) {
        const { eventType, subscriptionId, transactionId, customerId } = webhookData;
        switch (eventType) {
            case 'NewSaleSuccess':
                await this.handleNewSale(webhookData);
                break;
            case 'RenewalSuccess':
                await this.handleRenewalSuccess(webhookData);
                break;
            case 'Cancellation':
                await this.handleCancellation(webhookData);
                break;
            case 'Chargeback':
                await this.handleChargeback(webhookData);
                break;
            case 'Refund':
                await this.handleRefund(webhookData);
                break;
            default:
                console.warn(`Unhandled CCBill webhook event: ${eventType}`);
        }
    }
    async handleNewSale(data) {
        const { subscriptionId, transactionId, initialPrice, accountingInitialPrice, UDT1: userId, UDT2: creatorId, UDT3: type, UDT4: additionalData, currencyCode } = data;
        // Create transaction record
        await storage_1.storage.createTransaction({
            userId,
            creatorId: creatorId || null,
            mediaId: type === 'purchase' ? additionalData : null,
            provider: 'ccbill',
            providerTransactionId: transactionId,
            type,
            status: 'completed',
            amountCents: Math.round(parseFloat(initialPrice) * 100),
            currency: currencyCode === '840' ? 'USD' : 'USD',
            providerFee: Math.round((parseFloat(initialPrice) - parseFloat(accountingInitialPrice)) * 100),
            platformFee: Math.round(parseFloat(accountingInitialPrice) * 0.05 * 100), // 5% platform fee
            creatorEarnings: Math.round(parseFloat(accountingInitialPrice) * 0.95 * 100), // 95% to creator
            metadata: data,
        });
        // If it's a subscription, create or update subscription record
        if (type === 'subscription' && subscriptionId) {
            // Check if subscription already exists
            const existingSubscriptions = await storage_1.storage.getSubscriptionsAsFan(userId);
            const existingSubscription = existingSubscriptions.find(s => s.providerSubscriptionId === subscriptionId);
            if (existingSubscription) {
                // Update existing subscription
                await storage_1.storage.updateSubscription(existingSubscription.id, {
                    status: 'active',
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(),
                });
            }
            else {
                // Create new subscription
                await storage_1.storage.createSubscription({
                    userId,
                    creatorId,
                    provider: 'ccbill',
                    providerSubscriptionId: subscriptionId,
                    status: 'active',
                    pricePerMonth: Math.round(parseFloat(initialPrice) * 100),
                    currency: 'USD',
                    billingCycle: 'monthly',
                    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
                });
            }
        }
        // Log the transaction
        await storage_1.storage.createAuditLog({
            actorId: userId,
            action: 'payment_success',
            targetType: 'transaction',
            targetId: transactionId,
            metadata: { provider: 'ccbill', amount: initialPrice, type },
        });
    }
    async handleRenewalSuccess(data) {
        const { subscriptionId, transactionId, billingAmount, accountingAmount } = data;
        // Update subscription next billing date
        const subscription = await storage_1.storage.getSubscriptionsAsFan(data.UDT1);
        const activeSubscription = subscription.find(s => s.providerSubscriptionId === subscriptionId);
        if (activeSubscription) {
            await storage_1.storage.updateSubscription(activeSubscription.id, {
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
            });
            // Create transaction record for renewal
            await storage_1.storage.createTransaction({
                userId: activeSubscription.userId,
                creatorId: activeSubscription.creatorId,
                subscriptionId: activeSubscription.id,
                provider: 'ccbill',
                providerTransactionId: transactionId,
                type: 'subscription',
                status: 'completed',
                amountCents: Math.round(parseFloat(billingAmount) * 100),
                currency: 'USD',
                providerFee: Math.round((parseFloat(billingAmount) - parseFloat(accountingAmount)) * 100),
                platformFee: Math.round(parseFloat(accountingAmount) * 0.05 * 100),
                creatorEarnings: Math.round(parseFloat(accountingAmount) * 0.95 * 100),
                metadata: data,
            });
        }
    }
    async handleCancellation(data) {
        const { subscriptionId } = data;
        // Find and cancel subscription
        const subscriptions = await storage_1.storage.getSubscriptionsAsFan(data.UDT1);
        const activeSubscription = subscriptions.find(s => s.providerSubscriptionId === subscriptionId);
        if (activeSubscription) {
            await storage_1.storage.updateSubscription(activeSubscription.id, {
                status: 'cancelled',
                cancelledAt: new Date(),
            });
        }
    }
    async handleChargeback(data) {
        const { transactionId } = data;
        // Update transaction status to chargeback
        const transactions = await storage_1.storage.getTransactionsAsBuyer(data.UDT1);
        const transaction = transactions.find(t => t.providerTransactionId === transactionId);
        if (transaction) {
            await storage_1.storage.updateTransaction(transaction.id, {
                status: 'chargeback',
            });
        }
    }
    async handleRefund(data) {
        const { transactionId } = data;
        // Update transaction status to refunded
        const transactions = await storage_1.storage.getTransactionsAsBuyer(data.UDT1);
        const transaction = transactions.find(t => t.providerTransactionId === transactionId);
        if (transaction) {
            await storage_1.storage.updateTransaction(transaction.id, {
                status: 'refunded',
            });
        }
    }
}
exports.CCBillService = CCBillService;
// Export service with environment configuration
function createCCBillService() {
    const config = {
        accountNumber: process.env.CCBILL_ACCOUNT_NUMBER || '',
        clientId: process.env.CCBILL_CLIENT_ID || '',
        clientSecret: process.env.CCBILL_CLIENT_SECRET || '',
        formName: process.env.CCBILL_FORM_NAME || 'cc_form',
        webhookSecret: process.env.CCBILL_WEBHOOK_SECRET || '',
        sandboxMode: process.env.NODE_ENV !== 'production',
    };
    return new CCBillService(config);
}
