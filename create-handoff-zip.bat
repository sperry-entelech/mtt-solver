@echo off
echo Creating Discord handoff package...

cd C:\Users\spder

echo Copying essential files...
mkdir mtt-poker-handoff 2>nul
xcopy mtt-poker-solver mtt-poker-handoff\ /E /I /H /Y /EXCLUDE:zip-exclude.txt

echo Creating zip file...
powershell "Compress-Archive -Path 'mtt-poker-handoff' -DestinationPath 'mtt-poker-solver-discord.zip' -Force"

echo Cleaning up...
rd /s /q mtt-poker-handoff

echo ✅ Created: mtt-poker-solver-discord.zip
echo Ready to upload to Discord!
pause