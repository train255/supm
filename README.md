Process manager using supervisor

### Create File
```bash
mkdir -p ~/.supm && touch ~/.supm/services.conf
```

#### Config supervisor (/etc/supervisor.conf)
[include]
files = /<home-path>/.supm/*.conf

#### Start Process
```bash
cd my_project
supm start "node index.js" -name "process-name" -num 5 -env "PORT=6999" -increase "PORT"
```