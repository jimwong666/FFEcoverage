## istanbul-lib-instrument

基于 istanbul-lib-instrument，在它的功能上增加了：

1. ~~window[${GLOBAL_COVERAGE_VAR}_initial] 的值，表示初始化时的覆盖率信息，即执行次数都是 0 的数据~~
2. 增加可选路径数组参数 `reportCoverageJSRelativePath`，默认值是 `['']`，对数组中的路径进行注入 git 信息， git 信息数据在 `window.__git_info__` 上，包含 `branch`、`commit`、`remote` 等信息
