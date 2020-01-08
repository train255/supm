const { exec } = require('child_process');
const fs = require('fs');
const homedir = require('os').homedir();
const file_config = `${homedir}/.supm/services.conf`;
const path = require('path');

const templ_path = path.join(__dirname + '/supervisor.tpl');
const templ = fs.readFileSync(templ_path).toString();

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
					if (paragraph[j].split('environment=')[1]) {
						var environment_list = paragraph[j].split('environment=')[1].split('\n')[0].split(',');
						var env = {};
						environment_list.forEach(function (e) {
							env[e.split('=')[0]] = e.split('=')[1];
						})
						services[service_name].env = env;
					}
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
	restart: function (params, callback) {
		this.list(function (err, process_list) {
			if (process_list) {
				var content = "";
				for (var i = 0; i < process_list.length; i++) {
					var service_content = templ.replace(/%%supm_name%%/g, process_list[i].name);
					service_content = service_content.replace(/%%supm_directory%%/g, process_list[i].directory);
					service_content = service_content.replace(/%%supm_command%%/g, process_list[i].command);
					if (params.name == process_list[i].name) {
						if (params.env) {
							for (var k in params.env) {
								process_list[i].env[k] = params.env[k];
							}
						}
					}
					if (process_list[i].env) {
						var environment = [];
						for (var k in process_list[i].env) {
							environment.push(k + "=" + process_list[i].env[k]);
						}
						service_content = service_content.replace(/%%supm_environment%%/g, environment.join(','));
					} else {
						service_content = service_content.replace('environment=%%supm_environment%%\n', '');
					}
					content += service_content;
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