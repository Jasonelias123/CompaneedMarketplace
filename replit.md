# Companeeds - AI Talent Platform

## Overview

Companeeds is a premium AI talent matching platform positioned as "Toptal for AI" that directly connects companies with vetted AI consultants. Rather than a project marketplace, the platform uses intelligent matching to pair companies with the right AI experts based on their specific needs and consultant expertise.

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

### Direct Matching System
- **Company Intake**: Companies provide detailed requirements through comprehensive intake forms
- **AI Consultant Vetting**: Rigorous application and approval process for consultants
- **Intelligent Matching**: Algorithm matches companies with suitable consultants based on needs/expertise
- **Direct Introductions**: Platform facilitates direct connections between matched parties

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

### Matching Lifecycle
1. Company completes signup and detailed intake form
2. Company requirements saved to Firestore `companies` collection
3. Admin reviews suitable AI consultants based on company needs
4. Direct introductions made between matched company and consultant(s)
5. Communication facilitated through platform messaging system
6. Project execution happens directly between matched parties

### Communication Flow
1. Successful matches initiate conversation threads
2. Messages stored in Firestore with real-time listeners
3. Contact information automatically filtered from message content
4. Both parties can communicate within platform boundaries until project completion

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
- `companies`: Company requirements and intake form data
- `consultants`: AI consultant profiles and expertise data
- `matches`: Successful company-consultant pairings
- `messages`: Communication threads between matched parties
- `adminActions`: Administrative logging and matching decisions

## Recent Changes

- **June 27, 2025**: Platform model shift from project marketplace to direct matching service
  - Changed from project posting/browsing to intelligent company-consultant matching
  - Updated architecture to focus on intake forms and direct introductions
  - Removed project management features in favor of matching algorithm
  - Repositioned as premium talent matching service like Toptal
  - Removed work type preferences from consultant intake (no longer needed for direct matching)
- **June 26, 2025**: Complete UI transformation to "Toptal for AI" positioning with Beon.tech-inspired design
  - Created new index-new.html with side-by-side hero layout, clean white background, and modern typography
  - Redesigned 3-step value proposition: "Tell Us About Your Business", "Get Matched", "See Results"
  - Built comprehensive company-intake.html form with AI-focused questions and Firebase integration
  - Added thank-you.html with Beon.tech-style confirmation flow and next steps
  - New styles-beon.css with Inter font, purple/violet accents, clean grid layouts, and smooth animations
  - Updated messaging to emphasize "Companeeds = Toptal for AI" with 48-hour matching promise
  - Added fixed navigation with "Get Matched" CTA and beta pricing disclosure ($75/month after launch)
  - Created company-signup.html with username/password registration and terms checkboxes
  - Updated navigation flow: Homepage → Company Signup → Company Intake → Thank You
  - Fixed role selection cards to properly route companies and AI consultants to respective forms
- **June 25, 2025**: Comprehensive AI Talent rebranding and intake form redesign
  - Updated all UI references from "Developer" to "AI Talent" or "AI Consultant"
  - Created new streamlined AI talent intake form (ai-talent-intake.html) with updated messaging
  - Form emphasizes "real solutions, not experiments" and "high-intent clients"
  - Simplified form fields: Full Name, Email, Location, AI Tools/Stacks, Project Types, Bio, Portfolio, Work Preferences, Availability
  - Removed complex checkbox grids in favor of textarea inputs for better user experience
  - Updated routing to use new AI talent signup flow
  - Maintained all existing Firebase functionality and video submission requirements
- **June 24, 2025**: Major platform upgrade to premium marketplace features - Phase 2 Complete
  - ✓ Comprehensive company vetting system with intake forms and verification badges
  - ✓ Smart tech stack selector with organized categories for precise project matching
  - ✓ Enhanced project posting with timeline, urgency, and milestone payment options
  - ✓ Legal terms integration with detailed Terms of Use modal and compliance
  - ✓ Secure messaging system with real-time chat, content filtering, and conversation management
  - ✓ Two-way ratings and reviews system with detailed criteria and public/private options
  - ✓ Advanced filtering system for projects with tech stack, budget, urgency, and company verification filters
  - ✓ Mobile-responsive design across all new interfaces
  - ✓ Automatic conversation creation when developers apply to projects
- **June 24, 2025**: Added developer pending approval page and improved signup flow
  - Created two-step developer signup: account creation then detailed application
  - Built pending approval page where developers can browse projects but not apply
  - Added automatic status checking and redirects based on approval status
  - Video submission now required (not optional) for all developer applications
  - Improved authentication flow to prevent routing issues
- **June 24, 2025**: Added comprehensive developer signup form with vetting system
  - Multi-section application form with basic info, skills, AI experience, and professional conduct
  - URL validation for LinkedIn, GitHub, and portfolio links
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