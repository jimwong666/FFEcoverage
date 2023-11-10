# @jimwong/grunt-istanbul [![Build Status](https://travis-ci.org/taichi/grunt-istanbul.png)](https://travis-ci.org/taichi/grunt-istanbul)

基于 grunt-istanbul@0.8.0 版本修改，增加参数和注入覆盖率上报的代码到各个 js 文件中，主要修改内容如下：

1. 增加可选参数 `relativePathPrefix` ，用于在相对路径的前面加上特定的前缀，比如 `code/`，其中可以选填某些已配置好的 git 相关的参数，比如 `store/${project_name}/${branch}/code`，参数如下：
    1. `${commit_hash}`，会替换成 commit 的 hash 值
    2. `${version}`，会替换成 git 仓库的 version
    3. `${branch}`，会替换成当前分支名
    4. `${last_commit_datetime}`，会替换成上次提交的时间
    5. `${remote}`，会替换成远程仓库的地址
    6. `${project_name}`，会替换成项目名
2. 增加可选参数 `incrementCoverageDir`，表示生成增量代码覆盖率时，增量增量代码的生效路径，比如 `src`，表示只有 `src` 下的文件变化才会被计算增量覆盖率，如果不设置，则表示所有文件都会被计算增量覆盖率
3. 增加可选参数 `coverageVariable`，表示覆盖率数据在全局对象下面的变量名，默认是 `__coverage__`
4. 增加可选参数 `reportURL`，覆盖率上报地址
5. 增加可选参数 `autoReportInterval`，覆盖率自动上报的时间间隔（ms）
   `其他参数为此库原本的参数，未作修改`

JavaScript codecoverage tool for Grunt

## Getting Started

This plugin requires Grunt ~0.4.1

Install this grunt plugin next to your project's [Gruntfile.js][getting_started] with: `npm install grunt-istanbul`

Then add this line to your project's `Gruntfile.js` gruntfile:

```javascript
grunt.loadNpmTasks("grunt-istanbul");
```

[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation

This grunt plugin uses [Istanbul](https://github.com/gotwarlost/istanbul) to perform the code coverage tasks.
It provides the following grunt tasks:

-   `instrument`: instruments a file or a directory tree
-   `reloadTasks`: override instrumented tasks
-   `storeCoverage`: store coverage from global
-   `makeReport`: make coverage report

To use this grunt-istanbul plugin, register a grunt task to run the following:

1. Instrument your source code
2. Run your test suite against your instrumented source code
3. Store your coverage results
4. Make the report

For step 2, an environment variable can be used to determine which path to use for loading
the source code to run the tests against. For example, when you normally run your tests you
want them to point directly at your source code. But when you run your instanbul code coverage
task you want your tests to point at your instrumented source code. The `grunt-env` plugin
can be used for setting an environment variable in a grunt task. Here's an example solution
that solves this problem using `grunt-env` and `grunt-mocha-test`:

```javascript
// in Gruntfile.js
module.exports = function (grunt) {
	grunt.initConfig({
		env: {
			coverage: {
				APP_DIR_FOR_CODE_COVERAGE: "../test/coverage/instrument/app/",
			},
		},
		instrument: {
			files: "app/*.js",
			options: {
				lazy: true,
				basePath: "test/coverage/instrument/",
			},
		},
		mochaTest: {
			options: {
				reporter: "spec",
			},
			src: ["test/*.js"],
		},
		storeCoverage: {
			options: {
				dir: "test/coverage/reports",
			},
		},
		makeReport: {
			src: "test/coverage/reports/**/*.json",
			options: {
				type: "lcov",
				dir: "test/coverage/reports",
				print: "detail",
			},
		},
	});

	grunt.registerTask("coverage", [
		"env:coverage",
		"instrument",
		"mochaTest",
		"storeCoverage",
		"makeReport",
	]);
};
```

```javascript
// require_helper.js
module.exports = function (path) {
	return require((process.env.APP_DIR_FOR_CODE_COVERAGE || "../app/") + path);
};
```

```javascript
// using requireHelper in a test
var requireHelper = require("../require_helper");
var formValidator = requireHelper("form_validator");
```

You can also pass an `instrumenter` argument to the instrument `options` as well as any other arguments that your instrumenter takes.

```javascript
// in Gruntfile.js
module.exports = function (grunt) {
 var isparta = require('isparta');
  grunt.initConfig({
    instrument: {
      files: 'app/*.es6',
      options: {
        lazy: true,
        basePath: 'test/coverage/instrument/'
        babel: {ignore: false, experimental: true, extensions: ['.es6']},
        instrumenter: isparta.Instrumenter
      }
    }
  });
};

```

If you want to specify a current working directory, you can specify a path the cwd `options` :

```javascript
// in Gruntfile.js
module.exports = function (grunt) {
 var isparta = require('isparta');
  grunt.initConfig({
    instrument: {
      files: '**/*.es6',
      options: {
        cwd: 'app/'
        lazy: true,
        basePath: 'test/coverage/instrument/'
        babel: {ignore: false, experimental: true, extensions: ['.es6']}
      }
    }
  });
};

```

If you wan to insturment multiple locations, you specify multiple task targets:

```javascript
// in Gruntfile.js
module.exports = function (grunt) {

  grunt.initConfig({
    env: {
      coverage: {
        APP_DIR_FOR_CODE_COVERAGE: '../test/coverage/instrument/app/'
      }
    },
    instrument: {
      api: {
        files: 'app/*.js',
        options: {
          basePath: 'test/coverage/instrument/'
        }
      },
      web: {
        files: 'web/*.js',
        options: {
          basePath: 'test/coverage/instrument/'
        }
      }
    },
    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: ['test/*.js']
    },
    storeCoverage: {
      options: {
        dir: 'test/coverage/reports'
      }
    },
    makeReport: {
      src: 'test/coverage/reports/**/*.json',
      options: {
        type: 'lcov',
        dir: 'test/coverage/reports',
        print: 'detail'
      }
    }
  });

  grunt.registerTask('coverage', function(arg) {
    var insturment = arg ? 'insturment:' + arg : 'insturment';

    grunt.task.run(['env:coverage', instrument, 'mochaTest',
      'storeCoverage', 'makeReport']);
  });
```

```bash
# coverage with api and web insturmentation
$ grunt coverage
# coverage with api insturmentation
$ grunt coverage:api
# coverage with web insturmentation
$ grunt coverage:web
```

By default only files that have coverage are stored. When the 'include-all-sources' option is set to true it will show all instrumented files even if their coverage percentage is 0. To see all instrumented files you can init the `storeCoverage` task as follows:

```javascript
grunt.initConfig({
	storeCoverage: {
		options: {
			dir: "test/coverage/reports",
			"include-all-sources": true,
		},
	},
});
```

Also, checkout the example Gruntfile.js in this repo (note that you do not need to implement the
`reloadTasks` task in this example):
[Gruntfile.js](https://github.com/taichi/grunt-istanbul/blob/master/Gruntfile.js#69)

For information about the configuration options use the command line `istanbul help config`.

### more examples

-   [Testing and Code Coverage With Node.js Apps](http://www.gregjopa.com/2014/02/testing-and-code-coverage-with-node-js-apps/)
    -   [gregjopa/express-app-testing-demo](https://github.com/gregjopa/express-app-testing-demo)

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History

_(Nothing yet)_

## License

Copyright (c) 2014 taichi
Licensed under the MIT license.
