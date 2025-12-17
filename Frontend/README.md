# Chat App Frontend

A modern, real-time chat application built with React, Vite, and Socket.IO.

## Features

- 💬 Real-time messaging
- 👥 Active user list
- ⌨️ Typing indicators
- 🎨 Beautiful, modern UI with gradients and animations
- 📱 Responsive design
- 🔌 WebSocket connection with auto-reconnect

## Setup

### Prerequisites

- Node.js 16+ and npm
- Backend server running on `http://localhost:5000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Configuration

The frontend is configured to connect to the backend at `http://localhost:5000`. You can change this in `src/App.jsx`:

```javascript
const SOCKET_URL = 'http://localhost:5000';
```

## Project Structure

```
Frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Component styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Usage

1. Enter your username on the login screen
2. Click "Join Chat" to enter the chat room
3. Type messages in the input field and press Enter or click Send
4. See other users in the sidebar
5. Watch typing indicators when others are typing

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for REST API calls
- **CSS3** - Modern styling with gradients and animations
