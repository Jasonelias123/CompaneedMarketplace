# Companeeds Platform Testing Checklist

## 🏠 Homepage & Navigation
- [ ] Homepage loads correctly (/)
- [ ] "Get Started" button scrolls to role selection
- [ ] "Get Started as Company" redirects to signup with company role
- [ ] "Get Started as Developer" redirects to signup with developer role
- [ ] "Sign In" link redirects to login page
- [ ] Admin link works
- [ ] Responsive design on mobile/tablet

## 🔐 Authentication System
- [ ] Company signup works (signup.html)
- [ ] Developer signup works (signup.html)
- [ ] User roles are correctly saved to Firebase
- [ ] Login redirects company users to dashboard-new.html
- [ ] Login redirects developer users to projects.html
- [ ] Logout functionality works
- [ ] Authentication protection on protected pages
- [ ] Auto role recovery for existing accounts without roles

## 🏢 Company Dashboard (dashboard-new.html)
- [ ] Dashboard loads after company login
- [ ] Project posting form displays correctly
- [ ] All form fields work: title, description, category, skills, budget, deadline, NDA
- [ ] Budget accepts large amounts (up to $99,999,999)
- [ ] Date picker works for deadline
- [ ] Form validation shows appropriate errors
- [ ] Project submission creates entry in Firebase
- [ ] Success message displays after submission
- [ ] "My Projects" tab shows posted projects
- [ ] "Applications" tab shows developer applications
- [ ] Messages link works

## 👨‍💻 Developer Interface (projects.html)
- [ ] Projects page loads after developer login
- [ ] All projects display correctly
- [ ] Project filtering/search works
- [ ] Project application system works
- [ ] Application form submits correctly
- [ ] Applied projects show in developer's view

## 💬 Messaging System (messages.html)
- [ ] Messages page loads
- [ ] Conversation list displays
- [ ] Message sending works
- [ ] Contact information filtering active (emails, phones, links blocked)
- [ ] Real-time message updates
- [ ] Secure communication between parties

## 👨‍💼 Admin Panel (admin.html)
- [ ] Admin panel loads for authorized user (jasonegustaf@gmail.com)
- [ ] Project approval/rejection system works
- [ ] User management functions work
- [ ] Platform statistics display correctly

## 🛠 Technical Infrastructure
- [ ] Firebase connection stable
- [ ] Database read/write operations work
- [ ] Error handling displays user-friendly messages
- [ ] Console shows no critical JavaScript errors
- [ ] All CSS/styling loads correctly
- [ ] Mobile responsive design
- [ ] Fast page load times

## 🔄 Complete User Flows
- [ ] Company registration → project posting → receiving applications
- [ ] Developer registration → browsing projects → applying
- [ ] Project approval workflow (admin → company → developer)
- [ ] End-to-end messaging between company and developer
- [ ] Contract completion workflow

## 🎯 Sample Data Testing
- [ ] Sample projects can be added via /add-sample-data.html
- [ ] Sample projects display correctly in projects listing
- [ ] Sample projects accept applications
- [ ] Sample data matches realistic project requirements

## 🔒 Security & Data Protection
- [ ] User sessions persist correctly
- [ ] Unauthorized access blocked on protected pages
- [ ] Contact information properly filtered in messages
- [ ] NDA requirements respected
- [ ] User data privacy maintained