# Overview

GirlFanz is an adult content creator platform built as a React + Express fullstack application. The platform enables female content creators to connect with fans, monetize their content, and manage their digital presence through a cyber-glam themed interface. The application features real-time messaging, content management, payment processing, moderation tools, and comprehensive creator analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side navigation without the overhead of React Router
- **State Management**: TanStack Query (React Query) for server state management, eliminating the need for complex state management libraries
- **UI Components**: Radix UI primitives providing accessible, unstyled components with custom styling via Tailwind CSS
- **Styling**: Tailwind CSS with a custom GirlFanz brand theme featuring cyber-glam aesthetics (pink, violet, cyan color palette)
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules for modern JavaScript features
- **Framework**: Express.js with comprehensive security middleware (Helmet, rate limiting, CSRF protection)
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **Real-time Communication**: WebSocket server for live messaging and notifications
- **Authentication**: Dual system supporting both Replit OAuth (for development) and local JWT-based authentication
- **Security**: Multiple layers including rate limiting, CORS, content security policies, and request validation

## Database Design
- **Primary Database**: PostgreSQL for relational data with ACID compliance
- **ORM**: Drizzle ORM with type-safe database operations and schema management
- **Schema Structure**: Comprehensive data model including users, profiles, media assets, messages, moderation queue, payout systems, and audit logging
- **Session Management**: Database-backed sessions for secure authentication state

## File Storage
- **Object Storage**: Google Cloud Storage integration for media files and content
- **File Upload**: Uppy dashboard for user-friendly file upload experience with progress tracking
- **Access Control**: Custom ACL (Access Control List) system for content permissions and subscriber-only access
- **Media Processing**: Automated content moderation pipeline with approval workflows

## Development Environment
- **Package Manager**: npm with workspace support for monorepo structure
- **Development Server**: Vite dev server with hot module replacement and Express API proxy
- **Code Quality**: TypeScript for type safety, ESLint for code standards
- **Build Process**: Separate builds for client (Vite) and server (esbuild) with production optimizations

# External Dependencies

## Cloud Services
- **Google Cloud Storage**: Object storage for media files, user content, and static assets
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and backup
- **Replit Infrastructure**: Development environment, authentication provider, and deployment platform

## Authentication & Security
- **Replit OAuth**: Primary authentication for development environment with OIDC compliance
- **Passport.js**: Authentication middleware for session management and OAuth flows
- **Express Session**: Session storage with PostgreSQL backend for persistence

## Payment Processing
- **Adult-friendly Payment Processors**: Integration ready for specialized payment providers that support adult content monetization
- **Payout System**: Database schema prepared for creator earnings, tips, and subscription revenue tracking

## UI & Component Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **Uppy**: File upload library with dashboard interface for media management
- **Tailwind CSS**: Utility-first CSS framework with custom GirlFanz brand configuration

## Development Tools
- **Vite Plugins**: Runtime error overlay, dev banner, and cartographer for enhanced development experience
- **TypeScript**: Full stack type safety with shared types between client and server
- **Drizzle Kit**: Database schema management and migration tools

## Real-time Features
- **WebSocket (ws)**: Native WebSocket implementation for real-time messaging and live features
- **Server-Sent Events**: Prepared for push notifications and real-time updates

## Content Management
- **Content Moderation**: Automated and manual moderation workflows for user-generated content
- **Media Processing**: Image and video handling with watermarking capabilities
- **Analytics**: Creator dashboard with earnings, engagement, and performance metrics