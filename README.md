# elevateHub

A collaborative knowledge-sharing platform built with Django and React, where users can help each other, share resources, and earn credits for their contributions.

## Features

- **Help Requests**: Create and respond to help requests with chat and video call support
- **Discussions**: Engage in topic-based discussions and upvote helpful posts
- **Resources**: Share and download educational resources
- **Credit System**: Earn credits by helping others and spend them to get help
- **Real-time Notifications**: Stay updated with WebSocket-based notifications
- **User Authentication**: Secure user authentication and authorization

## Tech Stack

### Backend
- Django
- Django REST Framework
- Django Channels (WebSocket support)
- Redis (for WebSocket layer)

### Frontend
- React
- Redux
- WebSocket client
- WebRTC

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- Redis

### Backend Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
elevateHub/
├── backend/                 # Django backend
│   ├── api/                # API configuration
│   ├── credits/            # Credit system
│   ├── discussions/        # Discussion features
│   ├── projects/           # Help requests and video calls
│   ├── resources/          # Resource sharing
│   └── manage.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   └── package.json
└── README.md
```

## Key Features in Detail

### Help Requests
- Create help requests with credit offers
- Chat with helpers in real-time
- Start video calls for more interactive help
- Earn credits by helping others

### Discussions
- Create and participate in topic-based discussions
- Upvote helpful posts
- Earn credits for quality contributions
- Real-time updates for new posts

### Resources
- Upload and share educational resources
- Download resources shared by others
- Earn credits when your resources are downloaded
- Support for multiple file types

### Credit System
- Earn credits by:
  - Helping others via chat or video
  - Getting upvotes on your posts
  - Having your resources downloaded
- Spend credits to:
  - Get help from others
  - Access premium resources
