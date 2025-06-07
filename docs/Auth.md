
---

🔐 Authentication API Documentation

Base URL: https://baseUrl/api/auth


---

🔓 Register a New User

POST /register

Create a new user account (e.g., student or general user).

📤 Request Body

{
  "username": "johndoe",
  "firstName": "John",
  "otherNames": "Doe",
  "password": "securePassword123"
}

✅ Response 201 Created

{ "message": "Account created successfully" }

❌ Errors

400: Invalid input

409: Username already taken

500: Internal server error



---

🔐 User Login

POST /signin

Authenticate using username or matric number and password.

📤 Request Body

{
  "identifier": "johndoe",  // or matric number
  "password": "securePassword123"
}

✅ Response 200 OK

{
  "token": "JWT_TOKEN",
  "user": {
    "id": "userId",
    "role": "student"
  }
}

❌ Errors

401: Invalid credentials

500: Internal server error



---

🧾 Generate Invitation Code (for Admin/Superuser Use)

POST /generate-invitation-code

Generates an invitation token to elevate a user’s role.

🔐 Auth: Super Admin Required

📤 Request Body

{
  "userId": "6431bcxyz7890"
}

✅ Response 201 Created

{
  "token": "INVITE_TOKEN",
  "expiresIn": "10m"
}

❌ Errors

400: Invalid input

403: Unauthorized or user not eligible

500: Internal server error



---

🧾 Accept Invitation Token

POST /accept-invitation

Accept and apply an invitation code to become an Admin.

📤 Request Body

{
  "userId": "6431bcxyz7890",
  "token": "INVITE_TOKEN"
}

✅ Response 200 OK

{ "message": "Admin privilege granted" }

❌ Errors

400: Invalid input

403: Unauthorized or expired code

500: Internal server error



---
