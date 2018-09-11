@echo off 

taskkill /im nginx.exe /F
cd /d "C:\WELCOMM\nginx-1.8.0"
START nginx.exe