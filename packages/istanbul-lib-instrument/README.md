## istanbul-lib-instrument

基于 istanbul-lib-instrument@1.10.1，在它的功能上增加了：

1. ~~window[${GLOBAL_COVERAGE_VAR}_initial] 的值，表示初始化时的覆盖率信息，即执行次数都是 0 的数据~~
2. 增加可选路径数组参数 `needInjectGitInfoJsPathArr`，默认值是 `['']`，对数组中的路径进行注入 git 信息， git 信息数据在 `window.__git_info__` 上，包含 `branch`、`commit`、`remote` 等信息
3. 增加可选参数 `incrementCoverageDir`，默认值`''`，表示生成增量代码覆盖率时，增量增量代码的生效路径，比如 `src`，表示只有 `src` 下的文件变化才会被计算增量覆盖率，如果不设置，则表示所有文件都会被计算增量覆盖率
4. 增加可选参数 `relativePathPrefix`，默认值`''`，表示再相对路径的模式下，生成的代码覆盖率文件中，文件覆盖率对象的`key`的前缀（即相对路径的前缀，以满足自定义路径的需求），比如 `src`，表示生成的代码覆盖率文件中，文件路径的前缀是 `src/xx/xx`
