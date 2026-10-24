export interface DemoWorkerData {
  id: string;
  display_name: string;
  avatar_url: string;
  locality: string;
  city: string;
  rating_avg: number;
  review_count: number;
  completed_jobs: number;
  verification_status: "verified" | "pending";
  availability_status: "available" | "busy" | "offline";
  is_demo: boolean;
  latitude: number;
  longitude: number;
  bio: string;
  experience_years: number;
  service_radius_km: number;
  working_hours: string;
  languages: string[];
  worker_services: {
    id: string;
    base_price: number;
    pricing_unit: string;
    is_active: boolean;
    category_id: string;
    description: string;
    service_categories: { name: string; slug: string };
  }[];
  demo_reviews: {
    id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
    worker_response?: string;
  }[];
}

export const DEMO_WORKERS: DemoWorkerData[] = [
  {
    id: "146ae007-475d-4118-aa12-0a844cb98242",
    display_name: "Ramesh Patil",
    avatar_url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    locality: "Andheri West",
    city: "Mumbai",
    rating_avg: 4.9,
    review_count: 38,
    completed_jobs: 64,
    verification_status: "verified",
    availability_status: "available",
    is_demo: true,
    latitude: 19.1363,
    longitude: 72.8277,
    bio: "Senior plumbing technician with over 8 years of experience. Expert in residential pipeline installations, leak detection, geyser repair, and premium bathroom sanitary fittings.",
    experience_years: 8,
    service_radius_km: 8,
    working_hours: "Mon–Sat, 9 AM – 7 PM",
    languages: ["Marathi", "Hindi", "English"],
    worker_services: [
      {
        id: "demo-ws-1",
        base_price: 350,
        pricing_unit: "per_visit",
        is_active: true,
        category_id: "c3bfce96-1c17-4fb1-8396-db4056cc2d18",
        description: "Leak repairs, pipe fittings, flush tanks and taps",
        service_categories: { name: "Plumbing", slug: "plumbing" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-1",
        reviewer_name: "Aakash Mehta",
        rating: 5,
        comment: "Arrived within 25 minutes in Andheri West! Fixed the bathroom sink leak swiftly and charged a very fair price.",
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        worker_response: "Thank you Aakash ji! Always happy to assist.",
      },
      {
        id: "rev-2",
        reviewer_name: "Sneha Kapadia",
        rating: 5,
        comment: "Very polite, wore clean shoe covers, and finished the geyser fitting cleanly.",
        created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "196384e8-bab7-4d46-8feb-ae7caac2af3c",
    display_name: "Sunita Sharma",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    locality: "Bandra East",
    city: "Mumbai",
    rating_avg: 4.8,
    review_count: 52,
    completed_jobs: 89,
    verification_status: "verified",
    availability_status: "available",
    is_demo: true,
    latitude: 19.0596,
    longitude: 72.8479,
    bio: "Professional deep cleaning specialist. Specializes in eco-friendly kitchen degreasing, bathroom sanitization, and full apartment move-in cleanups.",
    experience_years: 5,
    service_radius_km: 7,
    working_hours: "Daily, 8 AM – 5 PM",
    languages: ["Hindi", "English"],
    worker_services: [
      {
        id: "demo-ws-2",
        base_price: 1800,
        pricing_unit: "per_job",
        is_active: true,
        category_id: "429d2450-e351-406b-acad-ea0c28eba097",
        description: "Full home deep sanitization and kitchen degreasing",
        service_categories: { name: "Cleaning", slug: "cleaning" },
      },
      {
        id: "demo-ws-3",
        base_price: 250,
        pricing_unit: "per_hour",
        is_active: true,
        category_id: "74599d9c-9c2b-48a4-af34-35547ea42430",
        description: "Daily sweeping, dusting and general household assistance",
        service_categories: { name: "Maid Services", slug: "maid-services" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-3",
        reviewer_name: "Pooja Deshmukh",
        rating: 5,
        comment: "Sunita ji did an outstanding job cleaning our 2BHK before Diwali. Highly recommended!",
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "rev-4",
        reviewer_name: "Karan Johar",
        rating: 4,
        comment: "Very thorough cleaning, kitchen tiles are sparkling like new.",
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "302732db-cf00-470f-86fa-ec5b0223d099",
    display_name: "Imran Shaikh",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    locality: "Kurla West",
    city: "Mumbai",
    rating_avg: 4.9,
    review_count: 67,
    completed_jobs: 114,
    verification_status: "verified",
    availability_status: "available",
    is_demo: true,
    latitude: 19.0726,
    longitude: 72.8845,
    bio: "Certified electrical technician with 11 years in industrial and residential electrical installations. Expert in short-circuit diagnosis, MCB boxes, inverter setup, and appliance repairs.",
    experience_years: 11,
    service_radius_km: 10,
    working_hours: "Mon–Sun, 10 AM – 8 PM",
    languages: ["Hindi", "Urdu", "English"],
    worker_services: [
      {
        id: "demo-ws-4",
        base_price: 300,
        pricing_unit: "per_visit",
        is_active: true,
        category_id: "e005bc6c-438d-4ba8-bc6f-16e5392e9fa7",
        description: "MCB, ceiling fans, switches and inverter wiring",
        service_categories: { name: "Electrical", slug: "electrical" },
      },
      {
        id: "demo-ws-5",
        base_price: 500,
        pricing_unit: "per_visit",
        is_active: true,
        category_id: "176905fa-ba7b-44f8-ad06-11780a13b154",
        description: "Split AC servicing, microwave, and washing machine diagnostics",
        service_categories: { name: "Appliance Repair", slug: "appliance-repair" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-5",
        reviewer_name: "Farhan Qureshi",
        rating: 5,
        comment: "Detected a dangerous electrical spark in our main distribution board in minutes. Saved our appliances!",
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        worker_response: "Safety first! Glad I could help on short notice.",
      },
    ],
  },
  {
    id: "da4859cd-5a75-4a47-9243-4ef13eeab5e5",
    display_name: "Ganesh Kadam",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    locality: "Dadar Central",
    city: "Mumbai",
    rating_avg: 4.7,
    review_count: 29,
    completed_jobs: 48,
    verification_status: "verified",
    availability_status: "available",
    is_demo: true,
    latitude: 19.0178,
    longitude: 72.8478,
    bio: "Interior painting craftsman with 9 years of expertise. Specializing in Asian Paints Royal finish, texture walls, ceiling damp-proofing, and protective wood varnishing.",
    experience_years: 9,
    service_radius_km: 12,
    working_hours: "Mon–Sat, 9 AM – 6 PM",
    languages: ["Marathi", "Hindi"],
    worker_services: [
      {
        id: "demo-ws-6",
        base_price: 1500,
        pricing_unit: "per_day",
        is_active: true,
        category_id: "0cd42f64-64e8-490f-aed6-4de3f37eeb24",
        description: "Wall putty, primer, texture paint and waterproofing coats",
        service_categories: { name: "Painting", slug: "painting" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-6",
        reviewer_name: "Vikram Rane",
        rating: 5,
        comment: "Smooth finish and clean edges. He covered all furniture properly before starting.",
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "2b9de57e-1f23-4bd8-87c7-5c6ee89fc8e6",
    display_name: "Joseph D'Souza",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    locality: "Malad West",
    city: "Mumbai",
    rating_avg: 4.9,
    review_count: 45,
    completed_jobs: 78,
    verification_status: "verified",
    availability_status: "busy",
    is_demo: true,
    latitude: 19.1868,
    longitude: 72.8484,
    bio: "Master carpenter with 14 years in modular kitchen cabinets, bespoke wardrobes, door alignments, and lock replacements.",
    experience_years: 14,
    service_radius_km: 10,
    working_hours: "Tue–Sun, 10 AM – 6 PM",
    languages: ["English", "Hindi", "Konkani"],
    worker_services: [
      {
        id: "demo-ws-7",
        base_price: 400,
        pricing_unit: "per_hour",
        is_active: true,
        category_id: "6712fcbf-ffe5-4be9-b061-39e65aa56e1a",
        description: "Hinges, locks, modular fittings, and custom wood restoration",
        service_categories: { name: "Carpentry", slug: "carpentry" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-7",
        reviewer_name: "Natasha Fernandes",
        rating: 5,
        comment: "Fixed our sliding wardrobe doors that 2 other carpenters failed to fix. Real master of his craft.",
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: "88d9e295-6697-4a89-936a-58b2b1c4346e",
    display_name: "Lakshmi Iyer",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    locality: "Chembur East",
    city: "Mumbai",
    rating_avg: 5.0,
    review_count: 41,
    completed_jobs: 73,
    verification_status: "verified",
    availability_status: "available",
    is_demo: true,
    latitude: 19.0522,
    longitude: 72.9005,
    bio: "Home-style culinary expert. Prepares healthy, hygienic North Indian & South Indian vegetarian meals, diet menus, and weekend family party catering.",
    experience_years: 6,
    service_radius_km: 6,
    working_hours: "Daily, 7 AM – 2 PM",
    languages: ["Tamil", "Hindi", "English"],
    worker_services: [
      {
        id: "demo-ws-8",
        base_price: 6000,
        pricing_unit: "per_job",
        is_active: true,
        category_id: "0ed7a74e-87b3-4bee-ac09-5b55c83b6183",
        description: "Monthly home-cooked meal preparation (Breakfast & Lunch)",
        service_categories: { name: "Cooking", slug: "cooking" },
      },
    ],
    demo_reviews: [
      {
        id: "rev-8",
        reviewer_name: "Subhash Raman",
        rating: 5,
        comment: "Authentic taste, less oil, and very clean kitchen habits. A blessing for working professionals.",
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ],
  },
];

export interface DemoCustomerBooking {
  id: string;
  booking_code: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  booking_type: "immediate" | "scheduled";
  scheduled_at: string | null;
  created_at: string;
  agreed_price: number | null;
  customer_budget: number | null;
  locality: string;
  job_description: string;
  worker_profiles: { display_name: string };
  worker_services: { service_categories: { name: string } };
}

export const DEMO_CUSTOMER_BOOKINGS: DemoCustomerBooking[] = [
  {
    id: "demo-bk-1",
    booking_code: "LS-849201",
    status: "accepted",
    booking_type: "scheduled",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    agreed_price: 450,
    customer_budget: 500,
    locality: "Andheri West, Mumbai",
    job_description: "Kitchen basin drainage blockage and tap washer replacement",
    worker_profiles: { display_name: "Ramesh Patil" },
    worker_services: { service_categories: { name: "Plumbing" } },
  },
  {
    id: "demo-bk-2",
    booking_code: "LS-912403",
    status: "completed",
    booking_type: "immediate",
    scheduled_at: null,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    agreed_price: 1600,
    customer_budget: 1800,
    locality: "Bandra East, Mumbai",
    job_description: "Full deep kitchen sanitization and tile scrubbing",
    worker_profiles: { display_name: "Sunita Sharma" },
    worker_services: { service_categories: { name: "Cleaning" } },
  },
  {
    id: "demo-bk-3",
    booking_code: "LS-304912",
    status: "pending",
    booking_type: "immediate",
    scheduled_at: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    agreed_price: null,
    customer_budget: 350,
    locality: "Kurla West, Mumbai",
    job_description: "Tripping MCB breaker and ceiling fan regulator replacement",
    worker_profiles: { display_name: "Imran Shaikh" },
    worker_services: { service_categories: { name: "Electrical" } },
  },
];
