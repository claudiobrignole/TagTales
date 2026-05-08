const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
};

// Dashboard.tsx
replaceInFile('./src/pages/Dashboard.tsx', [
  ['Loading dashboard...', '{t(\'common.loading\')}'],
  ['Welcome back, {user?.email?.split(\'@\')[0]}', '{t(\'dashboard.welcome\', { name: user?.email?.split(\'@\')[0] })}'],
  ['Here\'s what\'s happening with your gallery today.', '{t(\'dashboard.subtitle\')}'],
  ['Total Artworks', '{t(\'dashboard.totalArtworks\')}'],
  ['Total Earnings', '{t(\'sales.totalEarnings\')}'],
  ['Available Payout', '{t(\'payments.availableBalance\')}'],
  ['Recent Sales', '{t(\'dashboard.recentSales\')}'],
  ['View All', '{t(\'dashboard.viewAllSales\')}'],
  ['No recent sales found.', '{t(\'dashboard.noRecentSales\')}'],
  ['Artwork', '{t(\'sales.artwork\')}'],
  ['Date', '{t(\'common.date\')}'],
  ['Amount', '{t(\'common.amount\')}'],
  ['Status', '{t(\'common.status\')}'],
  ['Quick Actions', '{t(\'dashboard.quickActions\')}'],
  ['Upload New Artwork', '{t(\'dashboard.uploadNewArtwork\')}'],
  ['Request Payout', '{t(\'dashboard.requestPayout\')}'],
  ['View Contracts', '{t(\'dashboard.viewContracts\')}']
]);

// Artworks.tsx
replaceInFile('./src/pages/Artworks.tsx', [
  ['Loading artworks...', '{t(\'common.loading\')}'],
  ['My Artworks', '{t(\'artworks.title\')}'],
  ['Manage your portfolio and track artwork status.', '{t(\'artworks.subtitle\')}'],
  ['All Artworks', '{t(\'artworks.allArtworks\')}'],
  ['Platform-wide artwork management.', '{t(\'artworks.allArtworksSubtitle\')}'],
  ['Upload Artwork', '{t(\'artworks.uploadArtwork\')}'],
  ['>All<', '>{t(\'artworks.filterAll\')}<'],
  ['>Draft<', '>{t(\'artworks.filterDraft\')}<'],
  ['>Pending<', '>{t(\'artworks.filterPending\')}<'],
  ['>Approved<', '>{t(\'artworks.filterApproved\')}<'],
  ['>Rejected<', '>{t(\'artworks.filterRejected\')}<'],
  ['>Sold<', '>{t(\'artworks.filterSold\')}<'],
  ['>Active<', '>{t(\'artworks.filterActive\')}<'],
  ['placeholder="Search artworks..."', 'placeholder={t(\'artworks.searchPlaceholder\')}'],
  ['No artworks found.', '{t(\'artworks.noArtworksFound\')}'],
  ['Reject Artwork', '{t(\'artworks.rejectArtwork\')}'],
  ['Please provide a reason for rejecting "{rejectingArtwork.title}". This will be sent to the artist.', '{t(\'artworks.rejectReasonPrompt\', { title: rejectingArtwork.title })}'],
  ['placeholder="Reason for rejection..."', 'placeholder={t(\'artworks.rejectReasonPlaceholder\')}'],
  ['Confirm Rejection', '{t(\'artworks.confirmRejection\')}'],
  ['Cancel', '{t(\'common.cancel\')}'],
  ['Approve', '{t(\'artworks.approve\')}'],
  ['Reject', '{t(\'artworks.reject\')}']
]);

