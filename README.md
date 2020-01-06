Process manager using supervisor

#### Config supervisor (/etc/supervisor.conf)
[include]
files = /<home-path>/.supm/*.conf

#### Start Process
```bash
cd my_project
supm start "node index.js" -name "process-name" -num 5 -env "PORT=6999" -increase "PORT"
```