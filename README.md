# dductly

dductly is a simple, secure tool that takes the stress out of tax season by helping people track their donations and write-offs year-round. Instead of scrambling through receipts and emails at the last minute, users log their charitable gifts and deductible expenses as they happen. When tax time comes, dductly generates a clean, exportable report that works with any accountant or tax service, no lock-in to a single platform. With a major gap in the market that leaves millions of individuals and small businesses without a trusted solution, dductly is stepping up by turning everyday giving into real savings, making tax filing easier, smarter, and far less stressful.

### Email confirmation (Supabase)

For "Confirm email" links in signup emails to work, add your redirect URL in **Supabase Dashboard**:

1. Go to **Authentication → URL Configuration → Redirect URLs**.
2. Add:
   - Production: `https://yourdomain.com/confirm-email`
   - Development: `http://localhost:5173/confirm-email`

If this URL is not in the list, users may see a "path is invalid" (or similar) error when they click the confirm link in their email.

### frontend
### backend
