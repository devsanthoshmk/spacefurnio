import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { cmsPages, cmsSections, cmsPolicies } from './schema/cms';

interface PageSeed {
  slug: string;
  title: string;
  seoMetadata: Record<string, any>;
}

interface SectionSeed {
  id: string;
  pageSlug: string;
  sectionKey: string;
  sortOrder: number;
  data: Record<string, any>;
}

interface PolicySeed {
  slug: string;
  title: string;
  content: string;
}

const PAGES: PageSeed[] = [
  {
    slug: 'home',
    title: 'Home Page',
    seoMetadata: {
      title: 'Spacefurnio | Luxury Architectural Furniture',
      description: 'Bespoke architectural furniture and interior craftsmanship.',
    },
  },
  {
    slug: 'about',
    title: 'About Us',
    seoMetadata: {
      title: 'About Us | Spacefurnio',
      description: 'Shaping spaces with purpose, personality, and precision.',
    },
  },
  {
    slug: 'collabs',
    title: 'SF x Collabs',
    seoMetadata: {
      title: 'SF x Collabs | Spacefurnio',
      description: 'Collaborations with visionary design partners.',
    },
  },
  {
    slug: 'portfolio',
    title: 'Portfolio',
    seoMetadata: {
      title: 'Portfolio | Spacefurnio',
      description: 'Curated collection of bespoke interior and architectural works.',
    },
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    seoMetadata: {
      title: 'Contact Us | Spacefurnio',
      description: 'Get in touch with our design studio in Tuticorin, Chennai.',
    },
  },
  {
    slug: 'footer',
    title: 'Global Footer',
    seoMetadata: {},
  },
];