// UploadArtwork.tsx
replaceInFile('./src/pages/UploadArtwork.tsx', [
  ['Upload Artwork', '{t(\'uploadArtwork.title\')}'],
  ['Submit a new piece to your portfolio.', '{t(\'uploadArtwork.subtitle\')}'],
  ['Artwork Image', '{t(\'uploadArtwork.image\')}'],
  ['Upload Image', '{t(\'uploadArtwork.uploadImage\')}'],
  ['Change Image', '{t(\'uploadArtwork.changeImage\')}'],
  ['Artwork Title', '{t(\'uploadArtwork.artworkTitle\')}'],
  ['Technique / Medium', '{t(\'uploadArtwork.technique\')}'],
  ['Type / Category', '{t(\'uploadArtwork.type\')}'],
  ['Year', '{t(\'uploadArtwork.year\')}'],
  ['Dimensions (cm)', '{t(\'uploadArtwork.dimensions\')}'],
  ['Width', '{t(\'uploadArtwork.width\')}'],
  ['Height', '{t(\'uploadArtwork.height\')}'],
  ['Price', '{t(\'uploadArtwork.price\')}'],
  ['Exhibition ID (Optional)', '{t(\'uploadArtwork.exhibitionId\')}'],
  ['Description', '{t(\'uploadArtwork.description\')}'],
  ['Submit Artwork', '{t(\'uploadArtwork.submit\')}'],
  ['Submitting...', '{t(\'uploadArtwork.submitting\')}']
]);

// Sales.tsx
replaceInFile('./src/pages/Sales.tsx', [
  ['Loading sales...', '{t(\'common.loading\')}'],
  ['My Sales', '{t(\'sales.title\')}'],
  ['Track your artwork sales and earnings.', '{t(\'sales.subtitle\')}'],
  ['Total Earnings', '{t(\'sales.totalEarnings\')}'],
  ['This Month', '{t(\'sales.thisMonth\')}'],
  ['Last 3 Months', '{t(\'sales.last3Months\')}'],
  ['This Year', '{t(\'sales.thisYear\')}'],
  ['Custom Range', '{t(\'sales.customRange\')}'],
  ['Start Date', '{t(\'sales.startDate\')}'],
  ['End Date', '{t(\'sales.endDate\')}'],
  ['Apply', '{t(\'sales.apply\')}'],
  ['Order ID', '{t(\'sales.orderId\')}'],
  ['Artwork', '{t(\'sales.artwork\')}'],
  ['Price', '{t(\'sales.price\')}'],
  ['Artist Share', '{t(\'sales.artistShare\')}'],
  ['Date', '{t(\'common.date\')}'],
  ['Status', '{t(\'common.status\')}'],
  ['No sales found for the selected period.', '{t(\'sales.noSalesFound\')}']
]);

// Payments.tsx
replaceInFile('./src/pages/Payments.tsx', [
  ['Loading payments...', '{t(\'common.loading\')}'],
  ['Payments', '{t(\'payments.title\')}'],
  ['Manage your payouts and financial history.', '{t(\'payments.subtitle\')}'],
  ['Available Balance', '{t(\'payments.availableBalance\')}'],
  ['Request Payout', '{t(\'payments.requestPayout\')}'],
  ['Payment History', '{t(\'payments.paymentHistory\')}'],
  ['Amount', '{t(\'common.amount\')}'],
  ['Date', '{t(\'common.date\')}'],
  ['Status', '{t(\'common.status\')}'],
  ['Invoice', '{t(\'payments.invoice\')}'],
  ['No payment history found.', '{t(\'payments.noPaymentsFound\')}']
]);

// Contracts.tsx
replaceInFile('./src/pages/Contracts.tsx', [
  ['Loading contracts...', '{t(\'common.loading\')}'],
  ['Contracts', '{t(\'contracts.title\')}'],
  ['Review and sign your legal agreements.', '{t(\'contracts.subtitle\')}'],
  ['Sign Contract', '{t(\'contracts.signContract\')}'],
  ['Full Name (Signature)', '{t(\'contracts.fullNameSignature\')}'],
  ['Email Address', '{t(\'contracts.emailSignature\')}'],
  ['Sign & Accept Terms', '{t(\'contracts.signAndAccept\')}'],
  ['Signing...', '{t(\'contracts.signing\')}'],
  ['Cancel', '{t(\'common.cancel\')}'],
  ['No contracts found.', '{t(\'contracts.noContractsFound\')}']
]);

