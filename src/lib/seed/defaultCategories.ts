import { prisma } from '@/lib/db/prisma';
import { CategoryFlowType } from '@prisma/client';

// ─── Seed definition ──────────────────────────────────────────────────────────
// level 0 = group, level 1 = category, level 2 = subcategory
// path = "group-slug/category-slug/subcategory-slug"

interface SubcategoryDef {
  name: string;
  slug: string;
}

interface CategoryDef {
  name: string;
  slug: string;
  subs: SubcategoryDef[];
}

interface GroupDef {
  name: string;
  slug: string;
  type: CategoryFlowType;
  categories: CategoryDef[];
}

const EXPENSE_GROUPS: GroupDef[] = [
  {
    name: 'Food & Dining',
    slug: 'food-dining',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Groceries',
        slug: 'groceries',
        subs: [
          { name: 'Supermarket', slug: 'supermarket' },
          { name: 'Quick Commerce', slug: 'quick-commerce' }, // Blinkit, Zepto, Swiggy Instamart
          { name: 'Vegetables & Fruits', slug: 'vegetables-fruits' },
        ],
      },
      {
        name: 'Restaurants',
        slug: 'restaurants',
        subs: [
          { name: 'Dine In', slug: 'dine-in' },
          { name: 'Food Delivery', slug: 'food-delivery' }, // Swiggy, Zomato
          { name: 'Fast Food', slug: 'fast-food' },
        ],
      },
      {
        name: 'Coffee & Snacks',
        slug: 'coffee-snacks',
        subs: [
          { name: 'Café', slug: 'cafe' },
          { name: 'Bakery', slug: 'bakery' },
        ],
      },
    ],
  },
  {
    name: 'Household',
    slug: 'household',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Home Supplies',
        slug: 'home-supplies',
        subs: [
          { name: 'Cleaning', slug: 'cleaning' },
          { name: 'Kitchen', slug: 'kitchen' },
          { name: 'Furniture & Decor', slug: 'furniture-decor' },
        ],
      },
      {
        name: 'Utilities',
        slug: 'utilities',
        subs: [
          { name: 'Electricity', slug: 'electricity' },
          { name: 'Water', slug: 'water' },
          { name: 'Gas / LPG', slug: 'gas-lpg' },
          { name: 'Internet', slug: 'internet' },
          { name: 'Mobile Recharge', slug: 'mobile-recharge' },
        ],
      },
      {
        name: 'Rent & Maintenance',
        slug: 'rent-maintenance',
        subs: [
          { name: 'Rent', slug: 'rent' },
          { name: 'Society Maintenance', slug: 'society-maintenance' },
        ],
      },
    ],
  },
  {
    name: 'Transport',
    slug: 'transport',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Fuel',
        slug: 'fuel',
        subs: [
          { name: 'Petrol / Diesel', slug: 'petrol-diesel' },
          { name: 'EV Charging', slug: 'ev-charging' },
        ],
      },
      {
        name: 'Cab & Auto',
        slug: 'cab-auto',
        subs: [
          { name: 'Ola / Uber', slug: 'ola-uber' },
          { name: 'Auto', slug: 'auto' },
        ],
      },
      {
        name: 'Public Transit',
        slug: 'public-transit',
        subs: [
          { name: 'Metro', slug: 'metro' },
          { name: 'Bus', slug: 'bus' },
          { name: 'Train', slug: 'train' },
        ],
      },
      {
        name: 'Vehicle Maintenance',
        slug: 'vehicle-maintenance',
        subs: [
          { name: 'Service & Repair', slug: 'service-repair' },
          { name: 'Insurance', slug: 'vehicle-insurance' },
          { name: 'Parking & Tolls', slug: 'parking-tolls' },
        ],
      },
    ],
  },
  {
    name: 'Health & Wellness',
    slug: 'health-wellness',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Medical',
        slug: 'medical',
        subs: [
          { name: 'Doctor / Consultation', slug: 'doctor-consultation' },
          { name: 'Medicines', slug: 'medicines' },
          { name: 'Lab Tests', slug: 'lab-tests' },
          { name: 'Hospital', slug: 'hospital' },
        ],
      },
      {
        name: 'Fitness',
        slug: 'fitness',
        subs: [
          { name: 'Gym', slug: 'gym' },
          { name: 'Sports', slug: 'sports' },
          { name: 'Yoga / Classes', slug: 'yoga-classes' },
        ],
      },
      {
        name: 'Personal Care',
        slug: 'personal-care',
        subs: [
          { name: 'Salon & Grooming', slug: 'salon-grooming' },
          { name: 'Skincare & Beauty', slug: 'skincare-beauty' },
        ],
      },
    ],
  },
  {
    name: 'Shopping',
    slug: 'shopping',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Clothing & Footwear',
        slug: 'clothing-footwear',
        subs: [
          { name: 'Clothes', slug: 'clothes' },
          { name: 'Shoes', slug: 'shoes' },
          { name: 'Accessories', slug: 'accessories' },
        ],
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        subs: [
          { name: 'Gadgets', slug: 'gadgets' },
          { name: 'Appliances', slug: 'appliances' },
        ],
      },
      {
        name: 'Online Shopping',
        slug: 'online-shopping',
        subs: [
          { name: 'Amazon / Flipkart', slug: 'amazon-flipkart' },
          { name: 'Meesho / Myntra', slug: 'meesho-myntra' },
        ],
      },
    ],
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Subscriptions',
        slug: 'subscriptions',
        subs: [
          { name: 'OTT (Netflix / Prime / Hotstar)', slug: 'ott' },
          { name: 'Music (Spotify / JioSaavn)', slug: 'music' },
          { name: 'Gaming', slug: 'gaming' },
          { name: 'News & Magazines', slug: 'news-magazines' },
        ],
      },
      {
        name: 'Movies & Events',
        slug: 'movies-events',
        subs: [
          { name: 'Cinema', slug: 'cinema' },
          { name: 'Concerts & Shows', slug: 'concerts-shows' },
        ],
      },
      {
        name: 'Travel & Holidays',
        slug: 'travel-holidays',
        subs: [
          { name: 'Flights', slug: 'flights' },
          { name: 'Hotels', slug: 'hotels' },
          { name: 'Holiday Packages', slug: 'holiday-packages' },
        ],
      },
    ],
  },
  {
    name: 'Education',
    slug: 'education',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Tuition & Courses',
        slug: 'tuition-courses',
        subs: [
          { name: 'School / College Fees', slug: 'school-college-fees' },
          { name: 'Online Courses', slug: 'online-courses' },
          { name: 'Coaching', slug: 'coaching' },
        ],
      },
      {
        name: 'Books & Stationery',
        slug: 'books-stationery',
        subs: [
          { name: 'Books', slug: 'books' },
          { name: 'Stationery', slug: 'stationery' },
        ],
      },
    ],
  },
  {
    name: 'Finance',
    slug: 'finance',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Insurance',
        slug: 'insurance',
        subs: [
          { name: 'Life Insurance', slug: 'life-insurance' },
          { name: 'Health Insurance', slug: 'health-insurance' },
          { name: 'Term Plan', slug: 'term-plan' },
        ],
      },
      {
        name: 'Loan Repayment',
        slug: 'loan-repayment',
        subs: [
          { name: 'Home Loan EMI', slug: 'home-loan-emi' },
          { name: 'Car Loan EMI', slug: 'car-loan-emi' },
          { name: 'Personal Loan EMI', slug: 'personal-loan-emi' },
          { name: 'Education Loan EMI', slug: 'education-loan-emi' },
        ],
      },
      {
        name: 'Bank Charges',
        slug: 'bank-charges',
        subs: [
          { name: 'Processing Fees', slug: 'processing-fees' },
          { name: 'Interest & Penalties', slug: 'interest-penalties' },
        ],
      },
    ],
  },
  {
    name: 'Family & Giving',
    slug: 'family-giving',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Kids',
        slug: 'kids',
        subs: [
          { name: 'School Fees', slug: 'kids-school-fees' },
          { name: 'Toys & Activities', slug: 'kids-toys-activities' },
          { name: 'Baby Supplies', slug: 'baby-supplies' },
        ],
      },
      {
        name: 'Gifts & Donations',
        slug: 'gifts-donations',
        subs: [
          { name: 'Gifts', slug: 'gifts' },
          { name: 'Charity / NGO', slug: 'charity' },
          { name: 'Religious / Temple', slug: 'religious' },
        ],
      },
      {
        name: 'Family Support',
        slug: 'family-support',
        subs: [
          { name: 'Parents', slug: 'parents-support' },
          { name: 'Siblings', slug: 'siblings-support' },
        ],
      },
    ],
  },
  {
    name: 'Miscellaneous',
    slug: 'miscellaneous',
    type: CategoryFlowType.EXPENSE,
    categories: [
      {
        name: 'Other Expenses',
        slug: 'other-expenses',
        subs: [
          { name: 'Uncategorized', slug: 'uncategorized' },
          { name: 'Cash Withdrawal', slug: 'cash-withdrawal' },
        ],
      },
    ],
  },
];

