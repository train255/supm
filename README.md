Process manager using supervisor

#### Installation
```bash
# global package
npm install supm@latest -g
# local package
npm install supm@latest
```

#### Create File
```bash
mkdir -p ~/.supm/logs
mkdir -p ~/.supm/services
```


#### Config supervisor (/etc/supervisor.conf)
```
[unix_http_server]
file=~/.supm/supervisor.sock
chmod=0700                       ; sockef file mode (default 0700)
chown=yourusername:yourusername

[supervisord]
logfile=/var/log/supervisor/supervisord.log ; (main log file;default $CWD/supervisord.log)
pidfile=/var/run/supervisord.pid ; (supervisord pidfile;default supervisord.pid)
childlogdir=/var/log/supervisor            ; ('AUTO' child log dir, default $TEMP)

; the below section must remain in the config file for RPC
; (supervisorctl/web interface) to work, additional interfaces may be
; added by defining them in separate rpcinterface: sections
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock ; use a unix:// URL  for a unix socket


[include]
files = /<home-path>/.supm/services/*.conf
```

### Stop and start supervisord
```bash
ps -aux | grep supervisord
kill -9 <PID>
sudo supervisord -c /etc/supervisor.conf
sudo chown -R yourusername:yourusername /var/log/supervisor
```

#### Start Process
```bash
cd my_project
supm start "node index.js" -name "process-name" -num 5 -env "PORT=6999" -increase "PORT"
```

#### Help
```bash
supm -h
```

#### List Processes
```bash
supervisorctl status
```

#### Log Process
```bash
supervisorctl tail -f process-name
```

#### Delete Process
```bash
supervisorctl remove process-name
```

### Programmatic
```javascript
const supm = require('supm');
supm.list((err, process_list) => {

})
supm.restart({
	name: "process-name",
	"env": {
		"PORT": "5000"
	}
}, (err) => {
	
});
```