// AdminDashboard.tsx
replaceInFile('./src/pages/AdminDashboard.tsx', [
  ['Loading dashboard...', '{t(\'common.loading\')}'],
  ['Admin Dashboard', '{t(\'adminDashboard.title\')}'],
  ['Overview of platform activity and pending tasks.', '{t(\'adminDashboard.subtitle\')}'],
  ['Total Users', '{t(\'adminDashboard.totalUsers\')}'],
  ['Pending Artworks', '{t(\'adminDashboard.pendingArtworks\')}'],
  ['Pending Payments', '{t(\'adminDashboard.pendingPayments\')}'],
  ['Total Contracts', '{t(\'adminDashboard.totalContracts\')}']
]);

// AdminUsers.tsx
replaceInFile('./src/pages/AdminUsers.tsx', [
  ['Loading users...', '{t(\'common.loading\')}'],
  ['Manage Users', '{t(\'adminUsers.title\')}'],
  ['View and manage all registered users.', '{t(\'adminUsers.subtitle\')}'],
  ['Name', '{t(\'adminUsers.name\')}'],
  ['Email', '{t(\'adminUsers.email\')}'],
  ['Role', '{t(\'adminUsers.role\')}'],
  ['Joined', '{t(\'adminUsers.joined\')}'],
  ['Actions', '{t(\'common.actions\')}'],
  ['Make Admin', '{t(\'adminUsers.makeAdmin\')}'],
  ['Make Artist', '{t(\'adminUsers.makeArtist\')}'],
  ['Ecwid Connection', '{t(\'adminUsers.ecwidConnection\')}'],
  ['Manage Connection', '{t(\'adminUsers.manageConnection\')}'],
  ['No users found.', '{t(\'adminUsers.noUsersFound\')}']
]);

// AdminSales.tsx
replaceInFile('./src/pages/AdminSales.tsx', [
  ['Loading sales...', '{t(\'common.loading\')}'],
  ['All Sales', '{t(\'sales.allSalesTitle\')}'],
  ['Platform-wide sales overview.', '{t(\'sales.allSalesSubtitle\')}'],
  ['Total Earnings', '{t(\'sales.totalEarnings\')}'],
  ['This Month', '{t(\'sales.thisMonth\')}'],
  ['Last 3 Months', '{t(\'sales.last3Months\')}'],
  ['This Year', '{t(\'sales.thisYear\')}'],
  ['Custom Range', '{t(\'sales.customRange\')}'],
  ['Start Date', '{t(\'sales.startDate\')}'],
  ['End Date', '{t(\'sales.endDate\')}'],
  ['Apply', '{t(\'sales.apply\')}'],
  ['Order ID', '{t(\'sales.orderId\')}'],
  ['Artwork', '{t(\'sales.artwork\')}'],
  ['Price', '{t(\'sales.price\')}'],
  ['Artist Share', '{t(\'sales.artistShare\')}'],
  ['Date', '{t(\'common.date\')}'],
  ['Status', '{t(\'common.status\')}'],
  ['No sales found for the selected period.', '{t(\'sales.noSalesFound\')}']
]);

// AdminPayments.tsx
replaceInFile('./src/pages/AdminPayments.tsx', [
  ['Loading payments...', '{t(\'common.loading\')}'],
  ['Payment Requests', '{t(\'payments.allPaymentsTitle\')}'],
  ['Manage artist payout requests.', '{t(\'payments.allPaymentsSubtitle\')}'],
  ['Amount', '{t(\'common.amount\')}'],
  ['Date', '{t(\'common.date\')}'],
  ['Status', '{t(\'common.status\')}'],
  ['Invoice', '{t(\'payments.invoice\')}'],
  ['Actions', '{t(\'common.actions\')}'],
  ['Mark as Paid', '{t(\'payments.markAsPaid\')}'],
  ['No payment history found.', '{t(\'payments.noPaymentsFound\')}']
]);

