📘 Exams API Documentation

Base URL: https://<baseUrl>/api/exams

🔐 Authentication

All routes except GET / and POST /submit require SuperAdmin authentication via Bearer Token.


---

📌 Create an Exam

POST /api/exams

Creates a new exam.

🔐 Auth: Bearer Token (SuperAdmin)

🔸 Request Body

{
  "date": "2025-06-12",
  "startTime": "09:00", //  datetime 
  "endTime": "11:00", // datetime 
  "departmentCode": "CSE",
  "courseTitle": "Data Structures",
  "courseCode": "CSE201",
  "level": "200",
  "questions": [
    {
      "questionText": "What is a stack?",
      "options": ["Queue", "Stack", "Array", "List"],
      "answer": "Stack"
    }
  ]
}

✅ Success Response 201 Created

{
  "message": "Exam created successfully",
  "examId": "abc123"
}

❌ Error Responses

400 Bad Request: Missing required fields

409 Conflict: Exam already exists

500 Internal Server Error



---

📤 Submit an Exam

POST /api/exams/submit

Submits a student’s exam attempt.

🔐 Auth: Bearer Token (Student)

🔸 Request Body

{
  "examId": "abc123",
  "answers": [
    {
      "questionId": "q1",
      "selected": "Stack"
    }
  ]
}

✅ Success Response 200 OK

{
  "message": "Submission successful"
}

❌ Error Responses

400 Bad Request: Missing examId or answers

401 Unauthorized: Invalid or missing token

403 Forbidden: Exam not started or already ended

404 Not Found: Exam not found

409 Conflict: Already submitted

500 Internal Server Error



---

📥 Get an Exam

GET /api/exams?date=2025-06-12&code=CSE&courseTitle=Data%20Structures

Retrieves a specific exam by date, department code, and course title.

🔐 Auth: Bearer Token (Student)

✅ Success Response 200 OK

{
  "exam": {
    "courseTitle": "Data Structures",
    "courseCode": "CSE201",
    "questions": [...]
  }
}

❌ Error Responses

400 Bad Request: Missing query params

403 Forbidden: Exam not active

404 Not Found: Exam not found

500 Internal Server Error



---

➕ Add Department to Exam

POST /api/exams/add-department

Adds another department to an existing exam.

🔐 Auth: Bearer Token (SuperAdmin)

🔸 Request Body

{
  "date": "2025-06-12",
  "code": "EEE",
  "courseTitle": "Data Structures"
}

✅ Success Response 200 OK

{
  "message": "Department added"
}

❌ Error Responses

400 Bad Request: Invalid/missing fields

409 Conflict: Department already added

500 Internal Server Error



---

➖ Remove Department from Exam

POST /api/exams/remove-department

Removes a department from an exam.

🔐 Auth: Bearer Token (SuperAdmin)

🔸 Request Body

{
  "date": "2025-06-12",
  "code": "EEE",
  "courseTitle": "Data Structures"
}

✅ Success Response 200 OK

{
  "message": "Department removed"
}

❌ Error Responses

400 Bad Request: Invalid/missing fields

409 Conflict: Department not associated with this exam

500 Internal Server Error

---