const SECTIONS: SectionSeed[] = [
  {
    id: 'home-hero',
    pageSlug: 'home',
    sectionKey: 'hero',
    sortOrder: 0,
    data: {
      brand_name: 'Spacefurnio',
      tagline: '"Creative Meets Living"',
      new_arrivals_heading: 'Discover Our Curated Collection',
      coming_soon_badge: 'New Spring 2026 Collection',
      cta_line_1: 'Explore Bespoke Furniture',
      cta_line_2: 'Crafted for Discerning Spaces',
      grab_now_button: 'Explore Collection',
      hero_banner_image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    id: 'home-products',
    pageSlug: 'home',
    sectionKey: 'products',
    sortOrder: 1,
    data: {
      section_heading: 'Featured Architectural Pieces',
      section_button: 'View All Products',
    },
  },
  {
    id: 'home-scroll',
    pageSlug: 'home',
    sectionKey: 'scroll',
    sortOrder: 2,
    data: {
      scroll_text_1: 'Transforming spaces with bespoke craftsmanship',
      scroll_text_2: 'Where architectural elegance meets timeless living',
    },
  },
  {
    id: 'about-intro',
    pageSlug: 'about',
    sectionKey: 'intro',
    sortOrder: 0,
    data: {
      headline: 'Shaping Spaces with Purpose, Personality, and Precision',
      paragraph:
        'At Spacefurnio, we are passionate about shaping spaces that reflect purpose, personality, and precision. We offer an integrated approach to architecture, construction, interior design, and custom furniture, ensuring every detail aligns seamlessly with your vision.',
    },
  },
  {
    id: 'about-story',
    pageSlug: 'about',
    sectionKey: 'story',
    sortOrder: 1,
    data: {
      quote:
        "Where lines meet light, and function meets soul, you'll find us – blending vision with reality & creativity with living. Every corner crafted. Every piece with purpose. Because your space deserves more than structure, it deserves a story.",
      pillars: [
        {
          title: 'Bespoke Craftsmanship',
          desc: 'Hand-selected hardwoods, precision joinery, and artisanal finishes designed to endure.',
        },
        {
          title: 'Architectural Harmony',
          desc: 'Furniture designed as natural extensions of modern architectural lines and spatial flow.',
        },
        {
          title: 'Sustainable Materials',
          desc: 'Responsibly sourced timber, low-VOC finishes, and eco-conscious fabrication.',
        },
      ],
    },
  },
  {
    id: 'collabs-main',
    pageSlug: 'collabs',
    sectionKey: 'main',
    sortOrder: 0,
    data: {
      headline: 'Spacefurnio × Collabs',
      quote:
        "We believe that true elegance is found in the dialogue between distinct voices. Our collaborations series invites the world's most visionary brands and designers to reimagine interior forms.",
      curated_note:
        'Exclusive limited-edition pieces developed in tandem with master artisans and visionary architects.',
    },
  },
  {
    id: 'portfolio-main',
    pageSlug: 'portfolio',
    sectionKey: 'main',
    sortOrder: 0,
    data: {
      headline: 'Discover Our Latest Collection',
      description:
        'Explore a curated selection of minimalist designs that bring harmony and functionality to your living spaces.',
      cta_text: 'Inquire About Custom Projects',
      cta_link: '/contact',
    },
  },
  {
    id: 'contact-details',
    pageSlug: 'contact',
    sectionKey: 'details',
    sortOrder: 0,
    data: {
      office_address: '90/1, North Beach Road Tuticorin, Chennai – 628001.',
      phone: '+91 9751112025',
      email: 'info.spacefurnio@gmail.com',
      operating_hours: 'Monday to Saturday, 9:00 AM – 6:00 PM IST',
      response_time: 'Our design consultants typically respond within 24 hours.',
    },
  },
  {
    id: 'footer-details',
    pageSlug: 'footer',
    sectionKey: 'footer_info',
    sortOrder: 0,
    data: {
      brand_statement:
        'Transforming spaces with bespoke craftsmanship and timeless architectural elegance.',
      copyright: '© 2026 Spacefurnio – All rights reserved.',
      address: '90/1, North Beach Road Tuticorin, Chennai – 628001.',
      phone: '+91 9751112025',
      email: 'info.spacefurnio@gmail.com',
      social_links: [
        {
          name: 'facebook',
          url: 'https://facebook.com/spacefurnio',
          label: 'Follow us on Facebook',
        },
        {
          name: 'twitter',
          url: 'https://twitter.com/spacefurnio',
          label: 'Follow us on Twitter',
        },
        {
          name: 'instagram',
          url: 'https://instagram.com/spacefurnio',
          label: 'Follow us on Instagram',
        },
        {
          name: 'linkedin',
          url: 'https://linkedin.com/company/spacefurnio',
          label: 'Follow us on LinkedIn',
        },
      ],
    },
  },
];

const POLICIES: PolicySeed[] = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Effective Date:** January 1, 2026  
**Last Updated:** February 26, 2026  

Welcome to **Spacefurnio** ("we", "our", or "us"). We design and curate luxury architectural furniture and interior creations. We are committed to safeguarding the privacy and security of your personal information.

---

### 1. Information We Collect
We collect information to deliver personalized design consultations, process orders, and facilitate white-glove delivery:
- **Personal Identification:** Name, billing address, shipping destination, email address, and telephone number.
- **Architectural & Project Specifications:** Custom dimensions, CAD files, material preferences, and design inquiries submitted for bespoke commissions.
- **Transaction Details:** Payment confirmation tokens (processed securely via PCI-DSS compliant payment gateways; we do not store raw credit card numbers).
- **Technical & Usage Data:** IP address, browser type, device information, and interaction patterns with our digital storefront.

---

### 2. How We Use Your Information
Your data is used strictly for legitimate business purposes:
- Fulfilling orders and coordinating white-glove freight delivery.
- Providing architectural design assistance and custom quotation services.
- Communicating order updates, delivery schedules, and warranty registrations.
- Enhancing website performance, platform security, and fraud prevention.
- Sending curated architectural journals or product announcements (only with explicit consent).

---

### 3. Data Protection and Encryption
We implement industry-leading technical and organizational security measures:
- **Data in Transit:** All communications are encrypted using Transport Layer Security (TLS 1.3).
- **Data at Rest:** Sensitive client data is stored in encrypted databases protected by strict Row Level Security (RLS) policies.
- **Access Controls:** Only authorized studio personnel and certified delivery logistics partners have access to the information required to complete fulfillment.

---

### 4. Cookies and Tracking Technologies
Spacefurnio uses essential and performance cookies to:
- Maintain your active browsing session and shopping cart state.
- Remember client design preferences and localized display settings.
- Analyze aggregated site traffic to optimize user experience.

You may configure your browser to decline non-essential cookies; however, certain site features may have diminished functionality.

---

### 5. Sharing with Trusted Third Parties
We never sell, rent, or trade your personal information. We share data only with:
- **Logistics Partners:** Specialized furniture carriers providing white-glove transport and assembly.
- **Payment Processors:** PCI-compliant payment infrastructure for secure transaction verification.
- **Cloud Infrastructure Providers:** High-security hosting environments adhering to ISO/IEC 27001 standards.

---

### 6. Your Rights and Choices
Subject to applicable jurisdiction and data protection laws, you have the right to:
- Access, review, or request a copy of the personal data we hold about you.
- Request correction of inaccurate or incomplete records.
- Request erasure of your data, subject to statutory retention obligations (e.g., tax, audit, warranty records).
- Opt out of promotional newsletters at any time via the unsubscribe link.

---

### 7. Contact Us
For questions regarding this Privacy Policy or to exercise your privacy rights, please reach out to our privacy officer:
- **Email:** info.spacefurnio@gmail.com
- **Phone:** +91 9751112025
- **Address:** Spacefurnio Design Studio, 90/1, North Beach Road, Tuticorin, Chennai – 628001, India.
`,
  },
  {
    slug: 'terms-of-service',
    title: 'Terms & Conditions',
    content: `# Terms & Conditions

**Effective Date:** January 1, 2026  
**Last Updated:** February 26, 2026  

Please read these Terms & Conditions ("Terms") carefully before using the Spacefurnio website or commissioning furniture pieces from our studio.

---

### 1. Acceptance of Terms
By accessing our website, purchasing catalog items, or commissioning bespoke architectural furniture, you agree to be bound by these Terms and our related operating policies.

---

### 2. Bespoke Orders and Contracts
- **Commission Process:** Custom furniture and bespoke architectural installations are produced according to custom specifications approved in writing by the client.
- **Production Commences:** Fabrication begins once the custom proposal, technical specifications, and required deposit (or full payment) have been confirmed.
- **Design Variations:** Natural materials (hardwoods, natural stone, vegetable-tanned leathers) exhibit unique grain patterns, veining, and tonal subtleties. These inherent characteristics are hallmarks of authentic craftsmanship and do not constitute manufacturing defects.

---

### 3. Fabrication Timelines
- Standard catalog pieces typically dispatch within 2 to 4 weeks.
- Bespoke architectural commissions generally require 6 to 10 weeks of artisanal production, depending on material sourcing and complexity.
- Production estimates are provided in good faith. Spacefurnio will promptly notify clients in the event of unanticipated material delays or transit constraints.

---

### 4. Pricing and Payment
- All prices are quoted in Indian Rupees (INR) or localized currencies as displayed on the website, inclusive of applicable taxes unless otherwise noted.
- Full payment or specified deposit milestones must be cleared prior to scheduling dispatch and white-glove delivery.

---

### 5. Intellectual Property
- All architectural drawings, CAD designs, furniture silhouettes, imagery, photography, brand trademarks, and written content displayed on this website are the exclusive intellectual property of Spacefurnio.
- No design or content may be reproduced, copied, modified, or distributed without prior written consent from Spacefurnio.

---

### 6. Warranty and Care
- Spacefurnio offers a **5-year structural warranty** on our hardwood frames and structural joinery against structural defects under normal residential conditions.
- Warranty excludes damage arising from improper maintenance, exposure to extreme humidity/temperature, accidental damage, unauthorized alterations, or standard surface wear.

---

### 7. Limitation of Liability
To the maximum extent permitted by applicable law, Spacefurnio shall not be liable for indirect, incidental, or consequential damages resulting from product use or delayed delivery.

---

### 8. Governing Law and Jurisdiction
These Terms are governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in Chennai/Tuticorin, Tamil Nadu, India.
`,
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping & White-Glove Delivery Policy',
    content: `# Shipping & White-Glove Delivery Policy

**Effective Date:** January 1, 2026  
**Last Updated:** February 26, 2026  

At Spacefurnio, our furniture pieces are architectural works crafted to perfection. We handle delivery with the utmost precision using specialized furniture logistics partners.

---

### 1. Specialized Furniture Freight
- Standard courier networks are never used for our solid timber and structural furniture.
- Every order is packaged in climate-resilient, multi-layered protective crating and transported via dedicated air-ride suspension furniture freight vehicles.

---

### 2. Regional Delivery Timelines
- **Metropolitan & Regional Hubs (Chennai, Bengaluru, Mumbai, Delhi NCR, Hyderabad):** 5 to 8 business days following fabrication completion.
- **Other Tier-1 & Tier-2 Locations:** 7 to 12 business days following dispatch.
- **Remote or Coastal Destinations:** Timelines may vary; our concierge logistics team will coordinate personalized delivery windows.

---

### 3. White-Glove Assembly Services
Every delivery includes our comprehensive White-Glove Service at no additional charge for qualifying orders:
- **Pre-Delivery Scheduling:** Our logistics team contacts you 24–48 hours prior to arrange a dedicated 3-hour arrival window.
- **Room of Choice Placement:** Trained handlers bring the crated piece into your designated room (including stair navigation where pre-notified).
- **Professional Assembly:** Complete unpacking, precision leveling, joinery assembly, and placement according to your direction.
- **Debris Removal:** Full packaging, crating, and protective materials are removed and recycled responsibly.

---

### 4. Client Delivery Acceptance Protocol
To ensure seamless delivery and maintain warranty protection:
1. **Access Verification:** Please confirm that doorways, hallways, stairwells, and service elevators accommodate package dimensions prior to delivery.
2. **Immediate Physical Inspection:** Inspect all surfaces, joinery, and upholstery in the presence of the delivery technicians before signing the Bill of Lading / Proof of Delivery.
3. **Noting Damage:** In the rare event of transit damage or surface imperfections, clearly annotate the condition on the delivery receipt and photograph the affected areas immediately.
4. **Notification:** Report any transit anomalies within 24 hours to \`info.spacefurnio@gmail.com\` with photographs and your order reference number.
`,
  },
  {
    slug: 'refund-policy',
    title: 'Returns & Refund Policy',
    content: `# Returns & Refund Policy

**Effective Date:** January 1, 2026  
**Last Updated:** February 26, 2026  

Spacefurnio is dedicated to exceptional quality and architectural excellence. We want you to be entirely satisfied with your investment in our furniture.

---

### 1. 7-Day Inspection Window
- For standard catalog furniture pieces, we provide a **7-calendar-day inspection window** beginning from the confirmed date of white-glove delivery.
- If you wish to return an eligible catalog item, notification must be submitted in writing within 7 days of delivery.
- Items must remain in pristine, unaltered condition with original documentation and hardware.

---

### 2. Custom and Bespoke Fabrication (Non-Returnable)
- **Bespoke Commissions:** Furniture customized to bespoke dimensions, client-specified fabrics/leathers, or architectural finishes cannot be returned or refunded once fabrication has begun.
- Deposits paid for custom orders become non-refundable once materials are cut and structural assembly is initiated.

---

### 3. Transit Damage & Defect Replacement
- If a piece arrives with transit damage or a manufacturing defect:
  - Spacefurnio will inspect and repair the piece to archival standard at our cost, OR
  - Provide a full replacement piece with expedited fabrication priority, OR
  - Issue a full refund if a replacement cannot be manufactured.
- Claims must be supported by photographs and inspection notes documented on the delivery receipt.

---

### 4. Return Shipping & Restocking
- Eligible catalog returns not involving transit defect are subject to a **15% inspection and restocking fee** to cover round-trip specialized freight handling.
- Our white-glove logistics team will schedule pickup at your convenience using proper transit padding and packaging.

---

### 5. Refund Method and Timelines
- Upon receipt of the returned item at our Tuticorin facility and completion of quality inspection (within 3 business days), refunds are initiated immediately.
- Refunds are credited to the original payment method within **5 to 10 business days**, depending on your financial institution's processing schedule.
- For queries regarding returns, please contact our support team at \`info.spacefurnio@gmail.com\` or call \`+91 9751112025\`.
`,
  },
];

