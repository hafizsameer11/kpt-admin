/**
 * Product management fixtures (ADM-060 – ADM-064).
 * Prototype-only data for the admin console products workspace.
 */

export type ProductStatus = "live" | "draft" | "closed" | "review";

export type ProductCategory =
  | "Call Account"
  | "Fixed Income"
  | "Treasury Bills"
  | "Commercial Paper"
  | "Corporate Bond"
  | "Mutual Fund";

export type ProductDoc = {
  id: string;
  name: string;
  kind: "Term sheet" | "Offer document" | "Issuer rating" | "Risk disclosure" | "Prospectus";
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
};

export type ProductCmsDetails = {
  about: string;
  how: string[];
  risks: string[];
  faqs: { q: string; a: string }[];
  highlights: { label: string; value: string }[];
};

export type AdminProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  issuer: string;
  rate: number;
  tenorDays: number;
  tenorLabel: string;
  minimum: number;
  status: ProductStatus;
  description: string;
  subscribers: number;
  raised: number;
  capacity: number;
  openedAt: string;
  closesAt: string;
  updatedAt: string;
  updatedBy: string;
  documents: ProductDoc[];
  history: { label: string; at: string; by: string }[];
  cms?: ProductCmsDetails;
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  live: "Open",
  draft: "Draft",
  review: "In review",
  closed: "Closed",
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, string> = {
  live: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  draft: "bg-muted text-muted-foreground ring-border",
  review: "bg-gold/25 text-gold-foreground ring-gold/40",
  closed: "bg-destructive/10 text-destructive ring-destructive/20",
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Call Account",
  "Fixed Income",
  "Treasury Bills",
  "Commercial Paper",
  "Corporate Bond",
  "Mutual Fund",
];

export const DOC_KINDS: ProductDoc["kind"][] = [
  "Term sheet",
  "Offer document",
  "Issuer rating",
  "Risk disclosure",
  "Prospectus",
];

