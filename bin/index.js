#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const homedir = require('os').homedir();

if (!fs.existsSync(`${homedir}/.supm`)) {
	fs.mkdirSync(`${homedir}/.supm`)
}
const file_config = `${homedir}/.supm/services`;

const templ_path = path.join(__dirname + '/../supervisor.tpl');

const directory = process.cwd();
const supm = require('../index.js');
const templ = fs.readFileSync(templ_path).toString();

SUPM_LIB_PATH = path.join(path.dirname(fs.realpathSync(__filename)), '../');


const getProcessConfig = function (params) {
	var process_name = params.process_name;
	var command = params.command;
	var env = params.env;
	var service_content = templ.replace(/%%supm_name%%/g, process_name);
	service_content = service_content.replace(/%%supm_directory%%/g, directory);
	service_content = service_content.replace(/%%supm_home_path%%/g, homedir);
	service_content = service_content.replace(/%%supm_command%%/g, command);
	if (env) {
		service_content = service_content.replace(/%%supm_environment%%/g, env);
	} else {
		service_content = service_content.replace('environment=%%supm_environment%%\n', '');
	}
	console.log(service_content);
	return service_content;
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

	fs.readdir(file_config, function (err, files) {
		if (num) {
			for (var i = 0; i < num; i++) {
				let child_process_name = process_name + "-" + i;
				if (files.indexOf(child_process_name + '.conf') > -1) {
					console.log(child_process_name + " is exist");
				} else {
					var _env = [];
					for (var k in new_env[i]) {
						_env.push(k + "=" + new_env[i][k]);
					}
					let content = getProcessConfig({
						process_name: child_process_name,
						command: command,
						env: _env.join(",")
					});
					fs.writeFileSync(file_config + '/' + child_process_name + '.conf', content);
				}
			}
		} else {
			let content = getProcessConfig({
				process_name: process_name,
				command: command,
				env: env
			});
			fs.writeFileSync(file_config + '/' + process_name + '.conf', content);
		}
		exec('supervisorctl update', (err, stdout, stderr) => {
			if (err) {
				console.error(err);
			} else {
				console.log("Add process success")
			}
		});
	})
} else if (process.argv[2] == "-v" || process.argv[2] == "-version") {
	console.log("supm " + require(SUPM_LIB_PATH + 'package.json').version);
} else if (process.argv[2] == "-h" || process.argv[2] == "-help") {
	fs.readFile(path.dirname(fs.realpathSync(__filename)) + '/help', function (err, data) {
		if (err) throw err;
		console.log(data.toString());
	});
}