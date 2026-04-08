# Test Cases

## 4.1 Student Profile & Skill Management Module

| ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC01 | Student secure login | Student enters correct email and password | Login success; dashboard opens |
| TC02 | Invalid login | Student enters wrong email or password | Login fails; invalid-credentials message shown |
| TC03 | Auto-fetch academic details | Student opens profile after login | Profile fields (branch, CGPA, year) are shown |
| TC04 | Update student skills | Student edits skills and clicks save | Skills saved and visible after refresh |
| TC05 | Update interested domain | Student changes interested domain and saves | Interested domain saved and displayed |
| TC06 | Unauthorized role blocked from student profile APIs | TPO/Admin tries to open student profile page | Access denied with permission message |

## 4.2 Admin Management Module

| ID | Scenario | Input | Expected Output |
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

| ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC25 | Year-wise placement line chart load | Student opens placement trends page | Year-wise line chart loads with data |
| TC26 | Year-wise table percentage check | Student checks year-wise table values | Percentage matches placed vs total |
| TC27 | Branch-wise section year selector | Student changes year from dropdown | Branch chart updates to selected year |
| TC28 | Branch-wise bar chart render | Student views branch chart for selected year | Branch-wise bar chart loads |
| TC29 | Branch-wise bar values (Placed vs Total) | Student compares placed and total bars | Placed and total bars compare correctly |

## 4.4 Skill Demand Analysis Module

| ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC30 | Load domain-wise roles by branch | Student opens skill demand page | Branch-specific domain list loads |
| TC31 | View skills for selected domain | Student clicks one domain | Domain skills and roles load |
| TC32 | Placement insights for selected job role | Student selects a job role | Job-role placement insights load |

## 4.5 Skill Gap Analysis & Micro Action Plan Module

| ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC33 | Domain-wise skill gap analysis | Student opens skill gap page | Skill gap analysis loads |
| TC34 | Missing skills identification | Student has some skills missing for a role | Missing skills list appears |
| TC35 | Readiness percentage display | Student checks readiness shown on screen | Readiness percentage is shown |
| TC36 | Generate micro action plan | Student selects a role and clicks generate plan | Personalized action plan is generated |
| TC37 | Generate micro plan without selecting role | Student clicks generate without choosing role | Validation error is shown |

## 4.6 Placement Prediction & Company Compatibility Module

| ID | Scenario | Input | Expected Output |
|---|---|---|---|
| TC38 | Predict placement probability | Student opens placement prediction page | Overall prediction score is generated |
| TC39 | Show best domain and domains probabilities | Student views prediction result section | Best domain and domain probabilities are shown |
| TC40 | Show compatible companies for best domain | Student checks recommended companies list | Compatible companies list loads |
| TC41 | Prediction API failure handling | Prediction page fails to load student prediction | Friendly error message is shown |
