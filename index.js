const { exec } = require('child_process');
const fs = require('fs');
const homedir = require('os').homedir();
const home_path = process.env.HOME ? process.env.HOME : homedir;
const file_config = `${home_path}/.supm/services.conf`;

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
				let paragraph = file.split("[program:");
				for (var j = 0; j < paragraph.length; j++) {
					var service_name = paragraph[j].split(']')[0];
					if (services[service_name]) {
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
		if (params.name && Object.keys(params).length == 1) {
			exec(`supervisorctl restart ${params.name}`, (err, stdout, stderr) => {
				if (err) {
					callback(err);
				} else {
					callback();
				}
			});
		} else if (params.name && params.env) {
			var file = fs.readFileSync(file_config).toString();
			let paragraph = file.split("[program:");
			let old_content = null;
			for (var j = 0; j < paragraph.length; j++) {
				var service_name = paragraph[j].split(']')[0];
				if (service_name == params.name) {
					old_content = paragraph[j];
					break;
				}
			}

			if (old_content) {
				var environment_list = paragraph[j].split('environment=')[1].split('\n')[0];
				var new_environment_list = paragraph[j].split('environment=')[1].split('\n')[0];
				for (var k in params.env) {
					environment_list.split(',').forEach(function (e) {
						var attr_name = e.split('=')[0];
						if (k == attr_name) {
							new_environment_list = new_environment_list.replace(e, k + "=" + params.env[k]);
						}
					})
				}
				var new_content = old_content.replace(environment_list, new_environment_list);
				var new_file = file.replace(old_content, new_content);
				fs.writeFileSync(file_config, new_file);
				exec('supervisorctl update', (err, stdout, stderr) => {
					if (err) {
						callback(err);
					} else {
						callback();
					}
				});
			} else {
				callback("Not found service name");
			}
		}
	}
}