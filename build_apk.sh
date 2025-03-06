#!/bin/bash
# Start ASP.NET Core server
cd backend/aspnet
./aspnet &

# Start Python Flask server
cd ../python
./app &

# Build React Native APK
cd ../../MobileApp
npx react-native run-android
