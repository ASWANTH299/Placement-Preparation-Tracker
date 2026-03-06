# Placement Preparation Tracker – Debugging & Fix Requirements

Project Type
Full Stack Web Application

Stack
Frontend: React + Vite + Tailwind
Backend: Node.js + Express
Database: MongoDB with Mongoose

Authentication
JWT + bcrypt

File Upload
multer with local storage

--------------------------------------------------

# Architecture Decisions (Do Not Change)

1. Database must remain MongoDB with Mongoose.

2. Authentication must use JWT and bcrypt.

3. Tailwind CSS is already installed but UI must be redesigned.

4. Resume files must be stored locally using multer.

5. Each user can upload a maximum of 5 resumes.

6. Each resume file size must not exceed 5MB.

7. Allowed resume formats:
PDF
DOCX

8. If a user already has 5 resumes:
show error message

"Maximum 5 resumes allowed. Delete an old resume before uploading a new one."

9. Online code execution systems are NOT required for v1.0.

10. Practice page can include Run and Submit buttons but they should NOT execute code.

11. Learning roadmap must NOT use week-based structure.

12. Learning topics must all be accessible immediately.

13. Topic completion logic:
A topic becomes completed when all problems in that topic are marked completed.

14. Admin accounts will be inserted manually into the database.

15. Existing features must be fixed and extended, not rewritten unnecessarily.

--------------------------------------------------

# Functional Issues

The following problems currently exist in the application and must be fixed.

--------------------------------------------------

## 1 Learning Journey Section

Current UI incorrectly shows progress by default.

Example displayed:

Your Learning Journey  
2/6 weeks completed • 38h remaining

Problems

• Progress is hardcoded  
• Topics are not clickable  
• No learning content  
• No problems in topics  
• No progress tracking  

Required Fix

Remove the week system.

Replace with topic-based learning roadmap.

Example topics

Arrays  
Linked Lists  
Stacks  
Queues  
Trees  
Binary Search Trees  
Heaps  
Graphs  
Dynamic Programming  
Greedy Algorithms  
Recursion  
Backtracking  
Trie  
Segment Trees  
Bit Manipulation  
Sliding Window  
Two Pointer Technique  
Binary Search  
System Design Basics  
Concurrency Basics  

Behavior

Clicking a topic opens

/learning-path/:topicId

Topic page must contain

• topic explanation  
• Java syntax examples  
• pseudocode explanation  
• 5–10 coding problems  

Each problem must contain

• problem description  
• pseudocode  
• Java solution  

Add checkbox

Mark as Completed

When all problems are completed

→ topic becomes completed  
→ learning progress updates automatically  

--------------------------------------------------

## 2 Interview Question Bank

Current table

Question | Company | Topic | Difficulty

Two Sum | Amazon | Arrays | Easy  
LRU Cache | Google | Design | Hard  
Merge Intervals | Meta | Arrays | Medium  

Problems

• Clicking a question does nothing  
• Too few questions  

Required Fix

Store questions in MongoDB.

Add 15–20 interview questions.

Clicking a question must open

/questions/:questionId

Question page must include

• full problem statement  
• input/output examples  
• explanation  
• pseudocode  
• Java solution  
• time complexity  
• space complexity  

Example questions

Two Sum  
Longest Substring Without Repeating Characters  
Valid Parentheses  
Merge Intervals  
Binary Tree Level Order Traversal  
LRU Cache  
Detect Cycle in Linked List  
Kth Largest Element  
Number of Islands  
Course Schedule  
Top K Frequent Elements  
Climbing Stairs  
Coin Change  
Word Ladder  
Minimum Window Substring  

--------------------------------------------------

## 3 Practice Button

Problem

Practice button currently does nothing.

Required Fix

Clicking Practice must open

/practice/:questionId

Practice interface must contain

• problem description panel  
• code editor  
• language selector (Java default)  
• run button  
• submit button  
• sample test cases  

Important

Run and Submit buttons should NOT execute code in v1.0.

They can simulate output or store user solution.

--------------------------------------------------

## 4 Resume Management

Problem

Uploading resume returns Internal Server Error.

Required Fix

Implement complete resume management.

Features

• upload resume  
• view uploaded resumes  
• delete resume  
• download resume  

Constraints

• maximum 5 resumes per user  
• file size ≤ 5MB  
• allowed formats: PDF, DOCX  

Files must be stored using multer in local storage.

--------------------------------------------------

## 5 Study Notes

Current UI shows notes such as

Sliding Window Patterns  
Graph Traversal Cheatsheet  

Problem

Clicking notes does nothing.

Required Fix

Click note → open full note page

Route

/notes/:noteId

Each note must contain

• concept explanation  
• pseudocode  
• Java examples  

Add 15–20 DSA topics.

Example topics

Arrays  
Linked Lists  
Stacks  
Queues  
Sliding Window  
Two Pointer Technique  
Binary Search  
Recursion  
Backtracking  
Trees  
Binary Search Trees  
Heaps  
Graphs  
Dynamic Programming  
Greedy Algorithms  
Trie  
Segment Trees  
Bit Manipulation  
System Design Basics  
Concurrency Basics  

--------------------------------------------------

## 6 Coding Profiles

Current UI

LeetCode  
CodeChef  
HackerRank  
Codeforces  

Problem

Profiles cannot be opened.

Required Fix

User enters username or profile URL.

Save profile link in database.

Clicking platform name must open the profile in a new browser tab.

Examples

LeetCode → https://leetcode.com/username  
CodeChef → https://codechef.com/users/username  
HackerRank → https://hackerrank.com/username  
Codeforces → https://codeforces.com/profile/username  

--------------------------------------------------

## 7 UI / UX Problems

Current UI quality is poor.

Required improvements

• modern dashboard layout  
• card based UI  
• Tailwind responsive design  
• hover effects  
• button animations  
• loading animations  
• better spacing and typography  
• dark mode support  
• smooth page transitions  

--------------------------------------------------

## 8 User Profile

Profile settings page missing.

Required Fix

Create profile page

/profile

Features

• change name  
• change email  
• upload profile picture  
• save profile  
• view progress statistics  
• completed topics  
• completed problems






