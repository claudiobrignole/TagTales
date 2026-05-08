const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const newKeys = {
  "dashboard": {
    "welcome": "Welcome back, {{name}}",
    "subtitle": "Here's what's happening with your gallery today.",
    "totalArtworks": "Total Artworks",
    "totalSales": "Total Sales",
    "pendingPayments": "Pending Payments",
    "recentSales": "Recent Sales",
    "viewAllSales": "View All Sales",
    "noRecentSales": "No recent sales found.",
    "quickActions": "Quick Actions",
    "uploadNewArtwork": "Upload New Artwork",
    "requestPayout": "Request Payout",
    "viewContracts": "View Contracts"
  },
  "artworks": {
    "title": "My Artworks",
    "subtitle": "Manage your portfolio and track artwork status.",
    "allArtworks": "All Artworks",
    "allArtworksSubtitle": "Platform-wide artwork management.",
    "uploadArtwork": "Upload Artwork",
    "filterAll": "All",
    "filterDraft": "Draft",
    "filterPending": "Pending",
    "filterApproved": "Approved",
    "filterRejected": "Rejected",
    "filterSold": "Sold",
    "filterActive": "Active",
    "searchPlaceholder": "Search artworks...",
    "noArtworksFound": "No artworks found.",
    "approve": "Approve",
    "reject": "Reject",
    "rejectArtwork": "Reject Artwork",
    "rejectReasonPrompt": "Please provide a reason for rejecting \"{{title}}\". This will be sent to the artist.",
    "rejectReasonPlaceholder": "Reason for rejection...",
    "confirmRejection": "Confirm Rejection",
    "artworkApproved": "Artwork \"{{title}}\" approved and Ecwid product created successfully!",
    "artworkRejected": "Artwork \"{{title}}\" rejected."
  },
  "uploadArtwork": {
    "title": "Upload Artwork",
    "subtitle": "Submit a new piece to your portfolio.",
    "image": "Artwork Image",
    "uploadImage": "Upload Image",
    "changeImage": "Change Image",
    "artworkTitle": "Artwork Title",
    "technique": "Technique / Medium",
    "type": "Type / Category",
    "year": "Year",
    "dimensions": "Dimensions (cm)",
    "width": "Width",
    "height": "Height",
    "price": "Price",
    "exhibitionId": "Exhibition ID (Optional)",
    "description": "Description",
    "submit": "Submit Artwork",
    "submitting": "Submitting...",
    "successMessage": "Artwork submitted successfully! It is now pending approval."
  },
  "sales": {
    "title": "My Sales",
    "subtitle": "Track your artwork sales and earnings.",
    "allSalesTitle": "All Sales",
    "allSalesSubtitle": "Platform-wide sales overview.",
    "totalEarnings": "Total Earnings",
    "thisMonth": "This Month",
    "last3Months": "Last 3 Months",
    "thisYear": "This Year",
    "customRange": "Custom Range",
    "startDate": "Start Date",
    "endDate": "End Date",
    "apply": "Apply",
    "orderId": "Order ID",
    "artwork": "Artwork",
    "price": "Price",
    "artistShare": "Artist Share",
    "date": "Date",
    "status": "Status",
    "noSalesFound": "No sales found for the selected period."
  },
  "payments": {
    "title": "Payments",
    "subtitle": "Manage your payouts and financial history.",
    "allPaymentsTitle": "Payment Requests",
    "allPaymentsSubtitle": "Manage artist payout requests.",
    "availableBalance": "Available Balance",
    "requestPayout": "Request Payout",
    "paymentHistory": "Payment History",
    "amount": "Amount",
    "date": "Date",
    "status": "Status",
    "invoice": "Invoice",
    "noPaymentsFound": "No payment history found.",
    "markAsPaid": "Mark as Paid",
    "payoutRequested": "Payout requested successfully."
  },
  "contracts": {
    "title": "Contracts",
    "subtitle": "Review and sign your legal agreements.",
    "allContractsTitle": "Manage Contracts",
    "allContractsSubtitle": "Draft and issue contracts to artists.",
    "draftNewContract": "Draft New Contract",
    "contractTitle": "Contract Title",
    "selectArtist": "Select Artist",
    "contractContent": "Contract Content",
    "issueContract": "Issue Contract",
    "issuing": "Issuing...",
    "signContract": "Sign Contract",
    "fullNameSignature": "Full Name (Signature)",
    "emailSignature": "Email Address",
    "signAndAccept": "Sign & Accept Terms",
    "signing": "Signing...",
    "contractSigned": "Contract signed successfully.",
    "contractIssued": "Contract issued successfully.",
    "noContractsFound": "No contracts found."
  },
  "adminDashboard": {
    "title": "Admin Dashboard",
    "subtitle": "Overview of platform activity and pending tasks.",
    "totalUsers": "Total Users",
    "pendingArtworks": "Pending Artworks",
    "pendingPayments": "Pending Payments",
    "totalContracts": "Total Contracts"
  },
  "adminUsers": {
    "title": "Manage Users",
    "subtitle": "View and manage all registered users.",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "joined": "Joined",
    "actions": "Actions",
    "makeAdmin": "Make Admin",
    "makeArtist": "Make Artist",
    "ecwidConnection": "Ecwid Connection",
    "manageConnection": "Manage Connection",
    "noUsersFound": "No users found."
  },
  "connectionBanner": {
    "warningTitle": "Store Connection Required",
    "warningText": "Your profile is not yet linked to any store products. Your sales data will not appear until an administrator links your account.",
    "successTitle": "Store Connected",
    "successText": "Your profile is successfully linked to your store products. Your sales data is live."
  },
  "ecwidModal": {
    "title": "Manage Ecwid Connection",
    "subtitle": "Link store products to",
    "searchProducts": "Search products...",
    "searching": "Searching...",
    "noProductsFound": "No products found matching your search.",
    "selectedProducts": "Selected Products",
    "saveConnection": "Save Connection",
    "saving": "Saving..."
  },
  "login": {
    "title": "Artist Portal",
    "subtitle": "Sign in to manage your artworks, sales, and contracts.",
    "signInWithGoogle": "Sign in with Google",
    "verifyEmailTitle": "Verify your email",
    "verifyEmailText": "We've sent a verification link to your email address. Please verify your email to continue.",
    "resendEmail": "Resend Verification Email",
    "backToLogin": "Back to Login",
    "verificationSent": "Verification email sent!"
  }
};

const mergeDeep = (target, source) => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

['en.json', 'it.json', 'de.json', 'fr.json', 'es.json'].forEach(file => {
  const filePath = path.join(localesDir, file);
  let content = {};
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  mergeDeep(content, newKeys);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
});

console.log('Locales updated');
