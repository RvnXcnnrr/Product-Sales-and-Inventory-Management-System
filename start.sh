#!/bin/bash

# POS & Inventory Management System - Quick Start Script
echo "🚀 POS & Inventory Management System - Quick Start"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
MIN_VERSION="18.0.0"

if [ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Project files found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
echo ""
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f ".env.template" ]; then
        cp .env.template .env
        echo "📝 .env file created from template"
        echo ""
        echo "⚠️  IMPORTANT: You need to configure your Supabase credentials in .env file"
        echo "   1. Go to https://supabase.com and create a new project"
        echo "   2. Get your Project URL and API Key from Settings > API"
        echo "   3. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
        echo "   4. Follow SETUP.md for database schema setup"
    else
        echo "❌ .env.template not found"
        exit 1
    fi
else
    echo "✅ .env file found"
fi

# Check if Supabase is configured
echo ""
if grep -q "your_supabase_project_url_here" .env 2>/dev/null; then
    echo "⚠️  Supabase not configured yet. The app will run with mock data."
    echo "   Configure Supabase following SETUP.md for full functionality."
else
    echo "✅ Supabase appears to be configured"
fi

# Start development server
echo ""
echo "🎯 Starting development server..."
echo "   The application will open at http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Demo credentials info
echo "🔑 Demo Credentials (for testing):"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""

sleep 2

# Start the dev server
npm run dev
