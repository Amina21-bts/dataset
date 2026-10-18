# Supabase Auth App

This project is a simple authentication application built with React and TypeScript that connects to a Supabase database for user authentication. It includes a login page and a registration page, both utilizing the Supabase client for handling user sessions.

## Features

- User registration
- User login
- Integration with Supabase for authentication
- Responsive design

## Project Structure

```
supabase-auth-app
├── src
│   ├── components
│   │   └── AuthForm.tsx
│   ├── lib
│   │   └── supabase.ts
│   ├── pages
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd supabase-auth-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Rename `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_PUBLIC_KEY=<your-supabase-public-key>
   ```

4. **Run the application:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Usage

- Navigate to the login page to log in with existing credentials.
- Navigate to the registration page to create a new account.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.