const INCOME_GROUPS: GroupDef[] = [
  {
    name: 'Income',
    slug: 'income',
    type: CategoryFlowType.INCOME,
    categories: [
      {
        name: 'Salary & Employment',
        slug: 'salary-employment',
        subs: [
          { name: 'Salary', slug: 'salary' },
          { name: 'Bonus', slug: 'bonus' },
          { name: 'Freelance', slug: 'freelance' },
          { name: 'Consulting', slug: 'consulting' },
        ],
      },
      {
        name: 'Business Income',
        slug: 'business-income',
        subs: [
          { name: 'Business Revenue', slug: 'business-revenue' },
          { name: 'Side Income', slug: 'side-income' },
        ],
      },
      {
        name: 'Returns & Passive',
        slug: 'returns-passive',
        subs: [
          { name: 'Dividends', slug: 'dividends' },
          { name: 'Rental Income', slug: 'rental-income' },
          { name: 'Interest Earned', slug: 'interest-earned' },
          { name: 'Capital Gains', slug: 'capital-gains' },
        ],
      },
      {
        name: 'Other Income',
        slug: 'other-income',
        subs: [
          { name: 'Gifts Received', slug: 'gifts-received' },
          { name: 'Cashback & Rewards', slug: 'cashback-rewards' },
          { name: 'Refunds', slug: 'refunds' },
        ],
      },
    ],
  },
];

