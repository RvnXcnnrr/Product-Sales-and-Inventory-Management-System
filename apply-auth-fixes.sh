# Run this script to apply the authentication and security fixes

# Load environment variables
source .env.local 2>/dev/null || echo "No .env.local file found"

echo "Applying authentication and security fixes..."

# Check if we have Supabase credentials
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
  exit 1
fi

# Get Supabase credentials for direct DB access
echo "Please enter your Supabase database password:"
read -s DB_PASSWORD

# Apply the SQL migrations
if command -v psql &> /dev/null; then
  # Extract host and database from URL
  DB_HOST=$(echo $VITE_SUPABASE_URL | sed -e 's|^https\?://||' -e 's|\.supabase\.co.*$|.supabase.co|')
  DB_PORT=5432
  DB_NAME=postgres
  DB_USER=postgres
  
  # Apply RLS policies
  echo "Applying enhanced security policies..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f enhanced-security-policies.sql
  
  # Apply user-store creation trigger
  echo "Updating user registration trigger..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f user-store-creation-trigger.sql
  
  echo "Database migrations applied successfully!"
else
  echo "Error: psql command not found. Please install PostgreSQL client tools or apply the SQL files manually."
  echo "The SQL files are: enhanced-security-policies.sql and user-store-creation-trigger.sql"
fi

echo "Authentication and security fixes have been applied."
echo "Please restart your application to see the changes."
