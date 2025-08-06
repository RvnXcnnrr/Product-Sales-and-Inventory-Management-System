# Email Verification Status Checker
# Run this to check if email verification is working

Write-Host "=== EMAIL VERIFICATION TROUBLESHOOTING GUIDE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. CHECK SUPABASE SETTINGS:" -ForegroundColor Yellow
Write-Host "   • Go to your Supabase Dashboard"
Write-Host "   • Navigate to Authentication → Settings"
Write-Host "   • Check 'Enable email confirmations' setting"
Write-Host ""

Write-Host "2. IMMEDIATE FIX OPTIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   OPTION A - Disable Email Confirmation (Development):" -ForegroundColor Green
Write-Host "   1. Supabase Dashboard → Authentication → Settings"
Write-Host "   2. UNCHECK 'Enable email confirmations'"
Write-Host "   3. Save settings"
Write-Host ""
Write-Host "   OPTION B - Run SQL Fix:" -ForegroundColor Green
Write-Host "   1. Go to Supabase SQL Editor"
Write-Host "   2. Run: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;"
Write-Host ""

Write-Host "3. PRODUCTION SOLUTIONS:" -ForegroundColor Yellow
Write-Host "   • Configure SMTP with Gmail, SendGrid, or AWS SES"
Write-Host "   • See EMAIL_VERIFICATION_FIX.md for detailed instructions"
Write-Host ""

Write-Host "4. FILES CREATED TO HELP:" -ForegroundColor Yellow
Write-Host "   • EMAIL_VERIFICATION_FIX.md - Complete guide"
Write-Host "   • disable-email-confirmation.sql - SQL to disable verification"
Write-Host "   • check-email-status.sql - SQL to check user status"
Write-Host ""

Write-Host "=== QUICK START ===" -ForegroundColor Cyan
Write-Host "For immediate testing, use OPTION A above to disable email confirmation."
Write-Host "This will allow users to register and login immediately without email verification."
Write-Host ""

Read-Host "Press Enter to continue..."