export async function seedCms() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('[seed-cms] DATABASE_URL is not set in environment or .env. Skipping CMS seeding.');
    return;
  }

  const isNeon = dbUrl.includes('neon.tech') || dbUrl.includes('neon.build');
  let pgClient: postgres.Sql | null = null;
  let db: any;

  if (isNeon) {
    const sql = neon(dbUrl);
    db = drizzleNeon(sql);
  } else {
    pgClient = postgres(dbUrl, { max: 1 });
    db = drizzlePg(pgClient);
  }

  try {
    console.log('[seed-cms] Starting CMS seed...');

    const now = new Date();

    // 1. Seed Pages
    console.log(`[seed-cms] Seeding ${PAGES.length} pages...`);
    for (const page of PAGES) {
      await db
        .insert(cmsPages)
        .values({
          slug: page.slug,
          title: page.title,
          seoMetadata: page.seoMetadata,
          status: 'published',
          hasUnpublishedChanges: false,
          publishedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: cmsPages.slug,
          set: {
            title: page.title,
            seoMetadata: page.seoMetadata,
            status: 'published',
            hasUnpublishedChanges: false,
            updatedAt: now,
          },
        });
    }

    // 2. Seed Sections
    console.log(`[seed-cms] Seeding ${SECTIONS.length} sections...`);
    for (const sec of SECTIONS) {
      await db
        .insert(cmsSections)
        .values({
          id: sec.id,
          pageSlug: sec.pageSlug,
          sectionKey: sec.sectionKey,
          sortOrder: sec.sortOrder,
          enabled: true,
          draftData: sec.data,
          publishedData: sec.data,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: cmsSections.id,
          set: {
            pageSlug: sec.pageSlug,
            sectionKey: sec.sectionKey,
            sortOrder: sec.sortOrder,
            enabled: true,
            draftData: sec.data,
            publishedData: sec.data,
            updatedAt: now,
          },
        });
    }

    // 3. Seed Policies
    console.log(`[seed-cms] Seeding ${POLICIES.length} policies...`);
    for (const pol of POLICIES) {
      await db
        .insert(cmsPolicies)
        .values({
          slug: pol.slug,
          title: pol.title,
          draftContent: pol.content,
          publishedContent: pol.content,
          versionNum: 1,
          hasUnpublishedChanges: false,
          publishedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: cmsPolicies.slug,
          set: {
            title: pol.title,
            draftContent: pol.content,
            publishedContent: pol.content,
            hasUnpublishedChanges: false,
            updatedAt: now,
          },
        });
    }

    console.log('[seed-cms] CMS seeding completed successfully.');
  } catch (error) {
    console.error('[seed-cms] Error seeding CMS data:', error);
    throw error;
  } finally {
    if (pgClient) {
      await pgClient.end();
    }
  }
}

// Run directly if invoked as main script
seedCms().catch((err) => {
  console.error('[seed-cms] Process exited with error:', err);
  process.exit(1);
});
