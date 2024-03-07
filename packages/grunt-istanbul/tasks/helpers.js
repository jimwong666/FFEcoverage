exports.init = function(grunt) {
	"use strict";
	var COVERAGEBARIABLE = "__coverage__";
	var chalk = require("chalk");

	var fs = require("fs");
	var path = require("path");

	var flow = require("nue").flow;
	var as = require("nue").as;

	var istanbul = require("@jimwong/istanbul");

	function flowEnd(err, done) {
		if (err) {
			grunt.fail.fatal(err);
		}
		done();
	}
	var arcCode = fs.readFileSync(
		require.resolve("@jimwong/auto-report-coverage/dist/index.umd.js"),
		"utf8",
	);
	var GitRevisionPlugin = require("@jimwong/git-revision-webpack-plugin")
		.GitRevisionPlugin;
	var gitRevisionPlugin = new GitRevisionPlugin();
	var commit_hash = gitRevisionPlugin.commithash() || "";
	var version = gitRevisionPlugin.version() || "";
	var branch = gitRevisionPlugin.branch() || "";
	var last_commit_datetime = gitRevisionPlugin.lastcommitdatetime() || "";
	var remote = gitRevisionPlugin.remote() || "";
	if (remote.endsWith("/")) {
		remote = remote.slice(0, -1);
	}
	var remoteArr = (remote || "").split("/");
	var project_name = remoteArr[remoteArr.length - 1].split(".")[0];

	function makeReporters(options) {
		var result = [];
		var reporters =
			options.reporters && typeof options.reporters === "object"
				? options.reporters
				: {};
		Object.keys(reporters).forEach(function(n) {
			if (reporters[n]) {
				result.push({ type: n, options: reporters[n] });
			}
		});

		var append = function(t) {
			if (t && !reporters[t]) {
				result.push({ type: t, options: options });
				reporters[t] = true;
			}
		};

		if (Array.isArray(options.type)) {
			options.type.forEach(append);
		} else {
			append(options.type);
		}

		var mapping = {
			none: [],
			detail: ["text"],
			both: ["text", "text-summary"],
		};
		var a = mapping[options.print];
		if (a) {
			a.forEach(append);
		} else {
			append("text-summary");
		}
		return result;
	}

	return {
		instrument: function(files, options, done) {
			var outFile = function(file) {
				return path.join(
					options.basePath,
					options.flatten === true ? path.basename(file) : file,
				);
			};

			var getRelativePath = function(file) {
				var cwd = options.cwd || "";

				return path.join(cwd, file);
			};

			var tally = { instrumented: 0, skipped: 0 };
			var _relativePathPrefix =
				options.relativePathPrefix ||
				"store/${project_name}/${branch}/code";
			var relativePathPrefix =
				_relativePathPrefix
					.replace(/\$\{commit_hash\}/g, commit_hash)
					.replace(/\$\{version\}/g, version)
					.replace(/\$\{branch\}/g, branch)
					.replace(
						/\$\{last_commit_datetime\}/g,
						last_commit_datetime,
					)
					.replace(/\$\{remote\}/g, remote)
					.replace(/\$\{project_name\}/g, project_name) || "";

			var instFlow = flow(
				function instrumentFile(f) {
					var code = grunt.file.read(getRelativePath(f.name));
					var instrumenter = options.instrumenter
						? new options.instrumenter(options)
						: new istanbul.Instrumenter(options);
					instrumenter.instrument(
						code,
						relativePathPrefix +
							"/" +
							getRelativePath(f.name).replace(/\\/g, "/"),
						this.async({
							name: f.name,
							code: as(1),
						}),
					);
				},
				function write(result) {
					// git 仓库信息
					var __git_info__ = {
						commit_hash: commit_hash,
						version: version,
						branch: branch,
						last_commit_datetime: last_commit_datetime,
						remote: remote,
						project_name: project_name,
					};
					var incrementCoverageDir =
						options.incrementCoverageDir || "";
					var reportURL = options.reportURL || "";
					var autoReportInterval =
						options.autoReportInterval || 5 * 60 * 1000;

					var out = outFile(result.name);
					grunt.file.write(
						out,
						`
          window.__git_info__ = ${JSON.stringify(__git_info__)};
          window.__increment_coverage_dir__ = "${incrementCoverageDir}";
          window.__relative_path_prefix__ = "${relativePathPrefix}";

          ${arcCode}
		  if(!window.ARCisActive) {
			window.ARCisActive = true;
			ARC({
				reportURL: "${reportURL}",
				coverageVariable: "${options.coverageVariable || COVERAGEBARIABLE}",
				interval: ${autoReportInterval},
			});
		  }

          ${result.code}
          `,
					);
					tally.instrumented++;
					this.next();
				},
				function end() {
					flowEnd(this.err, this.next.bind(this));
				},
			);

			var dateCheckFlow = flow(
				function readStat(f) {
					if (
						grunt.file.exists(getRelativePath(f.name)) &&
						grunt.file.exists(outFile(f.name))
					) {
						grunt.log.debug("reading stat for " + f.name);
						fs.stat(
							getRelativePath(f.name),
							this.async({ name: f.name, stat: as(1) }),
						);
						fs.stat(
							outFile(f.name),
							this.async({ name: f.name, stat: as(1) }),
						);
					} else {
						grunt.verbose.writeln(
							"instrumented file does not exist " + f.name,
						);
						this.end({ name: f.name, instrument: true });
					}
				},
				function decision(i, o) {
					var reinstrument =
						i.stat.mtime.getTime() > o.stat.mtime.getTime();
					grunt.log.debug(
						"make a decision about instrumenting " +
							i.name +
							": " +
							reinstrument,
					);
					this.end({ name: i.name, instrument: reinstrument });
				},
				function end(f) {
					grunt.log.debug(this.err);
					if (f.instrument) {
						this.exec(instFlow, { name: f.name }, this.async());
					} else {
						tally.skipped++;
						flowEnd(this.err, this.next.bind(this));
					}
				},
			);

			flow(
				function(filelist) {
					this.asyncEach(filelist, function(file, group) {
						this.exec(
							options.lazy ? dateCheckFlow : instFlow,
							{ name: file },
							group.async(as(1)),
						);
					});
				},
				function outputSummary() {
					grunt.log.write(
						"Instrumented " +
							chalk.cyan(tally.instrumented) +
							" " +
							grunt.util.pluralize(
								tally.instrumented,
								"file/files",
							),
					);
					if (options.lazy) {
						grunt.log.write(
							" (skipped " +
								chalk.cyan(tally.skipped) +
								" " +
								grunt.util.pluralize(
									tally.skipped,
									"file/files",
								) +
								")",
						);
					}
					grunt.log.writeln();
					this.next();
				},
				done,
			)(files);
		},
		addUncoveredFiles: function(coverage, options, allFiles) {
			var instrumenter = new istanbul.Instrumenter({
				coverageVariable: options.coverageVariable || COVERAGEBARIABLE,
				preserveComments: false,
			});
			var transformer = instrumenter.instrumentSync.bind(instrumenter);
			allFiles.forEach(function(file) {
				if (!coverage[file]) {
					transformer(fs.readFileSync(file, "utf-8"), file);
					coverage[file] = instrumenter.coverState;
				}
			});
		},
		storeCoverage: function(coverage, options, done) {
			flow(
				function write_json(cov) {
					var json = path.resolve(options.dir, options.json);
					grunt.file.write(json, JSON.stringify(cov));
					this.next();
				},
				function() {
					flowEnd(this.err, done);
				},
			)(coverage);
		},
		makeReport: function(files, options, done) {
			flow(
				function(filelist) {
					var collector = new istanbul.Collector();
					filelist.forEach(function(file) {
						collector.add(grunt.file.readJSON(file));
					});
					makeReporters(options).forEach(function(repoDef) {
						var reporter = istanbul.Report.create(
							repoDef.type,
							repoDef.options,
						);
						reporter.writeReport(collector, true);
					});
					this.next();
				},
				function() {
					flowEnd(this.err, done);
				},
			)(files);
		},
	};
};
