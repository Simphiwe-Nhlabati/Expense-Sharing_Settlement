/**
 * Subscription API Client
 * Handles all subscription-related API calls
 */

const API_BASE = "/api/subscription";

interface UpgradeRequest {
  tier: "BRAAI" | "HOUSEHOLD" | "AGENT";
  paymentProviderSubscriptionId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface UpgradeResponse {
  success: boolean;
  message: string;
  checkoutUrl?: string;
  sessionId?: string;
  reference?: string;
  tier?: string;
  price?: string;
  subscription?: any;
}

interface SubscriptionResponse {
  id: string;
  userId: string;
  tier: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  limits: {
    maxGroups: number;
    maxMembersPerGroup: number;
    historyDays: number;
    features: string[];
    priceZar: number;
  };
  availableTiers?: any[];
}

interface TiersResponse {
  tiers: Array<{
    tier: string;
    name: string;
    maxGroups: number;
    maxMembersPerGroup: number;
    historyDays: number;
    features: string[];
    priceZar: number;
    isCurrent: boolean;
    popular: boolean;
  }>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.message || error.error || "Request failed");
  }
  return response.json();
}

export const subscriptionApi = {
  /**
   * Get current subscription details
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    const response = await fetch(API_BASE, {
      method: "GET",
      credentials: "include",
    });
    return handleResponse<SubscriptionResponse>(response);
  },

  /**
   * Get all available tiers
   */
  async getTiers(): Promise<TiersResponse> {
    const response = await fetch(`${API_BASE}/tiers`, {
      method: "GET",
      credentials: "include",
    });
    return handleResponse<TiersResponse>(response);
  },

  /**
   * Upgrade subscription tier
   */
  async upgrade(request: UpgradeRequest): Promise<UpgradeResponse> {
    const response = await fetch(`${API_BASE}/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
    return handleResponse<UpgradeResponse>(response);
  },

  /**
   * Cancel subscription
   */
  async cancel(): Promise<UpgradeResponse> {
    const response = await fetch(`${API_BASE}/cancel`, {
      method: "POST",
      credentials: "include",
    });
    return handleResponse<UpgradeResponse>(response);
  },

  /**
   * Verify Paystack payment reference
   */
  async verifyPayment(reference: string): Promise<UpgradeResponse> {
    const response = await fetch(`${API_BASE}/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        tier: "HOUSEHOLD", // Will be determined by webhook
        paymentProviderSubscriptionId: reference,
      }),
    });
    return handleResponse<UpgradeResponse>(response);
  },
};
