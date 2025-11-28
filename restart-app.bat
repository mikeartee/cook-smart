@echo off
echo Cleaning React Native cache...
rmdir /s /q %TEMP%\react-native-* 2>nul
rmdir /s /q %TEMP%\metro-* 2>nul
rmdir /s /q %TEMP%\haste-map-* 2>nul

echo Cleaning project cache...
rmdir /s /q node_modules\.cache 2>nul

echo Starting Metro with reset cache...
npx react-native start --reset-cache
