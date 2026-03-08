const ENTITY_TYPE_TO_API: Record<string, string> = {
  "sole-trader": "sole_trader",
  partnership: "partnership",
  "limited-company": "limited_company",
  llp: "limited_liability_partnership",
  charity: "charity",
  other: "other"
};

const ENTITY_TYPE_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITY_TYPE_TO_API).map(([k, v]) => [v, k])
);

const REVENUE_BAND_TO_API: Record<string, string> = {
  "0-90k": "0_to_90000",
  "90k-750k": "90000_to_750000",
  "750k-2m": "750000_to_2m",
  "2m-5m": "2m_to_5m",
  "5m-10m": "5m_to_10m",
  "10m+": "10m_plus"
};

const REVENUE_BAND_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(REVENUE_BAND_TO_API).map(([k, v]) => [v, k])
);

const MARKETPLACE_TO_API: Record<string, string> = {
  Amazon: "amazon",
  eBay: "ebay",
  "TikTok Shop": "tiktok_shop",
  Shopify: "shopify",
  WooCommerce: "woocommerce",
  Etsy: "etsy",
  "Facebook Marketplace": "facebook_marketplace",
  "Instagram Shopping": "instagram_shopping",
  Other: "other"
};

const MARKETPLACE_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(MARKETPLACE_TO_API).map(([k, v]) => [v, k])
);

const TOOL_TO_API: Record<string, string> = {
  Klarna: "klarna",
  Square: "square",
  Stripe: "stripe",
  Worldpay: "worldpay",
  Braintree: "braintree",
  "Amazon Pay": "amazon_pay",
  "Shopify Payments": "shopify_payments",
  Clearpay: "clearpay",
  PayPal: "paypal",
  GoCardless: "gocardless",
  Other: "other"
};

const TOOL_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(TOOL_TO_API).map(([k, v]) => [v, k]));

function toApiValue(formValue: string, toMap: Record<string, string>, fallback: (v: string) => string): string {
  const mapped = toMap[formValue];
  if (mapped) return mapped;
  return fallback(formValue);
}

function fromApiValue(apiValue: string, fromMap: Record<string, string>, fallback: (v: string) => string): string {
  const mapped = fromMap[apiValue];
  if (mapped) return mapped;
  return fallback(apiValue);
}

export function toApiEntityType(formValue: string): string {
  return toApiValue(formValue, ENTITY_TYPE_TO_API, (v) => v.replace(/-/g, "_").toLowerCase());
}

export function fromApiEntityType(apiValue: string): string {
  return fromApiValue(apiValue, ENTITY_TYPE_FROM_API, (v) => v.replace(/_/g, "-"));
}

export function toApiRevenueBand(formValue: string): string {
  return toApiValue(formValue, REVENUE_BAND_TO_API, (v) => v.replace(/-/g, "_").replace(/\+/g, "_plus").toLowerCase());
}

export function fromApiRevenueBand(apiValue: string): string {
  return fromApiValue(apiValue, REVENUE_BAND_FROM_API, (v) => v.replace(/_/g, "-"));
}

export function toApiMarketplaces(formValues: string[]): string[] {
  return formValues.map((v) => toApiValue(v, MARKETPLACE_TO_API, (x) => x.toLowerCase().replace(/\s+/g, "_")));
}

export function fromApiMarketplaces(apiValues: string[]): string[] {
  return apiValues.map((v) =>
    fromApiValue(v, MARKETPLACE_FROM_API, (x) =>
      x
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    )
  );
}

export function toApiTools(formValues: string[]): string[] {
  return formValues.map((v) => toApiValue(v, TOOL_TO_API, (x) => x.toLowerCase().replace(/\s+/g, "_")));
}

export function fromApiTools(apiValues: string[]): string[] {
  return apiValues.map((v) =>
    fromApiValue(v, TOOL_FROM_API, (x) =>
      x
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    )
  );
}

export function buildBusinessProfilePayload(params: {
  businessName: string;
  businessEntityType: string;
  annualRevenueBand: string;
  marketplaces: string[];
  tools: string[];
}): {
  businessName: string;
  businessEntityType: string;
  annualRevenueBand: string;
  marketplaces: string[];
  tools: string[];
} {
  return {
    businessName: params.businessName,
    businessEntityType: toApiEntityType(params.businessEntityType),
    annualRevenueBand: toApiRevenueBand(params.annualRevenueBand),
    marketplaces: toApiMarketplaces(params.marketplaces),
    tools: toApiTools(params.tools)
  };
}
