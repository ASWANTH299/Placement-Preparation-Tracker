Product Requirements Document (PRD)
Placement Preparation Tracker

Version 1.0
Status Draft
Last Updated March 2026
Owner Product Team

1. Overview
1.1 Product Name

Placement Preparation Tracker

1.2 Problem Statement

Students preparing for technical placements often use multiple disconnected resources such as coding platforms, notes, spreadsheets, and practice trackers. This fragmented workflow leads to

Lack of visibility into preparation progress

Poor study consistency

Difficulty organizing learning materials

No centralized way to track interview readiness

There is a need for a single platform that helps students structure, monitor, and improve their placement preparation process.

1.3 Solution

Placement Preparation Tracker is a full-stack web platform that enables students to organize their placement preparation through

Structured learning paths

Progress tracking

Daily study streaks

Company-specific interview preparation

Mock interview tracking

Resume management

The platform also provides administrative tools to manage users, learning resources, and system analytics.

2. Goals and Non-Goals
2.1 Goals

The system aims to

Provide a centralized preparation platform for technical placements

Help students track learning progress across core topics

Improve preparation discipline through study streaks

Organize company-specific interview questions

Enable administrators to manage learning resources and users

Provide performance insights through leaderboards and analytics

2.2 Non-Goals

The following features are out of scope for version 1.0

AI-based preparation recommendations

Integration with external coding platforms

Online code execution or coding judge systems

Social media integrations

3. Target Users
3.1 Primary Users – Students

Students preparing for campus placements or technical interviews.

User Goals

Track preparation progress

Practice company-specific interview questions

Maintain consistent study habits

Record mock interview performance

Manage resumes and professional profiles

3.2 Secondary Users – Administrators

Administrators manage the system and ensure the platform runs efficiently.

Admin Responsibilities

Manage student accounts

Maintain learning resources

Manage question banks

Monitor platform analytics

4. User Stories
Student

As a student, I want to register and log in so that I can access the platform.

As a student, I want to view my preparation progress so that I understand my readiness level.

As a student, I want to follow a structured learning path so that I know what to study next.

As a student, I want to maintain study streaks so that I stay consistent in preparation.

As a student, I want to track mock interviews so that I can evaluate my performance.

As a student, I want to store notes so that I can review concepts later.

As a student, I want to upload my resume so that I can manage job application materials.

Admin

As an admin, I want to manage users so that the system remains organized.

As an admin, I want to manage learning paths so that students follow structured preparation.

As an admin, I want to manage company question datasets.

As an admin, I want to view system analytics to understand platform usage.

5. Product Scope
In Scope

The system includes the following features

User authentication

Student dashboard

Learning path management

Company question bank

Study streak tracking

Mock interview tracking

Resume management

Notes system

Coding profile tracking

Leaderboard

Admin dashboard

Out of Scope

AI recommendations

Third-party API integrations

Online code judge

Social features

6. System Architecture

The platform follows a three-tier architecture.

Frontend (React + Vite)
        ↓
Backend API (Node.js + Express)
        ↓
Database (MongoDB)
Components
Layer	Technology
Frontend	React, Vite, React Router
Backend	Node.js, Express.js
Database	MongoDB with Mongoose
Authentication	JWT
Security	bcrypt
7. User Roles and Permissions
7.1 Student Role

Students can perform the following actions

Register and login

View dashboard

Track learning progress

Access learning paths

Practice company questions

Track study streaks

Record mock interviews

Upload resumes

Create and manage notes

View leaderboard

7.2 Admin Role

Administrators have extended privileges

View all users

Create users

Update user profiles

Delete users

Manage learning paths

Manage company questions

View system analytics

Configure platform settings

8. Functional Requirements
8.1 Authentication System
Description

Provides secure access to the platform.

Features

User registration

User login

Admin login

Password reset

Security

Password hashing using bcrypt

JWT token-based authentication

Protected admin routes

8.2 Student Dashboard

The dashboard acts as the main control panel.

Displays

Learning progress

Study streak

Recent activities

Quick navigation to preparation tools

8.3 Learning Path System

Provides a structured roadmap for preparation.

Example roadmap

Week	Topic
1	Arrays
2	Linked Lists
3	Trees
4	Graphs

