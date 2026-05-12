import React, { useState, useMemo } from "react";

interface Opportunity {
  id: string;
  name: string;
  type: "Farmers Market" | "Pop-Up Event" | "Vendor Booth" | "Boutique Space" | "Online Platform";
  location: string;
  description: string;
  tags: string[];
  status: "Open" | "Rolling Applications" | "Check Website";
  applyUrl: string;
  websiteUrl: string;
  featured?: boolean;
  season?: string;
  boothInfo?: string;
}

const OPPORTUNITIES: Opportunity[] = [
  {
    id: "slc-downtown",
    name: "Downtown SLC Farmers Market",
    type: "Farmers Market",
    location: "Salt Lake City, UT",
    description: "One of Utah's largest and most established farmers markets. Held near Pioneer Park every Saturday from June through October. High foot traffic with thousands of weekly visitors. Note: 2026 location may shift slightly due to Pioneer Park renovations.",
    tags: ["Food", "Crafts", "Produce", "Artisan"],
    status: "Open",
    applyUrl: "https://www.slcfarmersmarket.org/apply",
    websiteUrl: "https://www.slcfarmersmarket.org",
    featured: true,
    season: "June – October",
    boothInfo: "$50 application fee · $780 full season or $40/day for a 10×10 booth",
  },
  {
    id: "provo-market",
    name: "Provo Farmers Market",
    type: "Farmers Market",
    location: "Provo, UT",
    description: "A beloved community market in downtown Provo held every Saturday. Great mix of local produce, handmade goods, and small businesses. Cottage food and UDAF permits preferred for food vendors.",
    tags: ["Food", "Handmade", "Local", "Crafts"],
    status: "Check Website",
    applyUrl: "https://www.provofarmersmarket.com/sell",
    websiteUrl: "https://www.provofarmersmarket.com",
    featured: true,
    season: "May – October",
    boothInfo: "Utah County Health permit required for food vendors",
  },
  {
    id: "park-silly",
    name: "Park Silly Sunday Market",
    type: "Pop-Up Event",
    location: "Park City, UT",
    description: "A vibrant open-air market in the heart of Park City every Sunday in summer. Known for its artisan vendors, live music, and upscale clientele. Juried application process — no resellers or MLM.",
    tags: ["Artisan", "Crafts", "Jewelry", "Art", "Food"],
    status: "Check Website",
    applyUrl: "https://parksillysundaymarket.com/apply/vendors-silly-market/",
    websiteUrl: "https://parksillysundaymarket.com",
    featured: true,
    season: "Sundays, Summer",
    boothInfo: "$30 non-refundable application fee · ~$75/Sunday for a corner booth",
  },
  {
    id: "wheeler-farm",
    name: "Wheeler Historic Farm Sunday Market",
    type: "Farmers Market",
    location: "Murray, UT",
    description: "A charming weekly market on the grounds of historic Wheeler Farm, managed by Salt Lake County. Sundays from May through October. Relaxed, family-friendly atmosphere with steady local attendance.",
    tags: ["Produce", "Homemade", "Farm", "Local"],
    status: "Check Website",
    applyUrl: "https://www.saltlakecounty.gov/wheeler-farm/vendor-opportunities/",
    websiteUrl: "https://www.saltlakecounty.gov/wheeler-farm/",
    season: "Sundays, May 17 – Oct 11, 2026 · 9am–1pm",
    boothInfo: "$35 non-refundable application fee · 6351 S 900 E, Murray UT",
  },
  {
    id: "sunset-markets",
    name: "Sunset Farmers Markets",
    type: "Farmers Market",
    location: "Utah County, UT",
    description: "One application covers multiple Utah County markets: Springville, Draper, Orem, and Lindon. Free to apply — $35 enrollment fee only after acceptance. Applications typically take 2 weeks to process.",
    tags: ["Produce", "Crafts", "Baked Goods", "Local", "Food"],
    status: "Open",
    applyUrl: "https://sunsetfarmersmarkets.com/utah-county-application",
    websiteUrl: "https://sunsetfarmersmarkets.com",
    featured: true,
    season: "Summer",
    boothInfo: "Free to apply · $35 enrollment fee after acceptance · covers Springville, Draper, Orem & Lindon",
  },
  {
    id: "9th-west-market",
    name: "9th West Farmers Market",
    type: "Farmers Market",
    location: "Salt Lake City, UT",
    description: "A community-focused Sunday market at Jordan Park near the International Peace Gardens on SLC's west side. Welcomes farmers, artisans, creatives, service providers, and youth entrepreneurs.",
    tags: ["Produce", "Food", "Crafts", "Local", "Artisan"],
    status: "Open",
    applyUrl: "https://9thwestfarmersmarket.org/vendors/",
    websiteUrl: "https://9thwestfarmersmarket.org",
    season: "Sundays, June 14 – Oct 11, 2026 · 10am–3pm",
    boothInfo: "1060 S 900 W, Salt Lake City · contact pres@9thwestfarmersmarket.org",
  },
  {
    id: "park-city-farmers-market",
    name: "Park City Farmers Market",
    type: "Farmers Market",
    location: "Park City, UT",
    description: "A midweek market in Park City running Wednesdays from noon to 5pm. Great for reaching tourists and Park City locals. Requires liability insurance and a Mass Event License fee.",
    tags: ["Produce", "Food", "Crafts", "Local"],
    status: "Check Website",
    applyUrl: "https://parkcityfarmersmarket.com/applications-2/",
    websiteUrl: "https://parkcityfarmersmarket.com",
    season: "Wednesdays, 12–5pm",
    boothInfo: "$120 Mass Event License fee · liability insurance required · +$100 if applying after April 30",
  },
  {
    id: "crazy-daisy",
    name: "Crazy Daisy Productions",
    type: "Pop-Up Event",
    location: "Sandy, UT",
    description: "Utah's popular boutique vendor events series featuring 90+ small businesses. Events include spring and fall markets in Sandy plus a St. George Fall Festival. Great for home décor, handmade crafts, clothing, beauty, and art vendors.",
    tags: ["Crafts", "Boutique", "Home Décor", "Handmade", "Art"],
    status: "Rolling Applications",
    applyUrl: "https://www.crazydaisypro.com/vendors",
    websiteUrl: "https://www.crazydaisypro.com",
    season: "Spring, Fall & Holiday events",
    boothInfo: "Multiple events per year across Utah — Sandy, St. George, and more",
  },
  {
    id: "vintage-market-days",
    name: "Vintage Market Days of Greater Utah",
    type: "Pop-Up Event",
    location: "Utah (Statewide)",
    description: "A large curated vintage and maker market held twice a year at Utah fairgrounds. Spring market in March, Fall market in October. Over 125 vendors with food trucks and live music. Juried application process.",
    tags: ["Vintage", "Handmade", "Art", "Home Décor", "Crafts"],
    status: "Rolling Applications",
    applyUrl: "https://www.vintagemarketdays.com/vendor/index.php",
    websiteUrl: "https://www.vintagemarketdays.com/market/greater-utah/index.php",
    featured: true,
    season: "Spring (March) & Fall (October 22–24, 2026)",
    boothInfo: "Applications open months in advance — juried selection",
  },
  {
    id: "farm-bureau-markets",
    name: "Utah Farm Bureau Farmers Markets",
    type: "Farmers Market",
    location: "Murray & South Jordan, UT",
    description: "Utah Farm Bureau operates two markets: Murray Park (Fri & Sat) and South Jordan (Sat). Murray is food-only. South Jordan accepts select artisans who use Utah-grown agricultural products.",
    tags: ["Food", "Produce", "Artisan"],
    status: "Open",
    applyUrl: "https://www.utahfarmbureau.org/Food/Farm-Bureau-Farmers-Markets/Farmers-Market-Vendor-Application",
    websiteUrl: "https://www.utahfarmbureau.org/Utah-Farm-Bureau/Food/Farm-Bureau-Farmers-Markets",
    season: "Murray: Fri & Sat, July 31–Oct 31 · South Jordan: Sat, Aug 9–Oct 10, 2026",
    boothInfo: "Food vendors preferred · South Jordan also accepts select artisans",
  },
  {
    id: "urban-flea-market",
    name: "Urban Flea Market SLC",
    type: "Pop-Up Event",
    location: "Salt Lake City, UT",
    description: "Monthly indoor/outdoor market at The Gateway in downtown SLC. 100 vendors selling vintage, antique, and handmade goods. Second Sunday of each month, 10am–4pm. Indoor Nov–May, outdoor Jun–Oct.",
    tags: ["Vintage", "Handmade", "Crafts", "Antiques"],
    status: "Rolling Applications",
    applyUrl: "https://www.fleamarketslc.com/vendors",
    websiteUrl: "https://www.fleamarketslc.com",
    season: "2nd Sunday monthly · 10am–4pm · 18 N Rio Grande St, SLC",
    boothInfo: "100 vendor spots — indoor winter, outdoor summer",
  },
  {
    id: "utah-state-fair",
    name: "Utah State Fair",
    type: "Vendor Booth",
    location: "Salt Lake City, UT",
    description: "One of Utah's biggest annual events with hundreds of thousands of attendees. A major opportunity for vendors selling food, crafts, products, and services. High visibility and large crowds.",
    tags: ["Food", "Crafts", "Products", "Services", "Retail"],
    status: "Check Website",
    applyUrl: "https://www.utahstatefair.com/vendors",
    websiteUrl: "https://www.utahstatefair.com/vendors",
    season: "September",
    boothInfo: "Applications open in spring — one of Utah's highest-traffic events",
  },
  {
    id: "bountiful-farmers-market",
    name: "Bountiful Farmers Market",
    type: "Farmers Market",
    location: "Bountiful, UT",
    description: "Thursday evening market at Bountiful Town Square. No application fee and no commission taken on sales. Weekly fees from $17–$27 depending on category. Great for Davis County shoppers.",
    tags: ["Produce", "Food", "Crafts", "Local"],
    status: "Rolling Applications",
    applyUrl: "https://bountifulfm.mymarket.org/forms/signup",
    websiteUrl: "https://www.bountifulutah.gov/farmers-market",
    season: "Thursdays, June 25 – Oct 15, 2026 · 4–8pm",
    boothInfo: "No app fee · $17–$27/week · 75 E 200 S, Bountiful UT",
  },
  {
    id: "millcreek-market",
    name: "Millcreek Farmers Market",
    type: "Farmers Market",
    location: "Millcreek, UT",
    description: "Friday evening market at Millcreek Common in its third year. 40 vendor spaces for farmers, food, art and crafts. No reselling permitted — must produce what you sell.",
    tags: ["Produce", "Food", "Crafts", "Local", "Art"],
    status: "Open",
    applyUrl: "https://millcreekcommon.org/farmersmarketapplication",
    websiteUrl: "https://millcreekcommon.org/farmersmarket",
    season: "Fridays, July 10 – Oct 30, 2026",
    boothInfo: "$25/day or $270 full season · 1354 E Chambers Ave, Millcreek UT",
  },
  {
    id: "dream-events",
    name: "Dream Events Utah",
    type: "Pop-Up Event",
    location: "West Point, UT",
    description: "Organizes multiple vendor events throughout the year including the West Point Farmers Market and the Regency Festival. Great for vendors looking for events in northern Utah outside of SLC.",
    tags: ["Crafts", "Food", "Handmade", "Seasonal"],
    status: "Rolling Applications",
    applyUrl: "https://www.dreameventsut.com",
    websiteUrl: "https://www.dreameventsut.com",
    season: "Multiple events year-round",
    boothInfo: "West Point Farmers Market applications open in March",
  },
  {
    id: "salt-and-honey",
    name: "Salt & Honey Market",
    type: "Boutique Space",
    location: "Salt Lake City, UT",
    description: "A women-run makers market with 3 locations including Fashion Place Mall and downtown SLC. Works with 350+ rotating local artists and vendors. Start by applying to their seasonal markets — store vendor spots open from there.",
    tags: ["Handmade", "Artisan", "Gifts", "Jewelry", "Clothing", "Boutique"],
    status: "Rolling Applications",
    applyUrl: "https://www.saltandhoneymarket.com/pages/new-vendor",
    websiteUrl: "https://www.saltandhoneymarket.com",
    featured: true,
    boothInfo: "Juried · no resellers or MLM · 3 Utah locations including Fashion Place Mall",
  },
  {
    id: "collective-underground",
    name: "The Collective Underground",
    type: "Boutique Space",
    location: "Provo, UT",
    description: "A permanent consignment and vendor marketplace in Provo for local artisans and small businesses. Rent shelf space inside a curated boutique setting — great for jewelry, crafts, clothing, crystals, and handmade goods.",
    tags: ["Consignment", "Handmade", "Jewelry", "Crafts", "Boutique"],
    status: "Rolling Applications",
    applyUrl: "https://collectiveunderground.com",
    websiteUrl: "https://collectiveunderground.com",
    boothInfo: "$240/month + 20% commission · six 23.5\"×11.5\" shelves per unit",
  },
  {
    id: "neighborhood-hive",
    name: "The Neighborhood Hive",
    type: "Boutique Space",
    location: "Salt Lake City, UT",
    description: "A community retail space in Sugar House where local artisans rent shelf space and day stalls. Surrounded by coffee, events, and a strong local customer base. Ideal for makers and creators who want permanent or rotating shelf presence.",
    tags: ["Handmade", "Crafts", "Art", "Local", "Boutique"],
    status: "Rolling Applications",
    applyUrl: "https://theneighborhoodhive.org",
    websiteUrl: "https://theneighborhoodhive.org",
    boothInfo: "Shelf rentals + day stalls · 2065 E 2100 S, Sugar House, SLC",
  },
  {
    id: "craft-lake-city",
    name: "Craft Lake City DIY Festival",
    type: "Pop-Up Event",
    location: "Salt Lake City, UT",
    description: "Utah's premier handmade festival — 18th annual event at the Utah State Fairpark. Categories include artisans, vintage vendors, craft food, STEM, and performers. Fee support and scholarships available for applicants who need it.",
    tags: ["Handmade", "Artisan", "Vintage", "Food", "STEM", "Art"],
    status: "Check Website",
    applyUrl: "https://craftlakecity.com/diy-festival",
    websiteUrl: "https://craftlakecity.com",
    featured: true,
    season: "August 7–9, 2026 · Utah State Fairpark",
    boothInfo: "$25 non-refundable application fee · scholarships available · applications open annually in early 2026",
  },
  {
    id: "utah-small-biz-expo",
    name: "Utah Small Business Expo",
    type: "Vendor Booth",
    location: "Salt Lake City, UT",
    description: "An annual expo at Mountain America Expo Center designed specifically for Utah small businesses to network, exhibit, and grow. Great visibility for products and services with a business-focused audience.",
    tags: ["Business", "Networking", "Products", "Services", "Retail"],
    status: "Check Website",
    applyUrl: "https://utahsmallbusinessexpo.com",
    websiteUrl: "https://utahsmallbusinessexpo.com",
    season: "October 14, 2026 · Mountain America Expo Center",
    boothInfo: "Annual expo — check website for exhibitor pricing",
  },
  {
    id: "etsy",
    name: "Etsy",
    type: "Online Platform",
    location: "Online",
    description: "The world's leading marketplace for handmade, vintage, and unique goods. List your products to millions of buyers globally. Ideal for makers, crafters, jewelry designers, and artists.",
    tags: ["Handmade", "Vintage", "Crafts", "Art", "Jewelry"],
    status: "Rolling Applications",
    applyUrl: "https://www.etsy.com/sell",
    websiteUrl: "https://www.etsy.com/sell",
    featured: true,
    boothInfo: "$0.20 per listing · 6.5% transaction fee",
  },
  {
    id: "shopify-starter",
    name: "Shopify Starter",
    type: "Online Platform",
    location: "Online",
    description: "Launch your own online store with Shopify's Starter plan. Sell through social media, messaging apps, and a simple product page. No full website required — perfect for side hustles and new businesses.",
    tags: ["eCommerce", "Social Selling", "Products", "Services"],
    status: "Rolling Applications",
    applyUrl: "https://www.shopify.com/starter",
    websiteUrl: "https://www.shopify.com/starter",
    boothInfo: "Starts at $5/month",
  },
  {
    id: "instagram-shop",
    name: "Instagram Shop",
    type: "Online Platform",
    location: "Online",
    description: "Turn your Instagram profile into a storefront. Tag products in posts and stories so followers can shop directly. Great for product-based businesses with strong visual branding.",
    tags: ["Social Media", "eCommerce", "Products", "Brand"],
    status: "Rolling Applications",
    applyUrl: "https://business.instagram.com/shopping",
    websiteUrl: "https://business.instagram.com/shopping",
    boothInfo: "Free to set up with a Business account",
  },
];

