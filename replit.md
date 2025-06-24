# Companeeds - AI Talent Platform

## Overview

Companeeds is a web-based platform that connects companies with AI developers for project collaboration. The platform enables companies to post AI projects and developers to browse and apply for opportunities, with all communication happening within the secure platform environment.

## System Architecture

### Frontend Architecture
- **Static Web Application**: Pure HTML, CSS, and vanilla JavaScript
- **Module-based JavaScript**: ES6 modules for code organization
- **Client-side Routing**: Simple page-based navigation without SPA framework
- **Responsive Design**: Mobile-first CSS with modern layout techniques

### Backend Architecture
- **Firebase Backend-as-a-Service**: Complete serverless backend solution
- **Firebase Authentication**: User authentication and authorization
- **Cloud Firestore**: NoSQL document database for data storage
- **Python HTTP Server**: Simple static file server for development

## Key Components

### Authentication System
- **Multi-role Authentication**: Support for company and developer user types
- **Role-based Redirects**: Automatic routing based on user role after login
- **Session Management**: Firebase Auth handles authentication state
- **Admin Access Control**: Special admin privileges for platform moderation

### Project Management
- **Project Posting**: Companies can create detailed project listings
- **Project Browsing**: Developers can view and filter available projects
- **Application System**: Developers can apply to projects with proposals
- **Status Tracking**: Projects have lifecycle states (open, in progress, closed)

### Messaging System
- **In-platform Communication**: Secure messaging between companies and developers
- **Contact Information Protection**: Email addresses and phone numbers are filtered from messages
- **Real-time Updates**: Live message synchronization using Firestore listeners

### Admin Panel
- **Project Moderation**: Admin can review and approve/reject projects
- **User Management**: Overview of platform activity and user statistics
- **Content Control**: Ensure platform quality and safety standards

## Data Flow

### User Registration and Authentication
1. User selects role (company/developer) on signup page
2. Firebase Auth creates user account
3. User role and metadata stored in Firestore `users` collection
4. Role-based redirect to appropriate dashboard

### Project Lifecycle
1. Company posts project through dashboard form
2. Project data saved to Firestore `projects` collection
3. Admin reviews project (pending → approved/rejected)
4. Approved projects appear in developer project browser
5. Developers submit applications through project modal
6. Applications stored as subcollection under project document

### Communication Flow
1. Project applications initiate conversation threads
2. Messages stored in Firestore with real-time listeners
3. Contact information automatically filtered from message content
4. Both parties can communicate within platform boundaries

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User login and session management
- **Cloud Firestore**: Primary database for all application data
- **Firebase Hosting**: (Ready for deployment)

### Development Tools
- **Python HTTP Server**: Local development server
- **Replit Environment**: Cloud development platform with PostgreSQL support

### Frontend Libraries
- **Firebase Web SDK v10.7.1**: Loaded via CDN for client-side Firebase integration
- **Google Fonts**: Inter font family for typography
- **Modern CSS**: CSS Grid, Flexbox, and custom properties for styling

## Deployment Strategy

### Development Environment
- **Replit-based Development**: Cloud IDE with integrated database support
- **Python Server**: Simple HTTP server for static file serving
- **Environment Variables**: Firebase configuration through Replit secrets
- **Port Configuration**: Port 5000 for main application, Port 5001 reserved

### Production Considerations
- **Firebase Hosting**: Static site hosting with global CDN
- **Custom Domain**: Ready for custom domain configuration
- **SSL/HTTPS**: Automatic SSL certificate management
- **Scalability**: Serverless architecture scales automatically

### Database Architecture
The application uses Firebase Firestore with the following collections:

- `users`: User profiles and role information
- `projects`: Project listings with metadata and status
- `applications`: Developer applications as subcollections under projects
- `messages`: Communication threads between users
- `adminProjects`: Administrative logging and moderation

## Recent Changes

- **June 24, 2025**: Added comprehensive developer signup form with vetting system
  - Multi-section application form with basic info, skills, AI experience, and professional conduct
  - URL validation for LinkedIn, GitHub, and portfolio links
  - Video submission support (optional) with 50MB file size limit
  - Admin dashboard integration for reviewing developer applications
  - Automatic status tracking (pending, approved, rejected)
  - Email notifications to admin when new applications are submitted
- **June 23, 2025**: Added proposed pricing feature with budget analytics
  - Required price input field in developer application forms
  - Budget comparison showing posted budget vs proposed prices
  - Average pricing analytics across all applications per project
  - Color-coded pricing indicators (under/over budget)
  - Enhanced company dashboard with pricing insights
- **June 23, 2025**: Added file upload functionality for developer applications
  - Pitch deck uploads (PDF, PowerPoint, Keynote)
  - Supporting data files (CSV, Excel, JSON)  
  - File validation and size limits (10MB max)
  - Visual file previews with remove functionality
  - Enhanced status messages for upload progress
- **June 23, 2025**: Fixed application submission system with proper Firebase imports
- **June 23, 2025**: Created projects-new.html and projects-fixed.js to resolve caching issues
- **June 23, 2025**: Fixed homepage navigation buttons for role selection
- **June 23, 2025**: Added logout functionality to both dashboard and projects pages
- **June 23, 2025**: Updated authentication redirects to use new projects page

## User Preferences

Preferred communication style: Simple, everyday language.