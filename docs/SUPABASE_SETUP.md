# Supabase Setup Documentation

## Overview
This document contains comprehensive setup instructions for the Supabase service used in the `dynamic-exercise-pal` project. It outlines the database schema, tables, row-level security (RLS) policies, and setup instructions.

## Database Schema
The database schema is designed to manage various entities related to dynamic exercise features. Below is the schema definition:

### Tables

1. **Users**  
   * `id`: UUID, primary key  
   * `username`: VARCHAR, unique user identifier  
   * `email`: VARCHAR, unique user email address  
   * `created_at`: TIMESTAMP, creation date  

2. **Exercises**  
   * `id`: UUID, primary key  
   * `name`: VARCHAR, name of the exercise  
   * `description`: TEXT, description of the exercise  
   * `created_at`: TIMESTAMP, creation date  

3. **User_Exercises**  
   * `id`: UUID, primary key  
   * `user_id`: UUID, reference to `Users.id`  
   * `exercise_id`: UUID, reference to `Exercises.id`  
   * `created_at`: TIMESTAMP, creation date  

### Row-Level Security Policies
Row-Level Security (RLS) can be enabled on tables to enforce access control at the row level. Below are the example policies:

1. **Users Table**  
   * **Policy Name**: `user_access`  
   * **Definition**: Users can access their own records only.  
   * **SQL**:  
     ```sql  
     CREATE POLICY user_access ON users  
     FOR SELECT  
     USING (id = auth.uid());  
     ```  

2. **User_Exercises Table**  
   * **Policy Name**: `user_exercise_access`  
   * **Definition**: Users can access their exercises only.  
   * **SQL**:  
     ```sql  
     CREATE POLICY user_exercise_access ON user_exercises  
     FOR SELECT  
     USING (user_id = auth.uid());  
     ```  

## Setup Instructions
Follow the steps below to set up Supabase for the `dynamic-exercise-pal` project:

1. **Create a Supabase Account**: Visit the [Supabase website](https://supabase.io/) and create an account.
2. **Create a New Project**: After logging in, select ‘New Project’ and provide the necessary details.
3. **Configure Database**: Once the project is created, navigate to the 'Database' section to configure your tables according to the schema above.
4. **Enable RLS**: In the 'Policies' tab of each relevant table (e.g., Users, User_Exercises), enable Row-Level Security and apply the policies defined above.
5. **Connect to Your Application**: Utilize the Supabase client library in your application to connect and interact with the database.

## Conclusion
This document serves as a guide for setting up Supabase for your project needs. Ensure to test thoroughly after the setup to confirm policies are working as intended.
