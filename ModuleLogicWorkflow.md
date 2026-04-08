# Placement Analytics System - Module Logic / Workflow Report

This report describes the implemented module workflows in a structured format.

## 4.1 Student Profile & Skill Management Module

4.1.1 Student logs in using valid credentials  
4.1.2 System validates user and role as Student  
4.1.3 Student profile is fetched from database  
4.1.4 Academic details are shown (branch, CGPA, year, etc.)  
4.1.5 Student updates skills  
4.1.6 Student updates interested domain/field  
4.1.7 Updated profile data is saved in database  
4.1.8 Role-based checks ensure student-only access to student profile APIs

## 4.2 Admin Management Module

4.2.1 TPO logs in as Main TPO or Branch TPO  
4.2.2 System validates TPO role and opens role-specific dashboard  

4.2.3 Main TPO workflow:
- View dashboard analytics and reports
- Open placement dashboard
- View leaderboard
- Manage TPO records (create/update/delete)
- Manage company records (create/update/delete)
- Manage domain/job role records (create/update/delete)

4.2.4 Branch TPO workflow:
- Open branch-level placement dashboard
- Manage students (create/update/delete)
- Upload students CSV
- Manage placement records (create/update/delete)
- Upload placement records CSV

4.2.5 Access control rules:
- Student cannot access TPO/admin routes
- Main TPO has global management permissions
- Branch TPO has branch-scoped operational permissions

## 4.3 Placement Trend Analysis Module

4.3.1 Student opens Placement Trends page  
4.3.2 System fetches year-wise placement data  
4.3.3 Year-wise line chart is rendered  
4.3.4 Year-wise table is displayed  
4.3.5 Placement percentage is calculated from placed vs total values  
4.3.6 System fetches branch-wise data for selected year  
4.3.7 Branch-wise bar chart is rendered  
4.3.8 Year dropdown updates branch chart data dynamically  
4.3.9 Branch comparison (placed vs total) is shown per branch

## 4.4 Skill Demand Analysis Module

4.4.1 Student opens Skill Demand page  
4.4.2 System fetches eligible domains based on student branch  
4.4.3 Domain list is shown to student  
4.4.4 Student selects a domain  
4.4.5 System fetches role-wise required skills for that domain  
4.4.6 Student selects a job role for deeper insights  
4.4.7 System displays placement insights for selected job role

## 4.5 Skill Gap Analysis & Micro Action Plan Module

4.5.1 Student opens Skill Gap page  
4.5.2 System compares student profile skills with role/domain requirements  
4.5.3 Missing skills are identified  
4.5.4 Readiness percentage is computed and displayed  
4.5.5 Student selects a job role and requests a micro action plan  
4.5.6 System generates personalized action plan based on missing and known skills  
4.5.7 If no role is selected, validation error is returned

## 4.6 Placement Prediction & Company Compatibility Module

4.6.1 Student opens Placement Prediction page  
4.6.2 System fetches student data and prediction inputs  
4.6.3 Placement prediction score/probability is generated  
4.6.4 Best-fit domain is identified  
4.6.5 Domain-wise probability breakdown is shown  
4.6.6 Compatible companies are listed for best-fit domain  
4.6.7 If prediction service fails, user-friendly error is shown

## Notes

- Authentication and authorization are role-based across modules.
- Data updates are persisted through backend APIs and reflected in UI.
- Analytics and prediction outputs are advisory and support decision-making.
