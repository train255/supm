#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

if (!fs.existsSync(`${homedir}/.supm`)) {
	fs.mkdirSync(`${homedir}/.supm`)
}
const file_config = `${homedir}/.supm/services.conf`;

const templ_path = path.join(__dirname + '/../supervisor.tpl');

console.log("templ_path " + templ_path)

const directory = process.cwd();
const supm = require('../index.js');
const templ = fs.readFileSync(templ_path).toString();

const getProcessConfig = function (params) {
	var process_name = params.process_name;
	var command = params.command;
	var env = params.env;
	var service_content = templ.replace(/%%supm_name%%/g, process_name);
	service_content = service_content.replace(/%%supm_directory%%/g, directory);
	service_content = service_content.replace(/%%supm_command%%/g, command);
	if (env) {
		service_content = service_content.replace(/%%supm_environment%%/g, env);
	} else {
		service_content = service_content.replace('environment=%%supm_environment%%\n', '');
	}
	console.log(service_content);
	return service_content;
}

const checkProcessList = function (params) {
	var process_name = params.process_name;
	var process_list = params.process_list;
	var content = "";
	var is_exist = false;
	if (process_list) {
		for (var i = 0; i < process_list.length; i++) {
			if (process_name && process_name == process_list[i].name) {
				is_exist = true;
				break;
			} else {
				var service_content = templ.replace(/%%supm_name%%/g, process_list[i].name);
				service_content = service_content.replace(/%%supm_directory%%/g, process_list[i].directory);
				service_content = service_content.replace(/%%supm_command%%/g, process_list[i].command);
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
		}
	}
	if (is_exist) return null;
	else return content;
}


if ((process.argv[2] == "start" || process.argv[2] == "s") && process.argv[3]) {
	var command = process.argv[3];
	var env = null;
	var process_name = null;
	var num = null;
	var increase = null;
	for (var i = 4; i < process.argv.length; i++) {
		if (process.argv[i] == "-name") {
			process_name = process.argv[i + 1];
		}
		if (process.argv[i] == "-env") {
			env = `HOME=${homedir},` + process.argv[i + 1];
		}
		if (process.argv[i] == "-num" && Number(process.argv[i + 1]) > 1) {
			num = Number(process.argv[i + 1]);
		}
		if (process.argv[i] == "-increase") {
			increase = process.argv[i + 1];
		}
	}

	var new_env = [];
	if (env && increase && num) {
		var attrs = increase.split(',');
		var envs = env.split(',');
		var env_obj = {};
		for (var i = 0; i < envs.length; i++) {
			var arr = envs[i].split('=');
			env_obj[arr[0]] = {
				value: arr[1]
			};
		}
		for (var i = 0; i < attrs.length; i++) {
			if (env_obj[attrs[i]] && !Number.isNaN(env_obj[attrs[i]])) {
				env_obj[attrs[i]].increase = true;
			}
		}
		for (var i = 0; i < num; i++) {
			new_env[i] = {};
			for (var k in env_obj) {
				if (env_obj[k].increase) {
					new_env[i][k] = Number(env_obj[k].value) + i;
				} else {
					new_env[i][k] = env_obj[k].value;
				}
			}
		}
	}

	supm.list(function (err, process_list) {
		if (process_list) {
			if (num) {
				var content = checkProcessList({
					process_list: process_list
				});
				for (var i = 0; i < num; i++) {
					var _env = [];
					for (var k in new_env[i]) {
						_env.push(k + "=" + new_env[i][k]);
					}
					content += getProcessConfig({
						process_name: process_name + "-" + i,
						command: command,
						env: _env.join(",")
					})
				}
				fs.writeFileSync(file_config, content);
				exec('supervisorctl update', (err, stdout, stderr) => {
					if (err) {
						console.error(err);
					} else {
						console.log("Add process success")
					}
				});
			} else {
				var content = checkProcessList({
					process_name: process_name,
					process_list: process_list
				});
				if (content) {
					content += getProcessConfig({
						process_name: process_name,
						command: command,
						env: env
					})
					fs.writeFileSync(file_config, content);
					exec('supervisorctl update', (err, stdout, stderr) => {
						if (err) {
							console.error(err);
						} else {
							console.log("Add process success")
						}
					});
				} else {
					console.error(`Service ${process_name} is exist`);
				}
			}
		} else {
			var content = "";
			if (num) {
				for (var i = 0; i < num; i++) {
					var _env = [];
					for (var k in new_env[i]) {
						_env.push(k + "=" + new_env[i][k]);
					}
					content += getProcessConfig({
						process_name: process_name + "-" + i,
						command: command,
						env: _env
					})
				}
			} else {
				content += getProcessConfig({
					process_name: process_name,
					command: command,
					env: env
				})
			}
			fs.writeFileSync(file_config, content);
			exec('supervisorctl update', (err, stdout, stderr) => {
				if (err) {
					console.error(err);
				} else {
					console.log("Add process success")
				}
			});
		}
	});
}