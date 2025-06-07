
---

📘 Students API Documentation

Base URL: https://<baseUrl>/api/students

🔐 Authentication

Routes require Admin permission via Bearer Token (Authorization: Bearer <token>)

GET / only requires login



---

👤 Add a New Student

POST /api/students

Adds a single student manually.

🔐 Auth: Bearer Token (Admin)

🔸 Request Body (JSON)

{
  "name": "John Doe",
  "faculty": "Engineering",
  "email": "john.doe@example.com",
  "password": "StrongPass123!",
  "matric": "ENG123456",
  "departmentCode": "CSE"
}

✅ Success Response 201 Created

{
  "message": "Student created successfully",
  "studentId": "abc123"
}

❌ Error Responses

400 Bad Request: Validation error

409 Conflict: Email or matric already exists

500 Internal Server Error



---

📂 Bulk Upload Students via CSV

POST /api/students/csv

Upload a .csv file containing multiple students.

🔐 Auth: Bearer Token (Admin)

🔸 Content Type: multipart/form-data

Form Field:

file (CSV file)


📁 CSV Example

name,email,password,faculty,matric,departmentCode
Jane Doe,jane.doe@example.com,Pass123,Engineering,ENG123457,CSE
John Smith,john.smith@example.com,Pass456,Science,SCI654321,PHY

✅ Success Response 201 Created

{
  "message": "Students added successfully",
  "count": 2
}

❌ Error Responses

400 Bad Request: Invalid/missing file, duplicate entries

500 Internal Server Error



---

🔍 Get a Student by ID

GET /api/students?studentId=abc123

Fetches a student by their unique ID.

🔐 Auth: Bearer Token (Any logged-in user)

✅ Success Response 200 OK

{
  "student": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "faculty": "Engineering",
    "matric": "ENG123456",
    "departmentCode": "CSE"
  }
}

❌ Error Responses

400 Bad Request: Missing or invalid ID

404 Not Found: Student does not exist

500 Internal Server Error



---