// AdminContracts.tsx
replaceInFile('./src/pages/AdminContracts.tsx', [
  ['Loading contracts...', '{t(\'common.loading\')}'],
  ['Manage Contracts', '{t(\'contracts.allContractsTitle\')}'],
  ['Draft and issue contracts to artists.', '{t(\'contracts.allContractsSubtitle\')}'],
  ['Draft New Contract', '{t(\'contracts.draftNewContract\')}'],
  ['Contract Title', '{t(\'contracts.contractTitle\')}'],
  ['Select Artist', '{t(\'contracts.selectArtist\')}'],
  ['Contract Content', '{t(\'contracts.contractContent\')}'],
  ['Issue Contract', '{t(\'contracts.issueContract\')}'],
  ['Issuing...', '{t(\'contracts.issuing\')}'],
  ['Cancel', '{t(\'common.cancel\')}'],
  ['No contracts found.', '{t(\'contracts.noContractsFound\')}']
]);

// ConnectionBanner.tsx
replaceInFile('./src/components/ConnectionBanner.tsx', [
  ['Store Connection Required', '{t(\'connectionBanner.warningTitle\')}'],
  ['Your profile is not yet linked to any store products. Your sales data will not appear until an administrator links your account.', '{t(\'connectionBanner.warningText\')}'],
  ['Store Connected', '{t(\'connectionBanner.successTitle\')}'],
  ['Your profile is successfully linked to your store products. Your sales data is live.', '{t(\'connectionBanner.successText\')}']
]);

// EcwidConnectionModal.tsx
replaceInFile('./src/components/EcwidConnectionModal.tsx', [
  ['Manage Ecwid Connection', '{t(\'ecwidModal.title\')}'],
  ['Link store products to', '{t(\'ecwidModal.subtitle\')}'],
  ['placeholder="Search products..."', 'placeholder={t(\'ecwidModal.searchProducts\')}'],
  ['Searching...', '{t(\'ecwidModal.searching\')}'],
  ['No products found matching your search.', '{t(\'ecwidModal.noProductsFound\')}'],
  ['Selected Products', '{t(\'ecwidModal.selectedProducts\')}'],
  ['Cancel', '{t(\'common.cancel\')}'],
  ['Save Connection', '{t(\'ecwidModal.saveConnection\')}'],
  ['Saving...', '{t(\'ecwidModal.saving\')}']
]);

// Login.tsx
replaceInFile('./src/pages/Login.tsx', [
  ['Artist Portal', '{t(\'login.title\')}'],
  ['Sign in to manage your artworks, sales, and contracts.', '{t(\'login.subtitle\')}'],
  ['Sign in with Google', '{t(\'login.signInWithGoogle\')}'],
  ['Verify your email', '{t(\'login.verifyEmailTitle\')}'],
  ['We\'ve sent a verification link to your email address. Please verify your email to continue.', '{t(\'login.verifyEmailText\')}'],
  ['Resend Verification Email', '{t(\'login.resendEmail\')}'],
  ['Back to Login', '{t(\'login.backToLogin\')}']
]);

// Profile.tsx
replaceInFile('./src/pages/Profile.tsx', [
  ['Profile Settings', '{t(\'profile.title\')}'],
  ['Manage your personal information and preferences.', '{t(\'profile.subtitle\')}'],
  ['Personal Information', '{t(\'profile.personalInfo\')}'],
  ['Full Name', '{t(\'profile.fullName\')}'],
  ['Phone Number', '{t(\'profile.phone\')}'],
  ['Address', '{t(\'profile.address\')}'],
  ['City', '{t(\'profile.city\')}'],
  ['Country', '{t(\'profile.country\')}'],
  ['Bank Details', '{t(\'profile.bankDetails\')}'],
  ['IBAN', '{t(\'profile.iban\')}'],
  ['BIC / SWIFT', '{t(\'profile.bic\')}'],
  ['Preferences', '{t(\'profile.preferences\')}'],
  ['Language', '{t(\'profile.language\')}'],
  ['Save Changes', '{t(\'profile.saveChanges\')}'],
  ['Saving...', '{t(\'profile.saving\')}']
]);

