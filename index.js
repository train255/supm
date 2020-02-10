const { exec } = require('child_process');
const fs = require('fs');
const homedir = require('os').homedir();
const home_path = process.env.HOME ? process.env.HOME : homedir;
const file_config = `${home_path}/.supm/services`;

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

				fs.readdir(file_config, function (err, files) {
					if (err) {
						console.log("Error getting directory information.");
						callback(err);
					} else {
						files.forEach(function (file) {
							const content = fs.readFileSync(file_config + '/' + file).toString();
							const service_name = content.split("[program:")[1].split(']')[0];
							if (services[service_name]) {
								var command = content.split('command=')[1].split('\n')[0];
								var directory = content.split('directory=')[1].split('\n')[0];
								if (content.split('environment=')[1]) {
									var environment_list = content.split('environment=')[1].split('\n')[0].split(',');
									var env = {};
									environment_list.forEach(function (e) {
										env[e.split('=')[0]] = e.split('=')[1];
									})
									services[service_name].env = env;
								}
								services[service_name].command = command;
								services[service_name].directory = directory;
							}
						})
						let process_list = [];
						for (var k in services) {
							process_list.push(services[k]);
						}
						callback(null, process_list);
					}
				})
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
			let old_content = null;
			const file_name = file_config + '/' + params.name + '.conf';
			if (fs.existsSync(file_name)) {
				old_content = fs.readFileSync(file_name).toString();
			}

			if (old_content) {
				var environment_list = old_content.split('environment=')[1].split('\n')[0];
				var new_environment_list = old_content.split('environment=')[1].split('\n')[0];
				for (var k in params.env) {
					environment_list.split(',').forEach(function (e) {
						var attr_name = e.split('=')[0];
						if (k == attr_name) {
							new_environment_list = new_environment_list.replace(e, k + "=" + params.env[k]);
						}
					})
				}
				var new_content = old_content.replace(environment_list, new_environment_list);
				fs.writeFileSync(file_name, new_content);
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