DR. CHASI - APPOINTMENT FRONTEND V1

1. Extract this ZIP.
2. Open PowerShell in the extracted folder.
3. Run:

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\04_0_install_appointment_frontend.ps1

4. Then:

cd C:\projects\Laboratorio\client
npm.cmd run dev

5. Open:
http://localhost:5173/agendar

This first stage is frontend-only. It does NOT write appointment data to Supabase yet.
