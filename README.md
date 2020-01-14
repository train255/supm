Process manager using supervisor

### Create File
```bash
mkdir -p ~/.supm/logs
touch ~/.supm/services.conf
```

#### Config supervisor (/etc/supervisor.conf)
[unix_http_server]
file=~/.supm/supervisor.sock
chown=yourusername:yourusername
...
[include]
files = /<home-path>/.supm/*.conf

#### Start Process
```bash
cd my_project
supm start "node index.js" -name "process-name" -num 5 -env "PORT=6999" -increase "PORT"
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