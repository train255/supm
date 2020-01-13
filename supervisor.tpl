[program:%%supm_name%%]
directory=%%supm_directory%%
command=%%supm_command%%
environment=%%supm_environment%%
autostart=true
autorestart=false
stderr_logfile=%%supm_home_path%%/.supm/logs/%%supm_name%%-stderr.log
stdout_logfile=%%supm_home_path%%/.supm/logs/%%supm_name%%-stdout.log
stderr_logfile_maxbytes=500KB
stdout_logfile_maxbytes=500KB

