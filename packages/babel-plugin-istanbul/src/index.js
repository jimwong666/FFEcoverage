import { realpathSync } from "fs";
import { dirname, basename } from "path";
import { programVisitor } from "@jimwong/istanbul-lib-instrument";
import babelSyntaxObjectRestSpread from "babel-plugin-syntax-object-rest-spread";
const { GitRevisionPlugin } = require("@jimwong/git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();

const testExclude = require("test-exclude");
const findUp = require("find-up");

const http = require("http");
const https = require("https");

/**
 * 发送HTTP或HTTPS请求
 * @param {string} url 请求的URL
 * @param {Object} options 请求选项，必须包含method来指定请求类型（GET或POST）
 * @param {Object|string} [body] 请求体（对于POST请求）
 * @returns {Promise} 返回一个Promise，解析为响应的内容
 */
function httpRequest(url, options = {}, body = null) {
	// 根据请求类型处理请求体和头部
	let bodyString = "";
	if (options.method === "POST") {
		// 处理POST请求体，确保为字符串
		bodyString = typeof body === "string" ? body : JSON.stringify(body);
		if (!options.headers) {
			options.headers = {};
		}
		// 确保Content-Type和Content-Length被设置
		options.headers["Content-Type"] = "application/json";
		options.headers["Content-Length"] = Buffer.byteLength(bodyString);
	}

	// 解析URL以确定使用http还是https模块
	const protocol = new URL(url).protocol;
	const lib = protocol === "https:" ? https : http;

	return new Promise((resolve, reject) => {
		const req = lib.request(url, options, (res) => {
			// 处理响应
			let response = "";
			res.on("data", (chunk) => {
				response += chunk;
			});
			res.on("end", () => {
				// 尝试解析JSON，如果失败则返回原始响应
				try {
					const jsonResponse = JSON.parse(response);
					resolve(jsonResponse);
				} catch (error) {
					resolve(response);
				}
			});
		});

		req.on("error", (error) => {
			// 网络或请求错误
			reject(error);
		});

		// 对于POST请求，发送请求体
		if (options.method === "POST" && bodyString) {
			req.write(bodyString);
		}
		req.end();
	});
}

function getRealpath(n) {
	try {
		return (realpathSync(n) || n).replace(/\\/g, "/");
	} catch (e) {
		return n.replace(/\\/g, "/");
	}
}
function getRelativepath(n) {
	try {
		const cwd = getRealpath(process.env.NYC_CWD || process.cwd()).replace(
			/\\/g,
			"/",
		);
		const arr = n.replace(/\\/g, "/").split(cwd);
		return arr[1] || n.replace(/\\/g, "/");
	} catch (e) {
		return n.replace(/\\/g, "/");
	}
}

function makeShouldSkip() {
	var exclude;
	return function shouldSkip(file, opts) {
		if (!exclude) {
			const cwd = getRealpath(process.env.NYC_CWD || process.cwd());
			const nycConfig = process.env.NYC_CONFIG
				? JSON.parse(process.env.NYC_CONFIG)
				: {};

			var config = {};
			if (Object.keys(opts).length > 0) {
				// explicitly configuring options in babel
				// takes precedence.
				config = opts;
			} else if (nycConfig.include || nycConfig.exclude) {
				// nyc was configured in a parent process (keep these settings).
				config = {
					include: nycConfig.include,
					exclude: nycConfig.exclude,
				};
			} else {
				// fallback to loading config from key in package.json.
				config = {
					configKey: "nyc",
					configPath: dirname(findUp.sync("package.json", { cwd })),
				};
			}

			exclude = testExclude(Object.assign({ cwd }, config));
		}

		return !exclude.shouldInstrument(file);
	};
}

// params 是所有需要的参数
var params = {};
function initParams(_this) {
	try {
		// 项目增量对比使用的目录
		params.increment_coverage_dir = _this.opts.incrementCoverageDir || "";
		// 项目此时的commit_hash
		params.commit_hash = gitRevisionPlugin.commithash() || "";
		// 项目version
		params.version = gitRevisionPlugin.version() || "";
		// 项目branch
		params.branch = gitRevisionPlugin.branch() || "";
		// 项目最后提交时间
		params.last_commit_datetime = gitRevisionPlugin.lastcommitdatetime();
		// 项目git地址
		params.remote = gitRevisionPlugin.remote() || "";
		if (params.remote.endsWith("/")) {
			params.remote = params.remote.slice(0, -1);
		}
		// 根据 remote 获取 git repo 名
		const remoteArr = params.remote.split("/");
		// 项目名称
		params.project_name =
			remoteArr[remoteArr.length - 1].split(".")[0] || "";
		// 相对路径时，路径的模板
		params.relativePathPrefixTemp =
			_this.opts.relativePathPrefix ||
			"store/${project_name}/${branch}/code";
		// 相对路径时，真实的路径前缀
		params.relativePathPrefix =
			params.relativePathPrefixTemp
				.replace(/\$\{commit_hash\}/g, params.commit_hash)
				.replace(/\$\{version\}/g, params.version)
				.replace(/\$\{branch\}/g, params.branch)
				.replace(
					/\$\{last_commit_datetime\}/g,
					params.last_commit_datetime,
				)
				.replace(/\$\{remote\}/g, params.remote)
				.replace(/\$\{project_name\}/g, params.project_name) || "";

		params.maxWaitingTimes = _this.opts.maxWaitingTimes || 6;
		params.reportOriginalCoverageFlag =
			_this.opts.reportOriginalCoverageFlag || false;
		params.reportURL =
			_this.opts.reportURL ||
			"https://www.please.config.your.reporturl.com";
	} catch (err) {
		console.log("GET SOME DATA ERROR: ", err);
	}
}

// 获取路径
function getPath(_this) {
	return _this.opts.filePathLocationType === "absolute"
		? getRealpath(_this.file.opts.filename)
		: `${params.relativePathPrefix}${getRelativepath(
				_this.file.opts.filename,
		  )}`;
}

// 这里动态的去上报 coverage 源数据
// 待归档的覆盖率源数据
var coverage = {};
// 待提交的覆盖率源数据
var _coverage = {};
// 等待超时次数
var waitingTimes = 0;

var timer = setInterval(function() {
	if (!params.reportOriginalCoverageFlag) {
		// 不上报原始覆盖率源数据
		clearInterval(timer);
		return;
	}
	if (Object.keys(coverage).length > 0 || Object.keys(_coverage).length > 0) {
		_coverage = Object.assign({}, _coverage, coverage);
		coverage = {};
		// 上报覆盖率源数据
		httpRequest(
			params.reportURL,
			{
				method: "POST",
			},
			Object.assign({}, { data: _coverage }, params),
		)
			.then((json) => {
				const { success, message } = json;
				if (success) {
					// 上报成功
					_coverage = {};
					console.log("覆盖率源数据上报成功");
				} else {
					// 上报失败
					console.log(`覆盖率源数据上报失败: ${message}`);
				}
			})
			.catch((err) => {
				// 上报失败
				console.log(`覆盖率源数据fetch失败: ${err}`);
			});
	} else {
		if (waitingTimes > params.maxWaitingTimes) {
			// 总计等待大于 N 次就取消定时器
			console.log(`覆盖率源数据上报完成！`);
			clearInterval(timer);
		} else {
			waitingTimes++;
			console.log(`覆盖率源数据上报中...`);
		}
	}
}, 10000);

function makeVisitor({ types: t }) {
	const shouldSkip = makeShouldSkip();
	return {
		inherits: babelSyntaxObjectRestSpread,
		visitor: {
			Program: {
				enter(path) {
					// 初始化参数
					if (Object.keys(params).length === 0) {
						initParams(this);
					}

					this.__dv__ = null;
					const realPath = getRealpath(this.file.opts.filename);
					if (shouldSkip(realPath, this.opts)) {
						return;
					}
					var {
						inputSourceMap,
						needInjectGitInfoJsPathArr,
						incrementCoverageDir,
					} = this.opts;
					if (this.opts.useInlineSourceMaps !== false) {
						inputSourceMap =
							inputSourceMap || this.file.opts.inputSourceMap;
					}

					if (inputSourceMap) {
						const fileName = basename(
							getRelativepath(this.file.opts.filename),
						);
						// 变为相对路径
						inputSourceMap.file = fileName;
						inputSourceMap.sources = [fileName];
					}

					const filePath = getPath(this);
					var coverageVariable =
						this.opts.coverageVariable || "__coverage__";
					this.__dv__ = programVisitor(t, filePath, {
						coverageVariable: coverageVariable,
						inputSourceMap,
						needInjectGitInfoJsPathArr,
						incrementCoverageDir,
						relativePathPrefix: params.relativePathPrefix,
					});
					this.__dv__.enter(path);
				},
				exit(path) {
					if (!this.__dv__) {
						return;
					}

					const result = this.__dv__.exit(path);
					const filePath = getPath(this);

					if (params.reportOriginalCoverageFlag) {
						// 上报原始覆盖率源数据
						// 更新覆盖率源数据
						coverage = Object.assign({}, coverage, {
							[result.fileCoverage.path]: result.fileCoverage,
						});
					}

					if (this.opts.onCover) {
						this.opts.onCover(filePath, result.fileCoverage);
					}
				},
			},
		},
	};
}

export default makeVisitor;
