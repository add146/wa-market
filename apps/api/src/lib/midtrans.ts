/**
 * Midtrans Snap API helper
 * Uses Midtrans REST API directly via fetch() — no SDK needed.
 */

const MIDTRANS_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';

interface MidtransTransactionParams {
    orderId: string;
    grossAmount: number;
    customerFirstName?: string;
    customerPhone?: string;
    customerEmail?: string;
    itemDetails?: Array<{
        id: string;
        price: number;
        quantity: number;
        name: string;
    }>;
    callbacks?: {
        finish?: string;
        error?: string;
        pending?: string;
    };
}

interface MidtransSnapResponse {
    token: string;
    redirect_url: string;
}

function midtransAuthHeader(serverKey: string): string {
    return 'Basic ' + btoa(serverKey + ':');
}

export async function createMidtransTransaction(
    serverKey: string,
    params: MidtransTransactionParams
): Promise<{ success: boolean; data?: MidtransSnapResponse; error?: string }> {
    try {
        const body: any = {
            transaction_details: {
                order_id: params.orderId,
                gross_amount: params.grossAmount,
            },
        };

        if (params.customerFirstName || params.customerPhone || params.customerEmail) {
            body.customer_details = {};
            if (params.customerFirstName) body.customer_details.first_name = params.customerFirstName;
            if (params.customerPhone) body.customer_details.phone = params.customerPhone;
            if (params.customerEmail) body.customer_details.email = params.customerEmail;
        }

        if (params.itemDetails && params.itemDetails.length > 0) {
            body.item_details = params.itemDetails;
        }

        if (params.callbacks) {
            body.callbacks = params.callbacks;
        }

        const response = await fetch(MIDTRANS_SNAP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': midtransAuthHeader(serverKey),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errData = await response.text();
            console.error('Midtrans create transaction error:', errData);
            return { success: false, error: `Midtrans API error: ${response.status}` };
        }

        const data = await response.json() as MidtransSnapResponse;
        return { success: true, data };
    } catch (e: any) {
        console.error('Midtrans fetch error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Verify Midtrans notification signature.
 * signature_key = SHA512(order_id + status_code + gross_amount + serverKey)
 */
export async function verifyMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    serverKey: string,
    signatureKey: string
): Promise<boolean> {
    const payload = orderId + statusCode + grossAmount + serverKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === signatureKey;
}
