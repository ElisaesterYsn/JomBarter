# Jom Barter

A community marketplace where users exchange items or services without necessarily using money.

## Project Structure

```
jom-barter/
├── frontend/          # Vue 3 + Vite frontend application
├── backend/           # NestJS + TypeScript backend API
├── database/          # Database migrations and configurations
├── docs/              # Project documentation
└── README.md
```

## Technology Stack

### Frontend
- **Framework**: Vue 3 + Vite
- **UI**: Tailwind CSS + Flowbite/Flowbite-Vue
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios

### Backend
- **Framework**: NestJS + TypeScript
- **Authentication**: JWT + bcrypt/argon2
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.IO/NestJS WebSocket Gateway
- **Testing**: Jest + Supertest

### Database
- **Database**: Microsoft SQL Server
- **ORM**: Prisma (preferred) or TypeORM

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Microsoft SQL Server
- Git

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```

## Core Product Flow
Register → Create Listing → Discover Listing → Offer Trade → Chat/Negotiate → Accept Trade → Complete Exchange → Review

## MVP Development Phases
1. ✅ **Project Setup** - Repository structure, environment configuration
2. **Authentication** - Registration, login, JWT authentication
3. **User Profile** - Profile management, avatars, basic statistics
4. **Categories** - Listing categories management
5. **Listings CRUD** - Create, view, edit, delete listings
6. **Browse & Search** - Search, filters, sorting, pagination
7. **Trade Offers** - Propose, accept, reject trade offers
8. **Chat** - Real-time messaging between users
9. **Trade Completion** - Complete trade workflow
10. **Reviews** - Rating and review system
11. **Notifications** - System notifications
12. **Reports** - Content moderation
13. **Admin Dashboard** - Administrative interface

## License
Private project for development purposes.