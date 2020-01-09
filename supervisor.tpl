[program:%%supm_name%%]
directory=%%supm_directory%%
command=%%supm_command%%
environment=%%supm_environment%%
autostart=true
autorestart=true
stderr_logfile=~/.supm/%%supm_name%%-stderr.log
stdout_logfile=~/.supm/%%supm_name%%-stdout.log
stdout_logfile_maxbytes=500KB

