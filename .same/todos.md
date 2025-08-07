# Onlinekonto Development TODOs

## 🚀 CURRENT TASK: BENUTZERPROFIL ERWEITERN

### 🔄 IN PROGRESS - User Profile Extension
- [ ] Extend Prisma schema with address data, KYC status, account number
- [ ] Create and run database migration
- [ ] Update User types and interfaces
- [ ] Modify user creation to generate alphanumeric account numbers
- [ ] Update UserModal with new fields
- [ ] Extend profile page with new information
- [ ] Update API endpoints to handle new fields
- [ ] Update seed data with extended user information

### ✅ COMPLETED Database Integration
- [x] Install and configure Prisma ORM
- [x] Set up SQLite database schema
- [x] Create database models (User, FestgeldAnlage, Transaktion)
- [x] Implement database migrations
- [x] Create API routes for database operations
- [x] Add database seeding for demo data
- [x] Update authentication to use database
- [x] Implement proper password hashing
- [x] Basic API integration in frontend components

### ✅ COMPLETED CRUD Functions & API Endpoints
- [x] Add individual user API endpoints (GET by ID, UPDATE, DELETE)
- [x] Add individual anlage API endpoints (GET by ID, UPDATE, DELETE)
- [x] Complete admin benutzer page CRUD functionality
- [x] Complete admin anlagen page CRUD functionality
- [x] Add user creation/edit modals
- [x] Add anlage creation/edit modals
- [x] Implement confirmation dialogs for delete operations
- [x] Add proper type safety for all API endpoints

### ✅ COMPLETED UI Components
- [x] UserModal with form validation and password handling
- [x] AnlageModal with calculation and validation
- [x] DeleteConfirmationModal with safety checks
- [x] Success/error notifications for all operations
- [x] Integration with admin pages

### ✅ COMPLETED System Fixes
- [x] Fixed redirect loop issue with proper navigation
- [x] Fixed corrupted database and reseeded with demo data
- [x] Fixed all TypeScript errors and most ESLint warnings
- [x] Full CRUD operations working with real database

### 🎯 NEW FIELDS TO ADD
- [ ] Adressdaten: Straße, PLZ, Stadt, Land
- [ ] Referenzkonto: IBAN für Überweisungen
- [ ] KYC Status: Verifizierungsstatus (pending, verified, rejected)
- [ ] Kontonummer: Alphanumerische Kennung (OK-2025-001, etc.)
- [ ] User-ID: Buchstaben und Zahlen statt nur Zahlen

## 📈 CURRENT STATUS
The system is fully functional with complete CRUD operations and real database backend. Now extending user profiles with comprehensive banking information.
