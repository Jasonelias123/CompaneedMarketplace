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

- **July 16, 2025**: Created comprehensive messaging system with AI-powered consultant intake
  - Built messaging-dashboard.html with dual-tab interface for consultant chats and AI intake sessions
  - Implemented real-time messaging system with consultant availability status (online, away, offline)
  - Created AI chatbot that conducts structured consultant interviews replacing traditional forms
  - AI intake covers: experience, specialties, tools, industries, rates, availability, motivation
  - messaging-dashboard.css provides modern chat UI with responsive design and smooth animations
  - messaging-dashboard.js includes Firebase integration with mock data for comprehensive testing
  - Direct consultant messaging with simulated responses and conversation history
  - Created test-messaging-system.html for feature overview and testing instructions
- **July 16, 2025**: Created comprehensive consultant dashboard for approved AI experts
  - Built consultant-dashboard.html with modern tabbed interface (Overview, Profile, Projects, Earnings)
  - Implemented consultant-dashboard.js with Firebase integration for data management
  - Added consultant-dashboard.css with responsive design matching site aesthetic
  - Dashboard features: project history tracking, earnings analytics, profile management, performance metrics
  - Authentication required: only approved consultants (role: 'developer', status: 'approved') can access
  - Real-time data loading from Firestore collections: users, projects with assignedConsultant field
  - Created test-consultant-dashboard.html for development and testing documentation
- **July 14, 2025**: Modern landing page redesign with premium SaaS aesthetic inspired by Linear, Vercel, and Notion
  - Completely rebuilt HTML structure with semantic sections and modern navigation
  - Created new CSS system with comprehensive design tokens and responsive grid layouts
  - Implemented sleek dashboard mockup visualization showing AI matching flow
  - Added smooth animations, floating background shapes, and gradient effects
  - Built sticky navigation with backdrop blur and mobile hamburger menu
  - Updated typography to Inter font with proper weight hierarchy
  - Enhanced accessibility with focus states, ARIA labels, and keyboard navigation
  - Changed "Why Companeeds?" subtitle to "We've done the vetting for you" per user feedback
- **July 13, 2025**: Complete landing page redesign with modern SaaS aesthetic
  - Created premium design inspired by Linear, Vercel, and Notion
  - Implemented sticky navigation with backdrop blur and smooth animations
  - Built sleek dashboard mockup visual showing AI matching flow
  - Added floating background shapes and gradients for modern tech feel
  - Enhanced typography with Inter font and improved spacing
  - Created comprehensive responsive design for all screen sizes
  - Added smooth animations, hover effects, and accessibility features
  - Updated color palette to modern purple/blue with professional grays
  - Implemented intersection observer animations and performance optimizations
- **June 28, 2025**: Enhanced user experience with data transfer between forms
  - Added localStorage data transfer from intake forms to signup forms
  - Company intake data (name, email, company) automatically pre-fills signup form
  - AI talent intake data (name, email, location) automatically pre-fills signup form
  - Fixed all navigation links to use correct routes (index.html instead of index-new.html)
  - Updated "Companies" and "AI Talent" nav links to route to respective intake forms
  - Updated homepage title to emphasize "the most trusted AI talent for your company"
  - Added "Why Companeeds?" section explaining AI tool vetting and cross-industry expertise
  - Improved hero section typography with cleaner brand/tagline separation
  - Added comprehensive mobile responsiveness for all sections and typography
  - Updated floating AI network nodes to show business benefits: "Automate Lead Generation", "Reduce Staff Costs", "Eliminate Repetitive Tasks"
  - Enhanced AI talent intake form with comprehensive business-focused questions: value proposition, sample projects, testimonials, measurable value, industries, and company revenue sizes
- **June 27, 2025**: Updated both company and AI consultant signup flows
  - Changed company flow: Homepage → Company Intake → Company Signup → Thank You (intake form now comes first)
  - Changed AI consultant flow: Homepage → AI Talent Intake → AI Talent Signup → Developer Pending
  - Made "For AI Consultants" and "For Companies" cards identical in size using CSS grid layout
  - Fixed "Apply as AI Consultant" button styling to match "Get Matched Now" button (same font size, padding, colors)
  - Resolved white-on-white text visibility issue with proper button styling
  - Both cards now have consistent purple borders, white backgrounds, and matching button appearances
  - Temporarily removed "Meet Our AI Experts" section (preserved in code comments for future restoration)
- **June 27, 2025**: Fixed AI consultant application flow and removed video upload requirement
  - Replaced video upload with simple "call availability" yes/no question to resolve persistent upload issues
  - Fixed routing from application submission to pending approval page
  - Updated pending page messaging to reflect AI consultant focus and direct matching model
  - Cleaned up all Firebase Storage references that were causing submission errors
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
  - Updated navigation flow: Homepage → Company Intake → Company Signup → Thank You
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