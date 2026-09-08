import { QuoteStatus, type Quote } from "@omardtf/shared-types";

export const mockQuotes: Quote[] = [
  {
    id: "quo_1",
    businessName: "Redwood Roasters",
    contactName: "Sam Lee",
    email: "sam@redwoodroasters.com",
    phone: "555-020-9876",
    description: "50 branded polos with embroidered-look front logo, need by end of month.",
    quantity: 50,
    status: QuoteStatus.PENDING,
    createdAt: new Date().toISOString(),
  },
];
