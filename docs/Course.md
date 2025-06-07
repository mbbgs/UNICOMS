
---

📘 Course Registration API Documentation

Base URL: https://<baseUrl>/api/course


---

🔐 Authentication

GET /department-courses — Public

All other routes — Require Student Login



---

📤 Get Department Courses

POST /department-courses

Fetch available courses for a specific department and level.

🔓 Public

📤 Request Body

{
  "level": "100lvl",
  "faculty": "Engineering",
  "code": "CPE"
}

✅ Response 200 OK

{
  "courses": [
    { "title": "Intro to Programming", "code": "CPE101", "unit": 3 },
    { "title": "Algebra", "code": "MTH101", "unit": 2 }
  ]
}

❌ Errors

400: Missing/invalid input

404: Department or level not found

500: Internal server error



---

📝 Register Courses

POST /register

Registers selected courses for the logged-in student.

🔐 Auth: Student Login Required

📤 Request Body

{
  "courses": ["CPE101", "MTH101"]
}

✅ Response 200 OK

{ "message": "Courses registered successfully" }

❌ Errors

400: Invalid input or unit limit exceeded

401: Unauthorized

404: Student or course(s) not found

500: Internal server error



---

➕ Add to Registered Courses

POST /update-registered

Adds more courses to the current registration (e.g., carryovers).

🔐 Auth: Student Login Required

📤 Request Body

{
  "coursesToAdd": [
    "PHY102",
    {
      "courseCode": "MTH103",
      "isCarryOver": true
    }
  ]
}

✅ Response 200 OK

{ "message": "Courses updated successfully" }

❌ Errors

400: Invalid input or unit constraints violated

401: Unauthorized

404: Student or course(s) not found

500: Internal server error



---