@echo off
REM Delete all .md files except DEPLOYMENT_STEPS.md
cd "c:\Users\Amaan\OneDrive\Desktop\New folder\Code Royae"

REM List of files to delete
del /F /Q "00_START_HERE.md" 2>nul
del /F /Q "DELETE_THESE.md" 2>nul
del /F /Q "ENV_TEMPLATE.md" 2>nul
del /F /Q "EVERYTHING_DONE.md" 2>nul
del /F /Q "FINAL_VERCEL_SUMMARY.md" 2>nul
del /F /Q "GOOGLE_APPS_SCRIPT_SETUP.md" 2>nul
del /F /Q "QUICK_REFERENCE.md" 2>nul
del /F /Q "README.md" 2>nul
del /F /Q "SETUP_GUIDE.md" 2>nul
del /F /Q "SYSTEM_READY.md" 2>nul
del /F /Q "VISUAL_SUMMARY.md" 2>nul
del /F /Q "VERCEL_COMPLETE_PACKAGE.md" 2>nul
del /F /Q "VERCEL_DEPLOYMENT.md" 2>nul
del /F /Q "VERCEL_GUIDE_MAP.md" 2>nul
del /F /Q "VERCEL_QUICK_REFERENCE.md" 2>nul
del /F /Q "VERCEL_SUMMARY.md" 2>nul
del /F /Q "SYSTEM_INTEGRATION.md" 2>nul
del /F /Q "VERIFICATION_CHECKLIST.md" 2>nul
del /F /Q "START_DEPLOYMENT.md" 2>nul

echo Cleanup complete! Only DEPLOYMENT_STEPS.md remains.