const TYPES = ["All Types", "Farmers Market", "Pop-Up Event", "Vendor Booth", "Boutique Space", "Online Platform"] as const;
const STATUSES = ["All Statuses", "Open", "Rolling Applications", "Check Website"] as const;
const LOCATIONS = ["All Locations", "Salt Lake City, UT", "Millcreek, UT", "Provo, UT", "Park City, UT", "Murray, UT", "Murray & South Jordan, UT", "Utah County, UT", "Sandy, UT", "Bountiful, UT", "West Point, UT", "Utah (Statewide)", "Online"] as const;

const STATUS_CLASS: Record<string, string> = {
  "Open": "wts-status--open",
  "Rolling Applications": "wts-status--rolling",
  "Check Website": "wts-status--check",
};

const PinIcon = () => (
  <svg className="wts-pin-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 5C11.5 8 7 11.5 7 11.5C7 11.5 2.5 8 2.5 5C2.5 2.549 4.549 0.5 7 0.5C9.451 0.5 11.5 2.549 11.5 5Z"/>
    <circle cx="7" cy="5" r="1.5"/>
    <path d="M11.0773 10H12L13.5 13.5H0.5L2 10H2.9227"/>
  </svg>
);

const TYPE_ICON_SVG: Record<string, React.ReactNode> = {
  "Farmers Market": (
    <svg className="wts-svg-icon" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.21423 18.2144V27.8572C3.21423 28.1414 3.32712 28.4139 3.52805 28.6149C3.72897 28.8157 4.0015 28.9286 4.28566 28.9286H25.7142C25.9984 28.9286 26.2709 28.8157 26.4719 28.6149C26.6727 28.4139 26.7857 28.1414 26.7857 27.8572V18.2144"/>
      <path d="M17.1428 18.2144V28.9286"/>
      <path d="M3.21423 21.4287H17.1428"/>
      <path d="M1.07141 8.57153L4.2857 1.07153H25.7143L28.9286 8.57153H1.07141Z"/>
      <path d="M10.2428 8.57153V10.7144C10.2428 11.851 9.79132 12.9411 8.98758 13.7448C8.18385 14.5486 7.09376 15.0001 5.95713 15.0001H5.35713C4.22049 15.0001 3.1304 14.5486 2.32668 13.7448C1.52294 12.9411 1.07141 11.851 1.07141 10.7144V8.57153"/>
      <path d="M19.8214 8.57153V10.7144C19.8214 11.851 19.3699 12.9411 18.5662 13.7448C17.7625 14.5486 16.6724 15.0001 15.5357 15.0001H14.4643C13.3277 15.0001 12.2376 14.5486 11.4339 13.7448C10.6301 12.9411 10.1786 11.851 10.1786 10.7144V8.57153"/>
      <path d="M28.9286 8.57153V10.7144C28.9286 11.851 28.4771 12.9411 27.6733 13.7448C26.8695 14.5486 25.7794 15.0001 24.6428 15.0001H24.1071C22.9706 15.0001 21.8805 14.5486 21.0767 13.7448C20.2729 12.9411 19.8214 11.851 19.8214 10.7144V8.57153"/>
    </svg>
  ),
  "Pop-Up Event": (
    <svg className="wts-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  "Boutique Space": (
    <svg className="wts-svg-icon" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26.4857 12.8573H3.5142C3.20775 12.8546 2.9043 12.9178 2.62431 13.0425C2.34435 13.1671 2.09439 13.3504 1.89129 13.5799C1.68818 13.8094 1.53667 14.0798 1.44698 14.3729C1.35728 14.6659 1.33149 14.9748 1.37134 15.2787L2.93563 27.0643C3.00362 27.5831 3.25907 28.0592 3.65381 28.4025C4.04854 28.746 4.55529 28.9331 5.07849 28.9286H24.8786C25.4016 28.9331 25.9084 28.746 26.3031 28.4025C26.6979 28.0592 26.9533 27.5831 27.0214 27.0643L28.5857 15.2787C28.6249 14.9784 28.6003 14.6732 28.5131 14.3831C28.4259 14.0931 28.2782 13.8248 28.0798 13.596C27.8814 13.3672 27.6366 13.1831 27.3619 13.0557C27.0872 12.9284 26.7885 12.8607 26.4857 12.8573Z"/>
      <path d="M9.64282 18.2144V23.5715"/>
      <path d="M15 18.2144V23.5715"/>
      <path d="M20.3572 18.2144V23.5715"/>
      <path d="M20.3142 3.30029C21.5978 3.52206 22.7738 4.15699 23.6635 5.10852C24.5533 6.06004 25.1078 7.27611 25.2428 8.57172L25.7143 12.8574"/>
      <path d="M4.28577 12.8573L4.7572 8.57159C4.90102 7.28365 5.45945 6.07732 6.34837 5.1343C7.2373 4.19127 8.40856 3.56262 9.68577 3.34302"/>
      <path d="M20.3571 3.7501C20.3571 4.10185 20.2878 4.45018 20.1532 4.77514C20.0186 5.10013 19.8213 5.39541 19.5726 5.64413C19.3238 5.89288 19.0286 6.09017 18.7036 6.22478C18.3786 6.3594 18.0303 6.42868 17.6785 6.42868H12.3214C11.611 6.42868 10.9297 6.14646 10.4274 5.64413C9.92504 5.1418 9.64282 4.4605 9.64282 3.7501C9.64282 3.0397 9.92504 2.3584 10.4274 1.85607C10.9297 1.35374 11.611 1.07153 12.3214 1.07153H17.6785C18.3889 1.07153 19.0702 1.35374 19.5726 1.85607C20.0749 2.3584 20.3571 3.0397 20.3571 3.7501Z"/>
    </svg>
  ),
  "Vendor Booth": (
    <svg className="wts-svg-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0.90625 10.6797C0.90625 11.232 1.35397 11.6797 1.90625 11.6797H12.0938C12.646 11.6797 13.0938 11.232 13.0938 10.6797V8.84C12.2835 8.62035 11.6875 7.87977 11.6875 7C11.6875 6.12023 12.2835 5.37965 13.0938 5.16V3.32031C13.0938 2.76803 12.646 2.32031 12.0938 2.32031H1.90625C1.35397 2.32031 0.90625 2.76803 0.90625 3.32031V5.15583C1.72446 5.37015 2.32812 6.11458 2.32812 7C2.32812 7.88542 1.72446 8.62985 0.90625 8.84417V10.6797Z"/>
      <path d="M9.10938 2.32812V3.96876"/>
      <path d="M9.10938 6.17969V7.82031"/>
      <path d="M9.10938 10.0391V11.6797"/>
    </svg>
  ),
  "Online Platform": (
    <svg className="wts-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
};


interface WhereToSellProps {
  onNavigate?: (page: string) => void;
}

const WhereToSell: React.FC<WhereToSellProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showSaved, setShowSaved] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCollapse = (type: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return OPPORTUNITIES.filter(o => {
      const matchesSearch =
        !search ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.description.toLowerCase().includes(search.toLowerCase()) ||
        o.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "All Types" || o.type === typeFilter;
      const matchesLocation = locationFilter === "All Locations" || o.location === locationFilter;
      const matchesStatus = statusFilter === "All Statuses" || o.status === statusFilter;
      const matchesSaved = !showSaved || saved.has(o.id);
      return matchesSearch && matchesType && matchesLocation && matchesStatus && matchesSaved;
    });
  }, [search, typeFilter, locationFilter, statusFilter, showSaved, saved]);

  const hasFilters = search || typeFilter !== "All Types" || locationFilter !== "All Locations" || statusFilter !== "All Statuses" || showSaved;

  const CATEGORY_ORDER = ["Farmers Market", "Pop-Up Event", "Boutique Space", "Vendor Booth", "Online Platform"] as const;
  const CATEGORY_LABELS: Record<string, string> = {
    "Farmers Market": "Farmers Markets",
    "Pop-Up Event": "Pop-Up & Seasonal Events",
    "Boutique Space": "Permanent Retail Spaces",
    "Vendor Booth": "Expos & Fairs",
    "Online Platform": "Online Platforms",
  };

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map(type => ({
      type,
      label: CATEGORY_LABELS[type],
      items: filtered.filter(o => o.type === type),
    })).filter(g => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="wts-page">
      <button className="back-button" onClick={() => onNavigate?.("home")}>
        ← Back to Dashboard
      </button>

      {/* Location notice */}
      <div className="wts-notice">
        <PinIcon /> We're starting with Utah — more locations coming soon! If you'd like to see your area added, <a href="mailto:admin@dductly.com" className="wts-notice-link">let us know</a>.
      </div>

      {/* Header */}
      <div className="wts-header">
        <p className="wts-eyebrow">Resources</p>
        <h1 className="wts-title">Where to Sell</h1>
        <p className="wts-subtitle">
          Discover farmers markets, pop-ups, boutiques, and online platforms to grow your business.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="wts-filters-card">
        <div className="wts-search-wrap">
          <svg className="wts-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="wts-search"
            type="text"
            placeholder="Search by name, category, or keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wts-search-clear" onClick={() => setSearch("")} aria-label="Clear search">×</button>
          )}
        </div>
        <div className="wts-filter-row">
          <button
            className={`wts-filter-toggle${showFilters ? " active" : ""}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters
            {(typeFilter !== "All Types" || locationFilter !== "All Locations" || statusFilter !== "All Statuses") && (
              <span className="wts-filter-badge">
                {[typeFilter !== "All Types", locationFilter !== "All Locations", statusFilter !== "All Statuses"].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            className={`wts-saved-btn${showSaved ? " active" : ""}`}
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? "★" : "☆"} Saved {saved.size > 0 && `(${saved.size})`}
          </button>
          {hasFilters && (
            <button className="wts-clear-btn" onClick={() => { setSearch(""); setTypeFilter("All Types"); setLocationFilter("All Locations"); setStatusFilter("All Statuses"); setShowSaved(false); }}>
              Clear all
            </button>
          )}
        </div>
        {showFilters && (
          <div className="wts-dropdowns">
            <div className="wts-filter-group">
              <label className="wts-filter-label">Location</label>
              <select className="wts-select" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="wts-filter-group">
              <label className="wts-filter-label">Type</label>
              <select className="wts-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="wts-filter-group">
              <label className="wts-filter-label">Status</label>
              <select className="wts-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* All Opportunities — grouped by category */}
      <div className="wts-section">
        <div className="wts-section-header">
          <h2 className="wts-section-title">
            {hasFilters ? `Results (${filtered.length})` : "All Opportunities"}
          </h2>
          {!hasFilters && <p className="wts-section-sub">{OPPORTUNITIES.length} places to grow your business</p>}
        </div>

        {filtered.length === 0 ? (
          <div className="wts-empty">
            <p>No opportunities match your filters.</p>
            <button className="wts-clear-btn" onClick={() => { setSearch(""); setTypeFilter("All Types"); setLocationFilter("All Locations"); setStatusFilter("All Statuses"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.type} className="wts-category-group">
              <button className="wts-category-header" onClick={() => toggleCollapse(group.type)}>
                <h3 className="wts-category-title">
                  {TYPE_ICON_SVG[group.type]}
                  {group.label}
                </h3>
                <div className="wts-category-header-right">
                  <span className="wts-category-count">{group.items.length}</span>
                  <span className="wts-collapse-icon">{collapsed.has(group.type) ? "▸" : "▾"}</span>
                </div>
              </button>
              {!collapsed.has(group.type) && (
                <div className="wts-grid">
                  {group.items.map(o => (
                    <div key={o.id} className="wts-card">
                      <div className="wts-card-top">
                        <h3 className="wts-card-name">{o.name}</h3>
                        <button
                          className={`wts-bookmark${saved.has(o.id) ? " saved" : ""}`}
                          onClick={() => toggleSave(o.id)}
                          aria-label={saved.has(o.id) ? "Unsave" : "Save"}
                        >
                          {saved.has(o.id) ? "★" : "☆"}
                        </button>
                      </div>
                      <p className="wts-card-location"><PinIcon /> {o.location}{o.season ? ` · ${o.season}` : ""}</p>
                      <p className="wts-card-desc">{o.description}</p>
                      {o.boothInfo && <p className="wts-booth-info">{o.boothInfo}</p>}
                      <div className="wts-card-footer">
                        <span className={`wts-status ${STATUS_CLASS[o.status]}`}>
                          {o.status}
                        </span>
                        <div className="wts-card-actions">
                          <a href={o.websiteUrl} target="_blank" rel="noopener noreferrer" className="wts-btn-ghost">
                            Learn More
                          </a>
                          <a href={o.applyUrl} target="_blank" rel="noopener noreferrer" className="wts-btn-primary">
                            Apply
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="wts-disclaimer-box">
        <p className="wts-disclaimer-title">
          <svg className="wts-pin-icon" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 5.03108C11.5055 4.22784 11.296 3.43776 10.8931 2.74285C10.4902 2.04795 9.9086 1.47356 9.20876 1.07931C8.50891 0.68506 7.71628 0.485325 6.91318 0.50084C6.11007 0.516354 5.32575 0.746553 4.64165 1.16754C3.95755 1.58852 3.39861 2.18495 3.02284 2.89489C2.64708 3.60484 2.46819 4.40242 2.50476 5.20485C2.54132 6.00727 2.79201 6.78528 3.23078 7.45811C3.66956 8.13094 4.28043 8.67405 4.99998 9.03108V10.5311C4.99998 10.6637 5.05266 10.7909 5.14643 10.8846C5.2402 10.9784 5.36738 11.0311 5.49998 11.0311H8.49999C8.63259 11.0311 8.75977 10.9784 8.85354 10.8846C8.94731 10.7909 8.99999 10.6637 8.99999 10.5311V9.03108C9.74746 8.6628 10.3774 8.09336 10.8191 7.38675C11.2607 6.68013 11.4965 5.86434 11.5 5.03108Z"/>
            <path d="M5 13.5H9"/>
          </svg>
          A note before you apply
        </p>
        <p className="wts-disclaimer-text">
          All listings are real and verified, but application windows may have closed. Always confirm current availability on the organizer's website before applying. dductly is not affiliated with any listed organization.
        </p>
      </div>
    </div>
  );
};

export default WhereToSell;
