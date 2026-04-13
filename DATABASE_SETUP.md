# Database Setup Guide

This guide explains how to set up your Supabase database with the required tables and seed data.

## Database Schema

The database consists of three main tables:

### 1. **businesses** table

Stores information about service businesses.

| Column      | Type         | Notes                                       |
| ----------- | ------------ | ------------------------------------------- |
| id          | UUID         | Primary key, auto-generated                 |
| owner_id    | UUID         | ID of the business owner                    |
| name        | VARCHAR(255) | Business name                               |
| description | TEXT         | Business description                        |
| category    | VARCHAR(100) | Business category (e.g., Beauty & Wellness) |
| address     | TEXT         | Physical address                            |
| logo        | TEXT         | URL to logo image                           |
| rating      | FLOAT        | Business rating (0-5)                       |
| created_at  | TIMESTAMP    | Auto-generated creation timestamp           |
| updated_at  | TIMESTAMP    | Auto-generated last update timestamp        |

### 2. **employees** table

Stores employee information linked to businesses.

| Column      | Type         | Notes                                |
| ----------- | ------------ | ------------------------------------ |
| id          | UUID         | Primary key, auto-generated          |
| business_id | UUID         | Foreign key to businesses table      |
| name        | VARCHAR(255) | Employee name                        |
| role        | VARCHAR(100) | Job role/title                       |
| avatar      | TEXT         | URL to avatar image                  |
| created_at  | TIMESTAMP    | Auto-generated creation timestamp    |
| updated_at  | TIMESTAMP    | Auto-generated last update timestamp |

### 3. **services** table

Stores services offered by businesses.

| Column      | Type         | Notes                                |
| ----------- | ------------ | ------------------------------------ |
| id          | UUID         | Primary key, auto-generated          |
| business_id | UUID         | Foreign key to businesses table      |
| name        | VARCHAR(255) | Service name                         |
| duration    | INT          | Duration in minutes                  |
| price       | VARCHAR(50)  | Service price                        |
| description | TEXT         | Service description                  |
| created_at  | TIMESTAMP    | Auto-generated creation timestamp    |
| updated_at  | TIMESTAMP    | Auto-generated last update timestamp |

## Setup Instructions

### Step 1: Create Tables in Supabase

You have two options:

#### Option A: Using Supabase SQL Editor (Manual)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_create_tables.sql`
4. Paste it into the SQL editor
5. Click "Run"

#### Option B: Using Supabase CLI (Recommended)

```bash
supabase db push
```

### Step 2: Add Your Service Role Key

1. Go to your Supabase project settings
2. In the "API" section, copy your **Service Role Key**
3. Add it to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important**: Never commit the service role key to version control. Keep it in `.env.local` which is already in `.gitignore`.

### Step 3: Run the Seed Script

Once your tables are created and your environment variables are set, seed the database with sample data:

```bash
npm run seed
```

You should see output like:

```
🌱 Starting database seed...
Clearing existing data...
Adding businesses...
✅ Added 3 businesses
Adding employees...
✅ Added 3 employees
Adding services...
✅ Added 6 services
✨ Database seeding completed successfully!
```

## What Gets Seeded

The seed script populates the database with sample data:

- **3 Businesses**: Elite Hair Studio, Fit Body Gym, Zen Yoga Studio
- **3 Employees**: Sarah Johnson (Stylist), Mike Chen (Trainer), Emma Wilson (Yoga Instructor)
- **6 Services**: 2 for hair salon, 2 for gym, 2 for yoga studio

## File Structure

```
meetme/
├── supabase/
│   └── migrations/
│       └── 001_create_tables.sql     # SQL migration file
├── scripts/
│   ├── seed.js                       # JavaScript seed script
│   └── seed.ts                       # TypeScript seed script
└── package.json                      # Contains 'npm run seed' command
```

## Clearing Data

To clear all data from the tables without dropping them:

```bash
npm run seed
```

The seed script automatically clears existing data before seeding. Alternatively, you can manually run DELETE statements in the Supabase SQL Editor.

## Next Steps

- Use the Supabase client in your application to query this data
- Implement Row Level Security (RLS) policies for data access control
- Set up real-time subscriptions if needed
- Create indexes for frequently queried columns (already done)

## Troubleshooting

**Error: Missing environment variables**

- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in `.env.local`

**Error: Tables don't exist**

- Run the migration file: Copy and paste `supabase/migrations/001_create_tables.sql` into Supabase SQL Editor

**Permission denied errors**

- Use the Service Role Key (not the publishable key) in `SUPABASE_SERVICE_ROLE_KEY`

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
