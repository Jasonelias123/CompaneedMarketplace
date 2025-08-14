# Companeeds - AI Talent Platform

## Overview

Companeeds is a premium AI talent matching platform, positioned as "Toptal for AI," that directly connects companies with vetted AI consultants. Its main purpose is to intelligently match companies with the right AI experts based on specific needs and consultant expertise, focusing on direct introductions rather than a project marketplace. The platform aims to facilitate seamless connections and communication to drive successful AI project outcomes.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Perfect symmetry is mandatory - exact visual balance required in all sections.
Royal purple styling: Four individual content boxes (Vetted AI Technologies, Proven Results, Done For You, Reality Reprogrammed) must have royal purple backgrounds with white text and glossy premium effects.
Content highlighting: Strategic purple bold highlighting applied to key value propositions throughout sections including "trust", "go", "actually work", "boost revenue", "save time", "focus", "effortless", "guaranteed", "most powerful", "rigorously", "customized", "measurable outcomes", "implementation", "transform", "business operates".
Brand logos: Comprehensive trusted brands section featuring 20 specific logos from prestigious companies including Netflix, UPS, NBA, Headspace, Stryker, Equinox, and others using exact CDN URLs.

## System Architecture

### Frontend Architecture
- **Static Web Application**: Built with pure HTML, CSS, and vanilla JavaScript.
- **Module-based JavaScript**: ES6 modules are used for code organization.
- **Client-side Routing**: Employs simple page-based navigation.
- **Responsive Design**: Mobile-first CSS with modern layout techniques ensures adaptability across devices.
- **UI/UX Decisions**: Incorporates a clean, premium SaaS aesthetic inspired by platforms like Toptal, Linear, Vercel, and Notion. Key design elements include a purple/indigo theme (#6366f1), Inter font family, sleek dashboard mockups visualizing the AI matching flow, smooth animations, floating background shapes, gradients, and a sticky navigation with backdrop blur. Interactive button-based questions and progressive form steps enhance user experience.

### Backend Architecture
- **Firebase Backend-as-a-Service**: Utilizes Firebase for a complete serverless backend.
- **Firebase Authentication**: Manages user authentication and authorization, supporting multi-role authentication (company and developer) with role-based redirects and session management.
- **Cloud Firestore**: Serves as the NoSQL document database for all application data, including user profiles, company requirements, consultant profiles, matches, and messages.
- **Python HTTP Server**: Used for serving static files during development.

### Key Features
- **Direct Matching System**: Companies provide detailed requirements through comprehensive intake forms. Rigorous vetting processes are applied to AI consultants. An intelligent algorithm matches companies with suitable consultants, facilitating direct introductions.
- **Messaging System**: Provides secure, in-platform communication between companies and developers. It filters contact information from messages and offers real-time updates using Firestore listeners. It includes a dual-tab interface for consultant chats and AI intake sessions, along with an AI chatbot for structured interviews.
- **Admin Panel**: Allows administrators to review and approve/reject projects, manage users, and control content to maintain platform quality. This includes comprehensive dashboards for reviewing intake submissions, managing matches, and tracking project outcomes.
- **Consultant Dashboard**: A dedicated dashboard for approved AI experts to manage their profiles, view project history, track earnings, and monitor performance metrics.

## External Dependencies

### Firebase Services
- **Firebase Authentication**: For user login and session management.
- **Cloud Firestore**: The primary database for all application data.
- **Firebase Hosting**: For static site hosting and deployment.

### Development Tools
- **Python HTTP Server**: Used as a local development server.
- **Replit Environment**: The cloud development platform.

### Frontend Libraries
- **Firebase Web SDK**: Integrated via CDN for client-side Firebase functionality.
- **Google Fonts**: Specifically, the Inter font family for typography.