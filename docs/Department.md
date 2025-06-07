
---

🏛️ Departments API Documentation

Base URL: https://<baseUrl>/api/departments


---

🔐 Authentication

Admin permission required for creating, updating, and modifying courses in departments

No authentication required for public department fetching



---

➕ Create Department

POST /api/departments

Creates a new department.

🔐 Auth: Admin

📤 Request Body

{
  "faculty": "Engineering",
  "name": "Computer Engineering",
  "code": "CPE",
  "totalUnitLimit": 160,
  "coursesPerLevel": {
    "100lvl": [
      { "title": "Intro to Programming", "code": "CPE101" }
    ]
  }
}

✅ Response 201 Created

{ "message": "Department created successfully" }

❌ Errors

400: Validation failed

500: Internal server error



---

📚 Get All Departments

GET /api/departments

Returns all departments.

✅ Response 200 OK

[
  {
    "code": "CPE",
    "name": "Computer Engineering",
    "faculty": "Engineering"
  }
]

❌ Errors

404: No departments found

500: Internal server error



---

🔍 Get Department by Code

GET /api/departments/{code}

Returns a department by its unique code.

✅ Response 200 OK

{
  "code": "CPE",
  "name": "Computer Engineering",
  "faculty": "Engineering",
  "coursesPerLevel": {
    "100lvl": [
      { "title": "Intro to Programming", "code": "CPE101" }
    ]
  }
}

❌ Errors

404: Department not found

500: Internal server error



---

✏️ Update Department

PUT /api/departments

Updates a department's details.

🔐 Auth: Admin

📤 Request Body (Partial Allowed)

{
  "code": "CPE",
  "name": "Computer Engr",
  "faculty": "Engineering",
  "coursesPerLevel": {
    "200lvl": [
      { "title": "Digital Logic", "code": "CPE204" }
    ]
  }
}

✅ Response 200 OK

{ "message": "Department updated" }

❌ Errors

404: Department not found

500: Internal server error



---

➕ Add Course to Level

POST /api/departments/course?code={deptCode}&level={level}

Adds a course to a specific level of a department.

🔐 Auth: Admin

📤 Request Body

{
  "title": "Signals & Systems",
  "code": "CPE203"
}

✅ Response 201 Created

{ "message": "Course added successfully" }

❌ Errors

400: Invalid input

404: Department or level not found

500: Internal server error



---

❌ Remove Course from Level

DELETE /api/departments/course/{code}/{level}

Removes a course from a department level.

🔐 Auth: Admin

📤 Request Body

{
  "courseCode": "CPE203"
}

✅ Response 200 OK

{ "message": "Course removed successfully" }

❌ Errors

404: Course or department not found

500: Internal server error



---
