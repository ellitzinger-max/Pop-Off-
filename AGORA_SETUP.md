# Agora Video Chat Setup Guide for Pop Off

Your Pop Off app is fully built and ready! To enable video chat functionality, you just need to add your Agora credentials.

## Step 1: Create a Free Agora Account

1. Visit [https://www.agora.io](https://www.agora.io)
2. Click **"Sign Up"** in the top right corner
3. Create your free account (no credit card required for development)
4. Verify your email address

## Step 2: Get Your Agora Credentials

After signing in to your Agora Console:

1. **Navigate to Projects**
   - Click on **"Projects"** in the left sidebar
   - Click **"Create"** button to create a new project

2. **Create a Project**
   - Project Name: `Pop Off` (or any name you prefer)
   - Use Case: Select **"Video Calling"**
   - Click **"Create"**

3. **Get Your App ID**
   - Your new project will appear in the list
   - Find the **"App ID"** column - copy this value
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

4. **Enable and Get App Certificate**
   - Click on your project name to open project settings
   - Find the **"Primary Certificate"** section
   - Click **"Enable"** next to "Primary Certificate"
   - **IMPORTANT**: Copy the certificate immediately - you can't view it again!
   - Example: `x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6`

## Step 3: Add Credentials to Your App

### Backend Configuration

Open `/app/backend/.env` and update:

```env
AGORA_APP_ID="your_app_id_here"
AGORA_APP_CERTIFICATE="your_app_certificate_here"
```

### Frontend Configuration

Open `/app/frontend/.env` and update:

```env
REACT_APP_AGORA_APP_ID="your_app_id_here"
```

**Example (with dummy values):**

Backend `.env`:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
AGORA_APP_ID="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
AGORA_APP_CERTIFICATE="x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6"
```

Frontend `.env`:
```env
REACT_APP_BACKEND_URL=https://interest-rooms.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
REACT_APP_AGORA_APP_ID="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

## Step 4: Restart Your App

After adding the credentials, restart both services:

```bash
sudo supervisorctl restart backend frontend
```

## Step 5: Test Video Chat

1. Go to your app: https://interest-rooms.preview.emergentagent.com
2. Sign up or log in
3. Create a new topic or join an existing one
4. Click "Join Video Chat"
5. Allow camera and microphone permissions when prompted
6. You should now see your video feed!

## Important Notes

### Free Tier Limits
Agora's free tier includes:
- 10,000 free minutes per month
- Unlimited channels
- Up to 17 participants per channel

This is perfect for development and initial testing!

### Security Best Practices

1. **Never commit .env files** to version control
2. **Rotate credentials** if they're accidentally exposed
3. **Use different projects** for development and production
4. **Monitor usage** in Agora Console to avoid overages

### Troubleshooting

**"Failed to join video room" error:**
- Verify credentials are correctly copied (no extra spaces)
- Ensure App Certificate is enabled in Agora Console
- Check browser console for specific error messages
- Allow camera/microphone permissions in browser

**"Agora App ID not configured" error:**
- Make sure you restarted both backend and frontend after updating .env
- Verify the env variable names match exactly (case-sensitive)

**Can't see other participants:**
- This is normal if you're testing alone
- Open the same room in an incognito window to test with yourself
- Or share the room link with a friend

## Production Deployment

When moving to production:

1. **Create a production project** in Agora Console
2. **Enable token authentication** (already implemented in the app)
3. **Set up usage alerts** to monitor minutes consumed
4. **Consider upgrading** if you exceed free tier limits

## Need Help?

- **Agora Documentation**: https://docs.agora.io
- **Agora Community**: https://www.agora.io/en/community/
- **Agora Support**: Available in your console dashboard

Your video chat app is ready to connect people! 🎉
