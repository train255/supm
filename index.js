const { exec } = require('child_process');
const fs = require('fs');
const homedir = require('os').homedir();
const file_config = `${homedir}/.supm/services.conf`;

module.exports = {
	list: function (callback) {
		exec('supervisorctl status', (err, stdout, stderr) => {
			if (err) {
				// node couldn't execute the command
				callback(err);
			} else {
				const lines = stdout.toString().split("\n");
				let services = {};
				for (var i = 0; i < lines.length - 1; i++) {
					let line = lines[i];
					line = line.replace(/\s\s+/g, ' ');
					let columns = line.split(" ");
					services[columns[0]] = {
						name: columns[0],
						status: columns[1]
					};
				}
				var file = fs.readFileSync(file_config).toString();
				let paragraph = file.split("\n\n");
				for (var j = 0; j < paragraph.length - 1; j++) {
					var service_name = paragraph[j].split('program:')[1].split(']')[0];
					var command = paragraph[j].split('command=')[1].split('\n')[0];
					var directory = paragraph[j].split('directory=')[1].split('\n')[0];
					var environment_list = paragraph[j].split('environment=')[1].split('\n')[0].split(',');
					var env = {};
					environment_list.forEach(function(e){
						env[e.split('=')[0]] = e.split('=')[1];
					})
					services[service_name].env = env;
					services[service_name].command = command;
					services[service_name].directory = directory;
				}
				let process_list = [];
				for (var k in services) {
					process_list.push(services[k]);
				}
				callback(null, process_list);
			}
		});
	},
	restart: function(params, callback) {
		this.list(function(err, process_list) {
			if (process_list) {
				var content = "";
				for (var i = 0; i < process_list.length; i++) {
					content += `[program:${process_list[i].name}]\n`;
					content += `directory=${process_list[i].directory}\n`;
					content += `command=${process_list[i].command}\n`;
					if (params.name == process_list[i].name) {
						if (params.env) {
							for(var k in params.env) {
								process_list[i].env[k] = params.env[k];
							}
						}
					}
					var environment = [];
					for (var k in process_list[i].env) {
						environment.push(k + "=" + process_list[i].env[k]);
					}
					
					content += `environment=${environment.join(',')}\n`;
					content += 'autostart=true\n';
					content += 'autorestart=true\n';
					content += `stderr_logfile=/tmp/${process_list[i].name}-stderr.log\n`;
					content += `stdout_logfile=/tmp/${process_list[i].name}-stdout.log\n\n`;
				}
				fs.writeFileSync(file_config, content);
				exec('supervisorctl update', (err, stdout, stderr) => {
					if (err) {
						callback(err);
					} else {
						callback();
					}
				});
			}
		})
	}
}