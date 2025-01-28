# LMS Backend Documentation

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT
- **File Handling**: Multer for Excel/CSV uploads
- **Security**: Helmet, CORS
- **Logging**: Winston, Morgan
- **API Testing**: Jest

## Features Implemented

### 1. Authentication & Authorization
- User registration with role-based access
- JWT-based authentication
- Role-based middleware (Admin/Instructor)
- Secure password hashing with bcrypt

### 2. Course Management (Admin)
- CRUD operations for courses
- Automatic unique course code generation
- Bulk teacher import via Excel/CSV
- Course instructor management
- Soft delete functionality

### 3. Notice Board System
- Course-specific announcements
- Notice view tracking
- Response system
- Unread notifications counter

### 4. Dashboard Analytics
- Total courses count
- Average teachers per course
- Gender distribution analytics
- Notice board engagement metrics
- Course-wise statistics

### 5. Instructor Features
- Course joining via code
- Notice board interaction
- Response management
- View tracking

## Not Implemented
### Average duration spent on LMS by teachers
Would require:
- Session tracking
- Login/logout timestamps
- Activity monitoring
- Analytics processing

## Technical Decisions

### Why Polling Over WebSockets
1. **Simplicity**
   - Easier implementation and maintenance
   - Simpler deployment architecture
   - Lower server resource usage

2. **Use Case Fit**
   - Notice updates aren't real-time critical
   - 30-second polling interval is sufficient
   - Reduces unnecessary connections

3. **Scalability**
   - Better horizontal scaling
   - Easier load balancing
   - More predictable server load

## API Structure

```javascript
router.get("/", (req, res) => {
  res.send("Hello World");
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/users", userRoutes);
router.use("/notices", noticeRoutes);
router.use("/dashboard", dashboardRoutes);
```

## Setup Instructions

### Clone & Install
```bash
git clone <repository-url>
cd lms-backend
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, etc.
```

### Database Setup
```bash
npx prisma migrate dev
npm run seed
```

### Start Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Routes

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Courses
- `GET /courses` - List all courses
- `POST /courses` - Create course (Admin)
- `PUT /courses/:id` - Update course (Admin)
- `DELETE /courses/:id` - Delete course (Admin)
- `POST /courses/upload-teachers` - Bulk add teachers (Admin)

### Notice Board
- `GET /notices/admin` - All notices (Admin)
- `POST /notices/admin/:courseId/new` - Create notice (Admin)
- `GET /notices/instructor/noticeboards` - Instructor notices
- `POST /notices/:noticeId/reply` - Add response
- `POST /notices/:noticeId/view` - Mark as viewed

### Dashboard
- `GET /dashboard/admin/stats` - Admin dashboard statistics
- `GET /dashboard/instructor/stats` - Instructor statistics

## Error Handling
- Consistent error response format
- Prisma error handling
- Request validation
- Authentication errors
- Role-based access errors

## Security Measures
- JWT token validation
- Password hashing
- Role-based access control
- Request validation
- CORS configuration
- Helmet security headers

## Future Improvements
- Implement session tracking
- Add real-time notifications
- Enhance analytics
- Add file attachments to notices
- Implement email notifications
