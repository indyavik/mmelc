@echo off 

taskkill /im nginx.exe /F
cd /d "C:\MMELC_pilot\nginx-1.8.0"
START nginx.exe