Students follow this roadmap to maintain a consistent study plan.

8.4 Company Question Tracker

Students can practice interview questions categorized by

Company

Topic

Difficulty level

Example companies

Amazon

Google

Microsoft

TCS

Infosys

8.5 Study Streak System

Tracks daily preparation consistency.

Logic

If a student studies on consecutive days

Streak increases

If a day is missed

Streak resets

Example

🔥 5 Day Study Streak

8.6 Leaderboard

Displays top-performing students.

Ranking Criteria

Progress percentage

Questions solved

Mock interview scores

Example ranking

Rahul – 95%

Priya – 90%

Ankit – 88%

8.7 Mock Interview Tracker

Students can record mock interview details.

Data Recorded

Company

Interview date

Score

Feedback

Example

Company Amazon
Score 810
Feedback Strong algorithm knowledge

8.8 Resume Tracker

Students can manage resumes.

Features

Upload resume

Update resume

Download resume

Additional fields

GitHub profile

LinkedIn profile

Portfolio link

8.9 Notes System

Students can store preparation notes.

Features

Create note

Edit note

Delete note

8.10 Coding Profile Tracker

Students can link coding platform profiles.

Examples

LeetCode

CodeChef

HackerRank

Codeforces

9. Admin Dashboard

The admin dashboard allows system monitoring and management.

9.1 User Management

Admins can

View all users

Create users

Edit users

Delete users

9.2 Learning Path Management

Admins can

Add learning topics

Update roadmap

Delete outdated content

9.3 Company Question Management

Admins can

Add questions

Update questions

Remove questions

9.4 System Analytics

Admin dashboard shows

Total users

Active users

Average progress

System usage metrics

10. Database Design
Users
_id
name
email
password
role
created_at
LearningPaths
_id
week
topic
description
CompanyQuestions
_id
company
topic
difficulty
question
StudyActivity
_id
user_id
date
MockInterviews
_id
user_id
company
score
feedback
date
Resumes
_id
user_id
file_path
upload_date
Notes
_id
user_id
title
content
created_at
11. Frontend Routes
Student Routes
login
register
dashboard
profile
learning-path
company-questions
study-streak
leaderboard
mock-interviews
resume-tracker
notes
Admin Routes
admin-dashboard
admin-users
admin-learning-path
admin-company-questions
12. Non-Functional Requirements
Performance

Page load time  2 seconds

Optimized database queries

Security

bcrypt password hashing

JWT authentication

Protected admin routes

Reliability

Target uptime 99%

Scalability

System should support

1000+ users

Scalable database architecture

13. Deployment Strategy
Deployment Pipeline
GitHub Repository
        ↓
Docker Containerization
        ↓
Cloud Deployment
Deployment Components

React Frontend

Node.js Backend

MongoDB Database

Possible deployment options

Vercel (Frontend)

Docker containers

MongoDB Atlas

14. Monitoring and Logging

System logs include

User login events

Admin actions

System errors

Logs are stored on the backend server.

15. Environment Configuration

The system uses environment-based configuration management.

Environment Variables

Examples

PORT
MONGODB_URI
JWT_SECRET
EMAIL_USER
EMAIL_PASSWORD
NODE_ENV
.env File

Used for local development.

Example

PORT=5000
MONGODB_URI=mongodblocalhost27017placement_tracker
JWT_SECRET=secret_key
NODE_ENV=development

The .env file must not be committed to Git.

.env.example

Repository must include

PORT=
MONGODB_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASSWORD=
NODE_ENV=
16. Success Metrics

The platform will be considered successful if

Students actively track preparation progress

Daily study streak engagement increases

Mock interview performance improves

Admins can monitor usage effectively

17. Risks

Potential risks include

Data security vulnerabilities

Improper password handling

Database scaling limitations

Low user engagement

Mitigation strategies include

Strong authentication practices

Monitoring and logging

Scalable cloud infrastructure

18. Acceptance Criteria

The system will be considered complete when

Users can register and login

Dashboard displays preparation progress

Learning path roadmap is accessible

Study streak system works correctly

Leaderboard ranks users

Mock interviews can be recorded

Resumes can be uploaded

Admin can manage users and questions