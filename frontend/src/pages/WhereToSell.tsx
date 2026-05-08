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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "Open": { bg: "#d1fae5", color: "#065f46" },
  "Rolling Applications": { bg: "#dbeafe", color: "#1e40af" },
  "Check Website": { bg: "#fef3c7", color: "#92400e" },
};

const TYPE_ICONS: Record<string, string> = {
  "Farmers Market": "🌿",
  "Pop-Up Event": "🎪",
  "Vendor Booth": "🏪",
  "Boutique Space": "✨",
  "Online Platform": "💻",
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
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [featuredCollapsed, setFeaturedCollapsed] = useState(false);

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

  const featured = OPPORTUNITIES.filter(o => o.featured);
  const hasFilters = search || typeFilter !== "All Types" || locationFilter !== "All Locations" || statusFilter !== "All Statuses" || showSaved;

  const CATEGORY_ORDER = ["Farmers Market", "Pop-Up Event", "Boutique Space", "Vendor Booth", "Online Platform"] as const;
  const CATEGORY_LABELS: Record<string, string> = {
    "Farmers Market": "🌿 Farmers Markets",
    "Pop-Up Event": "🎪 Pop-Up & Seasonal Events",
    "Boutique Space": "✨ Permanent Retail Spaces",
    "Vendor Booth": "🏪 Expos & Fairs",
    "Online Platform": "💻 Online Platforms",
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
        📍 We're starting with Utah — more locations coming soon! If you'd like to see your area added, <a href="mailto:admin@dductly.com" className="wts-notice-link">let us know</a>.
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
          <button
            className={`wts-saved-btn${showSaved ? " active" : ""}`}
            onClick={() => setShowSaved(!showSaved)}
          >
            {showSaved ? "★" : "☆"} Saved {saved.size > 0 && `(${saved.size})`}
          </button>
          {hasFilters && (
            <button className="wts-clear-btn" onClick={() => { setSearch(""); setTypeFilter("All Types"); setLocationFilter("All Locations"); setStatusFilter("All Statuses"); setShowSaved(false); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Featured */}
      {!hasFilters && (
        <div className="wts-section">
          <button className="wts-category-header" onClick={() => setFeaturedCollapsed(c => !c)}>
            <h2 className="wts-section-title" style={{ margin: 0 }}>Featured Opportunities</h2>
            <div className="wts-category-header-right">
              <span className="wts-section-sub" style={{ margin: 0 }}>Handpicked for Summer 2026</span>
              <span className="wts-collapse-icon">{featuredCollapsed ? "▸" : "▾"}</span>
            </div>
          </button>
          {!featuredCollapsed && (
          <div className="wts-featured-grid">
            {featured.map(o => (
              <div key={o.id} className="wts-featured-card">
                <div className="wts-featured-top">
                  <span className="wts-type-icon">{TYPE_ICONS[o.type]}</span>
                  <span className="wts-type-badge">{o.type}</span>
                  <button
                    className={`wts-bookmark${saved.has(o.id) ? " saved" : ""}`}
                    onClick={() => toggleSave(o.id)}
                    aria-label={saved.has(o.id) ? "Unsave" : "Save"}
                  >
                    {saved.has(o.id) ? "★" : "☆"}
                  </button>
                </div>
                <h3 className="wts-card-name">{o.name}</h3>
                <p className="wts-card-location">📍 {o.location}{o.season ? ` · ${o.season}` : ""}</p>
                <p className="wts-card-desc">{o.description}</p>
                {o.boothInfo && <p className="wts-booth-info">{o.boothInfo}</p>}
                <div className="wts-tags">
                  {o.tags.map(t => <span key={t} className="wts-tag">{t}</span>)}
                </div>
                <div className="wts-card-footer">
                  <span className="wts-status" style={STATUS_COLORS[o.status]}>
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
      )}

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
                <h3 className="wts-category-title">{group.label}</h3>
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
                      <p className="wts-card-location">📍 {o.location}{o.season ? ` · ${o.season}` : ""}</p>
                      <p className="wts-card-desc">{o.description}</p>
                      {o.boothInfo && <p className="wts-booth-info">{o.boothInfo}</p>}
                      <div className="wts-card-footer">
                        <span className="wts-status" style={STATUS_COLORS[o.status]}>
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
        <p className="wts-disclaimer-title">📌 A note before you apply</p>
        <p className="wts-disclaimer-text">
          All listings are real and verified, but application windows may have closed. Always confirm current availability on the organizer's website before applying. dductly is not affiliated with any listed organization.
        </p>
      </div>
    </div>
  );
};

export default WhereToSell;
