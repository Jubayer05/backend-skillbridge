type SslcommerzInitResponse = {
  status?: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  gw?: unknown;
};

function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

export function getBackendPublicOrigin(): string {
  const fromEnv =
    process.env.BACKEND_PUBLIC_URL ??
    process.env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? "4000"}`;
  return normalizeOrigin(fromEnv);
}

export function getFrontendOrigin(): string {
  return normalizeOrigin(process.env.FRONTEND_URL ?? "http://localhost:3000");
}

type InitPaymentArgs = {
  tranId: string;
  amount: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  };
  product: {
    name: string;
    category: string;
  };
  metadata?: Record<string, string>;
};

export async function sslcommerzInitPayment(args: InitPaymentArgs): Promise<{
  gatewayUrl: string;
  raw: SslcommerzInitResponse;
}> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();

  if (!storeId || !storePass) {
    throw new Error(
      "SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD are required",
    );
  }

  const backendOrigin = getBackendPublicOrigin();
  const frontendOrigin = getFrontendOrigin();

  const successUrl = `${backendOrigin}/api/v1/payments/sslcommerz/success`;
  const failUrl = `${backendOrigin}/api/v1/payments/sslcommerz/fail`;
  const cancelUrl = `${backendOrigin}/api/v1/payments/sslcommerz/cancel`;

  const form = new URLSearchParams();
  form.set("store_id", storeId);
  form.set("store_passwd", storePass);
  form.set("total_amount", args.amount);
  form.set("currency", "USD");
  form.set("tran_id", args.tranId);
  form.set("success_url", successUrl);
  form.set("fail_url", failUrl);
  form.set("cancel_url", cancelUrl);

  form.set("cus_name", args.customer.name);
  form.set("cus_email", args.customer.email);
  form.set("cus_add1", args.customer.address ?? "N/A");
  form.set("cus_city", args.customer.city ?? "N/A");
  form.set("cus_country", args.customer.country ?? "Bangladesh");
  form.set("cus_phone", args.customer.phone ?? "01000000000");

  form.set("shipping_method", "NO");
  form.set("product_name", args.product.name);
  form.set("product_category", args.product.category);
  form.set("product_profile", "general");

  // Optional custom params (will be echoed back by SSLCommerz)
  if (args.metadata) {
    const entries = Object.entries(args.metadata).slice(0, 4);
    for (let i = 0; i < entries.length; i += 1) {
      const [k, v] = entries[i]!;
      form.set(`value_${String.fromCharCode(65 + i)}`, `${k}:${v}`);
    }
  }

  // Where SSLCommerz should return the user after payment (fallback for some flows)
  form.set(
    "redirect_url",
    `${frontendOrigin}/checkout/payment/sslcommerz/result`,
  );

  const endpoint = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const text = await res.text();
  let json: SslcommerzInitResponse;
  try {
    json = text ? (JSON.parse(text) as SslcommerzInitResponse) : {};
  } catch {
    throw new Error("Invalid response from SSLCommerz");
  }

  if (!res.ok) {
    throw new Error(json.failedreason ?? "SSLCommerz init failed");
  }

  const gatewayUrl = json.GatewayPageURL?.trim();
  if (!gatewayUrl) {
    throw new Error(
      json.failedreason ?? "SSLCommerz did not return gateway url",
    );
  }

  return { gatewayUrl, raw: json };
}