const INVESTMENT_GROUPS: GroupDef[] = [
  {
    name: 'Investments',
    slug: 'investments',
    type: CategoryFlowType.INVESTMENT,
    categories: [
      {
        name: 'Mutual Funds',
        slug: 'mutual-funds',
        subs: [
          { name: 'SIP', slug: 'sip' },
          { name: 'Lump Sum', slug: 'lump-sum' },
          { name: 'ELSS', slug: 'elss' },
        ],
      },
      {
        name: 'Stocks',
        slug: 'stocks',
        subs: [
          { name: 'Equity', slug: 'equity' },
          { name: 'IPO', slug: 'ipo' },
        ],
      },
      {
        name: 'Fixed Income',
        slug: 'fixed-income',
        subs: [
          { name: 'FD / RD', slug: 'fd-rd' },
          { name: 'PPF / EPF', slug: 'ppf-epf' },
          { name: 'NPS', slug: 'nps' },
          { name: 'Bonds', slug: 'bonds' },
        ],
      },
      {
        name: 'Crypto & Alternatives',
        slug: 'crypto-alternatives',
        subs: [
          { name: 'Crypto', slug: 'crypto' },
          { name: 'Gold / Digital Gold', slug: 'gold' },
          { name: 'Real Estate', slug: 'real-estate-investment' },
        ],
      },
    ],
  },
];

const ALL_GROUPS = [...EXPENSE_GROUPS, ...INCOME_GROUPS, ...INVESTMENT_GROUPS];

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedDefaultCategories(userId: string): Promise<void> {
  for (const group of ALL_GROUPS) {
    // level 0 — group
    const groupRecord = await prisma.category.create({
      data: {
        userId,
        name: group.name,
        slug: group.slug,
        level: 0,
        path: group.slug,
        type: group.type,
      },
    });

    for (const cat of group.categories) {
      // level 1 — category
      const catPath = `${group.slug}/${cat.slug}`;
      const catRecord = await prisma.category.create({
        data: {
          userId,
          name: cat.name,
          slug: cat.slug,
          level: 1,
          path: catPath,
          type: group.type,
          parentId: groupRecord.id,
        },
      });

      // level 2 — subcategory
      if (cat.subs.length > 0) {
        await prisma.category.createMany({
          data: cat.subs.map((sub) => ({
            userId,
            name: sub.name,
            slug: sub.slug,
            level: 2,
            path: `${catPath}/${sub.slug}`,
            type: group.type,
            parentId: catRecord.id,
          })),
        });
      }
    }
  }
}
