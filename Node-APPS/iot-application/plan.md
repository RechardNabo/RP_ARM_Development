# IoT Application Development Plan

## Project Overview
A Next.js (15.2.4) IoT dashboard application with React 19 for monitoring and controlling IoT devices. The application runs on a Raspberry Pi 3 Model B and provides real-time monitoring, alerting, and device management capabilities.

## Current State
- **Version**: 0.1.0
- **Environment**:
  - Development: Windows
  - Production: Raspberry Pi 3 Model B (Debian GNU/Linux 12)
  - Port: 3001
- **Key Features Implemented**:
  - Dashboard with system metrics
  - Real-time alerts and notifications
  - Device management interface
  - System services monitoring
  - Network status monitoring

## Recent Updates
- Integrated Clear Alerts functionality with Recent Alerts card
- Added API endpoints for alerts management
- Improved UI consistency across dashboard components
- Reduced log noise for better debugging

## Current Tasks
- [ ] Update System Services card font size to match other dashboard cards
- [ ] Test alert clearing functionality on Raspberry Pi
- [ ] Verify all API endpoints work in production environment

## Development Workflow
1. **Development (Windows)**
   - Edit code in `Node-APPS/iot-application`
   - Test locally using development server (`npm run dev` on port 3001)
   - Commit and push changes to git repository

2. **Deployment (Raspberry Pi)**
   ```bash
   git pull origin development
   npm install
   npm run build
   PORT=3001 npm start
   ```

## API Endpoints
- `GET /api/alerts/get` - Fetch all alerts
- `POST /api/alerts/clear` - Clear all alerts
- `GET /api/system/metrics` - Get system metrics
- `GET /api/network/status` - Get network status
- `POST /api/system/refresh` - Refresh system data
- `POST /api/services/restart` - Restart system services

## Dependencies
- Next.js 15.2.4
- React 19
- MongoDB (for data storage)
- InfluxDB (for time-series data)
- AWS SDK (for cloud integration)
- Recharts (for data visualization)

## Future Enhancements
- [ ] Add user authentication
- [ ] Implement device configuration interface
- [ ] Add data export functionality
- [ ] Enhance mobile responsiveness
- [ ] Add more detailed system metrics

## Notes
- The application uses a custom event system for real-time updates
- All API routes are protected and include error handling
- The UI follows a consistent design system with shadcn/ui components
