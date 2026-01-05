# Note App IDCamp

A full-stack note-taking application built with modern web technologies.

## Live Demo

Check out the live application at [https://notekeep.up.railway.app/](https://notekeep.up.railway.app/)

## Features

- User authentication (register/login)
- Create, read, update, and delete notes
- Real-time note management
- Responsive web interface
- Firebase Firestore integration for data persistence

## Tech Stack

- **Backend**: ElysiaJS (Bun runtime)
- **Database**: Firebase Firestore
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Build Tool**: Bun

## Prerequisites

- Bun (latest version)
- Firebase project with Firestore enabled

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd note-app-idcamp
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database
   - Update the Firebase config in `src/index.ts` if needed

## Usage

### Development

Run the development server:

```bash
bun run dev
```

The app will be available at `http://localhost:3000`

### Production Build

Build the application:

```bash
bun run build
```

Start the production server:

```bash
bun run start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user

  - Body: `{ "email": "string", "password": "string" }`

- `POST /api/auth/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

### Notes

- `GET /api/notes?userId=<userId>` - Get all notes for a user

- `POST /api/notes` - Create a new note

  - Body: `{ "title": "string", "content": "string", "userId": "string" }`

- `PUT /api/notes/:id` - Update a note

  - Body: `{ "title": "string", "content": "string" }`

- `DELETE /api/notes/:id` - Delete a note

### Health Check

- `GET /api/health` - Check server and database status

## Project Structure

```
note-app-idcamp/
├── public/
│   ├── index.html
│   ├── global.css
│   └── script.js
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md
```
