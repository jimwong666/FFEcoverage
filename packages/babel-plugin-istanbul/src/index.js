import { realpathSync, relative } from "fs";
const os = require("os");
import { dirname, resolve } from "path";
import { programVisitor } from "@jimwong/istanbul-lib-instrument";
import babelSyntaxObjectRestSpread from "babel-plugin-syntax-object-rest-spread";
const { GitRevisionPlugin } = require("@jimwong/git-revision-webpack-plugin");
const gitRevisionPlugin = new GitRevisionPlugin();

const testExclude = require("test-exclude");
const findUp = require("find-up");
const isWindows = os.platform() === "win32";

function getRealpath(n) {
	try {
		return realpathSync(n) || n;
	} catch (e) {
		return n;
	}
}
function getRelativepath(n) {
	try {
		const cwd = getRealpath(process.env.NYC_CWD || process.cwd());
		const arr = n.split(cwd);
		return arr[1] || n;
	} catch (e) {
		return n;
	}
}

function makeShouldSkip() {
	let exclude;
	return function shouldSkip(file, opts) {
		if (!exclude) {
			const cwd = getRealpath(process.env.NYC_CWD || process.cwd());
			const nycConfig = process.env.NYC_CONFIG
				? JSON.parse(process.env.NYC_CONFIG)
				: {};

			let config = {};
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

function getPath(_this) {
	const relativePathPrefix = getRelativePathPrefix(_this);

	return _this.opts.filePathLocationType === "absolute"
		? isWindows
			? getRealpath(_this.file.opts.filename).replace(/\\/g, "/")
			: getRealpath(_this.file.opts.filename)
		: `${relativePathPrefix}${
				isWindows
					? getRelativepath(_this.file.opts.filename).replace(
							/\\/g,
							"/",
					  )
					: getRelativepath(_this.file.opts.filename)
		  }`;
}

function getRelativePathPrefix(_this) {
	var relativePathPrefix =
		_this.opts.relativePathPrefix || "store/${project_name}/${branch}/code";
	var commit_hash = "";
	var version = "";
	var branch = "";
	var last_commit_datetime = "";
	var remote = "";
	var project_name = "";

	try {
		commit_hash = gitRevisionPlugin.commithash();
		version = gitRevisionPlugin.version();
		branch = gitRevisionPlugin.branch();
		last_commit_datetime = gitRevisionPlugin.lastcommitdatetime();
		remote = gitRevisionPlugin.remote();
		// 根据 remote 获取 git repo 名
		const remoteArr = (remote || "").split("/");
		project_name = remoteArr[remoteArr.length - 1].split(".")[0];
	} catch (err) {
		console.log("get git info error", err);
	}

	const _relativePathPrefix = relativePathPrefix
		.replace(/\$\{commit_hash\}/g, commit_hash)
		.replace(/\$\{version\}/g, version)
		.replace(/\$\{branch\}/g, branch)
		.replace(/\$\{last_commit_datetime\}/g, last_commit_datetime)
		.replace(/\$\{remote\}/g, remote)
		.replace(/\$\{project_name\}/g, project_name);
	return _relativePathPrefix;
}

function makeVisitor({ types: t }) {
	const shouldSkip = makeShouldSkip();
	return {
		inherits: babelSyntaxObjectRestSpread,
		visitor: {
			Program: {
				enter(path) {
					this.__dv__ = null;
					const realPath = getRealpath(this.file.opts.filename);
					if (shouldSkip(realPath, this.opts)) {
						return;
					}
					let {
						inputSourceMap,
						needInjectGitInfoJsPathArr,
						incrementCoverageDir,
					} = this.opts;
					if (this.opts.useInlineSourceMaps !== false) {
						inputSourceMap =
							inputSourceMap || this.file.opts.inputSourceMap;
					}

					if (inputSourceMap) {
						const pathArr = isWindows
							? getRelativepath(this.file.opts.filename).split(
									"\\",
							  )
							: getRelativepath(this.file.opts.filename).split(
									"/",
							  );
						// 变为相对路径
						inputSourceMap.file = pathArr[pathArr.length - 1];
						inputSourceMap.sources = [pathArr[pathArr.length - 1]];
					}

					const filePath = getPath(this);
					var coverageVariable =
						this.opts.coverageVariable || "__coverage__";
					this.__dv__ = programVisitor(t, filePath, {
						coverageVariable: coverageVariable,
						inputSourceMap,
						needInjectGitInfoJsPathArr,
						incrementCoverageDir,
						relativePathPrefix: getRelativePathPrefix(this),
					});
					this.__dv__.enter(path);
				},
				exit(path) {
					if (!this.__dv__) {
						return;
					}
					const result = this.__dv__.exit(path);

					const filePath = getPath(this);
					if (this.opts.onCover) {
						this.opts.onCover(filePath, result.fileCoverage);
					}
				},
			},
		},
	};
}

export default makeVisitor;