export const PRODUCTS: AdminProduct[] = [
  {
    id: "pr-001",
    name: "Kipit Call Account",
    category: "Call Account",
    issuer: "Kipit Treasury",
    rate: 12.5,
    tenorDays: 0,
    tenorLabel: "Anytime access",
    minimum: 1000,
    status: "live",
    description:
      "Daily-accruing liquidity account. Customers can add and withdraw at any time with interest accrued daily and paid monthly.",
    subscribers: 8421,
    raised: 1_842_500_000,
    capacity: 3_000_000_000,
    openedAt: "12 Jan 2026",
    closesAt: "Open-ended",
    updatedAt: "28 Aug 2026 · 09:12",
    updatedBy: "Amaka O.",
    documents: [
      {
        id: "doc-1",
        name: "Call-account-terms-v4.pdf",
        kind: "Term sheet",
        size: "412 KB",
        uploadedAt: "12 Jan 2026",
        uploadedBy: "Amaka O.",
      },
      {
        id: "doc-2",
        name: "Risk-disclosure-2026.pdf",
        kind: "Risk disclosure",
        size: "228 KB",
        uploadedAt: "12 Jan 2026",
        uploadedBy: "Amaka O.",
      },
    ],
    history: [
      { label: "Rate moved 12.0% → 12.5%", at: "28 Aug 2026", by: "Amaka O." },
      { label: "Product published", at: "12 Jan 2026", by: "Tunde A." },
    ],
  },
  {
    id: "pr-002",
    name: "Kipit Fixed 90",
    category: "Fixed Income",
    issuer: "Kipit Treasury",
    rate: 18.25,
    tenorDays: 90,
    tenorLabel: "90 days",
    minimum: 50_000,
    status: "live",
    description:
      "Fixed tenor placement with rate locked at booking. Interest paid at maturity with optional roll over.",
    subscribers: 3120,
    raised: 964_000_000,
    capacity: 1_500_000_000,
    openedAt: "02 Mar 2026",
    closesAt: "Rolling",
    updatedAt: "30 Aug 2026 · 16:40",
    updatedBy: "Tunde A.",
    documents: [
      {
        id: "doc-3",
        name: "Fixed90-term-sheet.pdf",
        kind: "Term sheet",
        size: "356 KB",
        uploadedAt: "02 Mar 2026",
        uploadedBy: "Tunde A.",
      },
    ],
    history: [
      { label: "Minimum lowered ₦100,000 → ₦50,000", at: "30 Aug 2026", by: "Tunde A." },
      { label: "Product published", at: "02 Mar 2026", by: "Tunde A." },
    ],
  },
  {
    id: "pr-003",
    name: "FGN Treasury Bill · 182d",
    category: "Treasury Bills",
    issuer: "Federal Government of Nigeria",
    rate: 21.4,
    tenorDays: 182,
    tenorLabel: "182 days",
    minimum: 250_000,
    status: "live",
    description:
      "Sovereign-backed discount instrument sold at auction. Allocation confirmed after the auction settles.",
    subscribers: 612,
    raised: 486_000_000,
    capacity: 600_000_000,
    openedAt: "14 Aug 2026",
    closesAt: "09 Sep 2026",
    updatedAt: "01 Sep 2026 · 08:05",
    updatedBy: "Ifeoma N.",
    documents: [
      {
        id: "doc-4",
        name: "NTB-auction-circular.pdf",
        kind: "Offer document",
        size: "1.1 MB",
        uploadedAt: "14 Aug 2026",
        uploadedBy: "Ifeoma N.",
      },
    ],
    history: [{ label: "Auction window opened", at: "14 Aug 2026", by: "Ifeoma N." }],
  },
  {
    id: "pr-004",
    name: "Dangote Cement CP · 270d",
    category: "Commercial Paper",
    issuer: "Dangote Cement Plc",
    rate: 23.8,
    tenorDays: 270,
    tenorLabel: "270 days",
    minimum: 1_000_000,
    status: "review",
    description:
      "Corporate commercial paper issued at a discount. Requires compliance sign-off before publishing.",
    subscribers: 0,
    raised: 0,
    capacity: 900_000_000,
    openedAt: "—",
    closesAt: "30 Sep 2026",
    updatedAt: "03 Sep 2026 · 11:22",
    updatedBy: "Ifeoma N.",
    documents: [
      {
        id: "doc-5",
        name: "DangCem-CP-offer.pdf",
        kind: "Offer document",
        size: "2.4 MB",
        uploadedAt: "03 Sep 2026",
        uploadedBy: "Ifeoma N.",
      },
      {
        id: "doc-6",
        name: "Issuer-rating-A+.pdf",
        kind: "Issuer rating",
        size: "180 KB",
        uploadedAt: "03 Sep 2026",
        uploadedBy: "Ifeoma N.",
      },
    ],
    history: [{ label: "Submitted for review", at: "03 Sep 2026", by: "Ifeoma N." }],
  },
  {
    id: "pr-005",
    name: "Kipit Fixed 30",
    category: "Fixed Income",
    issuer: "Kipit Treasury",
    rate: 16.0,
    tenorDays: 30,
    tenorLabel: "30 days",
    minimum: 25_000,
    status: "draft",
    description: "Short tenor starter plan aimed at first-time investors moving out of the wallet.",
    subscribers: 0,
    raised: 0,
    capacity: 400_000_000,
    openedAt: "—",
    closesAt: "—",
    updatedAt: "02 Sep 2026 · 14:03",
    updatedBy: "Amaka O.",
    documents: [],
    history: [{ label: "Draft created", at: "02 Sep 2026", by: "Amaka O." }],
  },
  {
    id: "pr-006",
    name: "MTN Nigeria Bond · 3yr",
    category: "Corporate Bond",
    issuer: "MTN Nigeria Communications Plc",
    rate: 19.75,
    tenorDays: 1095,
    tenorLabel: "3 years",
    minimum: 2_000_000,
    status: "closed",
    description: "Fully subscribed corporate bond. Closed to new placements; existing holdings run to maturity.",
    subscribers: 214,
    raised: 750_000_000,
    capacity: 750_000_000,
    openedAt: "18 Apr 2026",
    closesAt: "22 Jun 2026",
    updatedAt: "22 Jun 2026 · 17:00",
    updatedBy: "Tunde A.",
    documents: [
      {
        id: "doc-7",
        name: "MTN-bond-prospectus.pdf",
        kind: "Prospectus",
        size: "3.8 MB",
        uploadedAt: "18 Apr 2026",
        uploadedBy: "Tunde A.",
      },
    ],
    history: [
      { label: "Product closed — fully subscribed", at: "22 Jun 2026", by: "Tunde A." },
      { label: "Product published", at: "18 Apr 2026", by: "Tunde A." },
    ],
  },
];

export function findProduct(id: string) {
  return liveProducts.find((p) => p.id === id);
}

let liveProducts: AdminProduct[] = [];

export function setLiveProducts(products: AdminProduct[]) {
  liveProducts = products;
}

export function getLiveProducts() {
  return liveProducts;
}

export async function hydrateAdminProductsFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveProducts = [];
      return [];
    }
    const { loadAdminProducts } = await import("./admin-mappers");
    liveProducts = await loadAdminProducts();
    return liveProducts;
  } catch {
    liveProducts = [];
    return [];
  }
}

export const PRODUCT_TOTALS = {
  live: PRODUCTS.filter((p) => p.status === "live").length,
  review: PRODUCTS.filter((p) => p.status === "review").length,
  draft: PRODUCTS.filter((p) => p.status === "draft").length,
  raised: PRODUCTS.reduce((s, p) => s + p.raised, 0),
  subscribers: PRODUCTS.reduce((s, p) => s + p.subscribers, 0),
};
