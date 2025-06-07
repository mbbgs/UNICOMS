
---

🧾 Tickets API Documentation

Base URL: https://<baseUrl>/api/tickets


---

🔐 Authentication

Most routes require Super Admin bearer token

Students can create tickets with login token



---

🆕 Create a Support Ticket

POST /api/tickets

Creates a new ticket for a student.

🔐 Auth: Bearer Token (Login Required)

📤 Request Body (JSON)

{
  "title": "Exam not visible",
  "description": "I cannot see the exam scheduled for today.",
  "studentId": "stu12345",
  "course": "CSE101",
  "exam": "midterm1",
  "priority": "urgent",
  "type": "exam_issue"
}

✅ Success Response 201 Created

{
  "message": "Ticket created successfully",
  "ticketId": "tkt456"
}

❌ Error Responses

400 Bad Request: Missing fields or validation failed

404 Not Found: Student not found

500 Internal Server Error



---

📋 Get All Tickets

GET /api/tickets

Fetches all support tickets (for admins).

🔐 Auth: Bearer Token (Super Admin)

✅ Response 200 OK

[
  {
    "id": "tkt456",
    "title": "Exam not visible",
    "status": "open",
    "priority": "urgent",
    "studentId": "stu12345"
  },
  ...
]

❌ Error Responses

500 Internal Server Error



---

🔍 Get Ticket by ID

GET /api/tickets/{id}

Fetch a single support ticket by its ID.

🔐 Auth: Bearer Token (Super Admin)

✅ Response 200 OK

{
  "id": "tkt456",
  "title": "Exam not visible",
  "description": "I cannot see the exam scheduled for today.",
  "status": "open",
  "priority": "urgent",
  "studentId": "stu12345",
  "response": null
}

❌ Error Responses

400 Bad Request: Invalid ID

404 Not Found: Ticket does not exist

500 Internal Server Error



---

✏️ Update a Ticket

PATCH /api/tickets/{id}

Update ticket fields (status, response, etc.).

🔐 Auth: Bearer Token (Super Admin)

📤 Request Body (partial allowed)

{
  "status": "in_progress",
  "response": "We are investigating the issue."
}

✅ Response 200 OK

{
  "message": "Ticket updated successfully"
}

❌ Error Responses

400 Bad Request: Invalid fields

404 Not Found: Ticket not found

500 Internal Server Error



---

❌ Delete a Ticket

DELETE /api/tickets/{id}

Permanently deletes a ticket.

🔐 Auth: Bearer Token (Super Admin)

✅ Response 200 OK

{
  "message": "Ticket deleted successfully"
}

❌ Error Responses

400 Bad Request: Invalid ID format

404 Not Found: Ticket does not exist

500 Internal Server Error



---