# Placement Analytics System - Modules Logic + Test Cases

This document combines module workflow logic and test cases in one report.

## 4.1 Student Profile & Skill Management Module

4.1.1 Student logs in using valid credentials  
4.1.2 System validates user and role as Student  
4.1.3 Student profile is fetched from database  
4.1.4 Academic details are shown (branch, CGPA, year, etc.)  
4.1.5 Student updates skills  
4.1.6 Student updates interested domain/field  
4.1.7 Updated profile data is saved in database  
4.1.8 Role-based checks ensure student-only access to student profile APIs

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC01 | Student secure login | Student enters correct email and password | Login success; dashboard opens |
| TC02 | Invalid login | Student enters wrong email or password | Login fails; invalid-credentials message shown |
| TC03 | Auto-fetch academic details | Student opens profile after login | Profile fields (branch, CGPA, year) are shown |
| TC04 | Update student skills | Student edits skills and clicks save | Skills saved and visible after refresh |
| TC05 | Update interested domain | Student changes interested domain and saves | Interested domain saved and displayed |
| TC06 | Unauthorized role blocked from student profile APIs | TPO/Admin tries to open student profile page | Access denied with permission message |

## 4.2 Admin Management Module

4.2.1 TPO logs in as Main TPO or Branch TPO  
4.2.2 System validates TPO role and opens role-specific dashboard  
4.2.3 Main TPO views dashboard analytics and reports  
4.2.4 Main TPO opens placement dashboard and leaderboard  
4.2.5 Main TPO manages TPO accounts (create/update/delete)  
4.2.6 Main TPO manages company records (create/update/delete)  
4.2.7 Main TPO manages job role/domain records (create/update/delete)  
4.2.8 Branch TPO opens branch-level placement dashboard  
4.2.9 Branch TPO manages students (create/update/delete + CSV upload)  
4.2.10 Branch TPO manages placement records (create/update/delete + CSV upload)  
4.2.11 Student role is blocked from TPO/admin routes

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC07 | TPO secure login | Main TPO or Branch TPO enters correct login details | Login success; TPO dashboard opens |
| TC08 | Student blocked from TPO routes | Student tries to open TPO pages | Access blocked; redirected from TPO pages |
| TC09 | MAIN_TPO : dashboard | Main TPO opens dashboard page | Summary cards and analytics are visible |
| TC10 | MAIN_TPO : placement dashboard page | Main TPO opens placement dashboard page | Placement table and filters are visible |
| TC11 | MAIN_TPO : leaderboard | Main TPO opens leaderboard page | Leaderboard list loads |
| TC12 | MAIN_TPO : manage TPO list | Main TPO opens manage TPO page | TPO records load |
| TC13 | MAIN_TPO create/update/delete TPO | Main TPO adds, edits, or deletes a TPO | TPO change saved successfully |
| TC14 | MAIN_TPO : manage company | Main TPO opens manage company page | Company records load |
| TC15 | MAIN_TPO add/update/delete company | Main TPO adds, edits, or deletes company details | Company change saved successfully |
| TC16 | MAIN_TPO : manage job role | Main TPO opens manage job role page | Job role records load |
| TC17 | MAIN_TPO add/update/delete job role | Main TPO adds, edits, or deletes a job role | Job role change saved successfully |
| TC18 | BRANCH_TPO : placement dashboard page | Branch TPO opens placement dashboard page | Branch placement dashboard loads |
| TC19 | BRANCH_TPO : manage students list | Branch TPO opens manage students page | Branch students list loads |
| TC20 | BRANCH_TPO add/update/delete student | Branch TPO adds, edits, or deletes a student | Student change saved successfully |
| TC21 | BRANCH_TPO students CSV upload | Branch TPO uploads student CSV file | Student CSV imported; summary shown |
| TC22 | BRANCH_TPO : placement records list | Branch TPO opens placement records page | Placement records load |
| TC23 | BRANCH_TPO add/update/delete placement records | Branch TPO adds, edits, or deletes placement record | Placement record change saved successfully |
| TC24 | BRANCH_TPO placement records CSV upload | Branch TPO uploads placement records CSV file | Placement CSV imported; summary shown |

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

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC25 | Year-wise placement line chart load | Student opens placement trends page | Year-wise line chart loads with data |
| TC26 | Year-wise table percentage check | Student checks year-wise table values | Percentage matches placed vs total |
| TC27 | Branch-wise section year selector | Student changes year from dropdown | Branch chart updates to selected year |
| TC28 | Branch-wise bar chart render | Student views branch chart for selected year | Branch-wise bar chart loads |
| TC29 | Branch-wise bar values (Placed vs Total) | Student compares placed and total bars | Placed and total bars compare correctly |

## 4.4 Skill Demand Analysis Module

4.4.1 Student opens Skill Demand page  
4.4.2 System fetches eligible domains based on student branch  
4.4.3 Domain list is shown to student  
4.4.4 Student selects a domain  
4.4.5 System fetches role-wise required skills for that domain  
4.4.6 Student selects a job role for deeper insights  
4.4.7 System displays placement insights for selected job role

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC30 | Load domain-wise roles by branch | Student opens skill demand page | Branch-specific domain list loads |
| TC31 | View skills for selected domain | Student clicks one domain | Domain skills and roles load |
| TC32 | Placement insights for selected job role | Student selects a job role | Job-role placement insights load |

## 4.5 Skill Gap Analysis & Micro Action Plan Module

4.5.1 Student opens Skill Gap page  
4.5.2 System compares student profile skills with role/domain requirements  
4.5.3 Missing skills are identified  
4.5.4 Readiness percentage is computed and displayed  
4.5.5 Student selects a job role and requests a micro action plan  
4.5.6 System generates personalized action plan based on missing and known skills  
4.5.7 If no role is selected, validation error is returned

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC33 | Domain-wise skill gap analysis | Student opens skill gap page | Skill gap analysis loads |
| TC34 | Missing skills identification | Student has some skills missing for a role | Missing skills list appears |
| TC35 | Readiness percentage display | Student checks readiness shown on screen | Readiness percentage is shown |
| TC36 | Generate micro action plan | Student selects a role and clicks generate plan | Personalized action plan is generated |
| TC37 | Generate micro plan without selecting role | Student clicks generate without choosing role | Validation error is shown |

## 4.6 Placement Prediction & Company Compatibility Module

4.6.1 Student opens Placement Prediction page  
4.6.2 System fetches student data and prediction inputs  
4.6.3 Placement prediction score/probability is generated  
4.6.4 Best-fit domain is identified  
4.6.5 Domain-wise probability breakdown is shown  
4.6.6 Compatible companies are listed for best-fit domain  
4.6.7 If prediction service fails, user-friendly error is shown

Test Cases:

| TC ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC38 | Predict placement probability | Student opens placement prediction page | Overall prediction score is generated |
| TC39 | Show best domain and domains probabilities | Student views prediction result section | Best domain and domain probabilities are shown |
| TC40 | Show compatible companies for best domain | Student checks recommended companies list | Compatible companies list loads |
| TC41 | Prediction API failure handling | Prediction page fails to load student prediction | Friendly error message is shown |
