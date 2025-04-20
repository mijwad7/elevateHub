# ElevateHub

**ElevateHub** is a collaborative knowledge-sharing platform built with **Django** and **React**, designed to bring together learners, educators, and professionals in a unique, credit-based ecosystem. The idea was born from a simple observation: many online learners hit roadblocks—whether they're coding beginners, students tackling tough subjects, or self-learners diving into complex projects—and they often have no one to turn to for *direct*, personalized help unless they pay for expensive services.

ElevateHub changes that.

Instead of relying on paid consultations or long forum threads, users can reach out directly to others in the community for **one-to-one expert help**, in real-time. Whether it's a bug in their code, confusion in a concept, or simply needing feedback on their work, ElevateHub makes it easy to get help—**without spending money**.

### 🔧 How it Works:
- Users earn **credits** by helping others—answering questions, providing resources, or joining live chats.
- These credits can then be spent when they themselves need assistance.
- It's a give-and-take system that encourages a **community-driven support network**.
- Features include **real-time chat**, **resource sharing**, **discussion boards**, and an upcoming **notification system**.

### 💡 The Innovation:
- ElevateHub isn't just another Q&A site. It's designed to feel **more like mentorship** and **less like a forum**.
- It supports **real conversations**, not just comment threads.
- It enables **mutual growth**, where users are both learners and contributors.
- It reduces the **barrier of cost** for students and hobbyists who need quality help but can't afford it.

### 🎯 Target Audience:
- Self-taught programmers, designers, editors and the like
- Students working on assignments or projects
- Online course learners needing real-world guidance
- Hobbyists building passion projects
- Anyone stuck and needing a **helping hand**, not just a search result

ElevateHub is built to make sure **no one has to learn alone**. It brings people together in a way that's fair, community-driven, and empowering for everyone involved.

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

### Environment Configuration

Create `.env` files in both backend and frontend directories with the following configurations:

#### Backend (.env)
```bash
# Django settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings
DATABASE_URL=postgres://user:password@localhost:5432/elevatehub

# Redis settings (for WebSocket)
REDIS_URL=redis://localhost:6379/0

# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# WebRTC settings
WEBRTC_STUN_SERVER=stun:stun.l.google.com:19302
WEBRTC_TURN_SERVER=turn:your-turn-server.com:3478
WEBRTC_TURN_USERNAME=your-turn-username
WEBRTC_TURN_CREDENTIAL=your-turn-password
```

#### Frontend (.env)
```bash
# API settings
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# WebRTC settings
VITE_WEBRTC_STUN_SERVER=stun:stun.l.google.com:19302
VITE_WEBRTC_TURN_SERVER=turn:your-turn-server.com:3478
VITE_WEBRTC_TURN_USERNAME=your-turn-username
VITE_WEBRTC_TURN_CREDENTIAL=your-turn-password
```

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
│   │   └── store/         # Redux store
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
