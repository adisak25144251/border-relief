-- GovTrip Intelligence Database Initialization SQL
-- PostgreSQL 15+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial queries

-- Create initial admin user (will be managed by Prisma later)
-- This is just for reference

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE govtrip TO govtrip;

-- Create indexes for performance
-- These will be created by Prisma migrations, but listed here for reference

-- Comments
COMMENT ON DATABASE govtrip IS 'GovTrip Intelligence - Government Trip Management System';

-- Initial configuration seed data
-- Will be inserted via Prisma seed script
