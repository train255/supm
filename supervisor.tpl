[program:%%supm_name%%]
directory=%%supm_directory%%
command=%%supm_command%%
environment=%%supm_environment%%
autostart=true
autorestart=true
stderr_logfile=/tmp/%%supm_name%%-stderr.log
stdout_logfile=/tmp/%%supm_name%%-stdout.log

