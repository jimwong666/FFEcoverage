# babel-plugin-istanbul

基于 babel-plugin-istanbu@4.1.6，适用于 babel6，用法基本相同，但有 2 点不同：

1. 增加可选参数 `filePathLocationType`，默认覆盖率数据的 `键名` 为相对路径(相对于 cwd 的路径，一般是根目录)，使用 `prefix` 参数还可以在相对路径前增加自定义路径；设置 `absolute` 是绝对路径(打包机器上文件的绝对路径)
2. 增加可选参数 `relativePathPrefix` ，用于在相对路径的前面加上特定的前缀，比如 `code/`，其中可以选填某些已配置好的 git 相关的参数，比如 `store/${project_name}/${branch}/code`，参数如下：
    1. `${commit_hash}`，会替换成 commit 的 hash 值
    2. `${version}`，会替换成 git 仓库的 version
    3. `${branch}`，会替换成当前分支名
    4. `${last_commit_datetime}`，会替换成上次提交的时间
    5. `${remote}`，会替换成远程仓库的地址
    6. `${project_name}`，会替换成项目名
3. 增加可选路径数组参数 `needInjectGitInfoJsPathArr`，表示对此数组中路径的 js 文件进行注入 git 信息，默认值是 `['']`（表示所有文件都会注入，不建议这样，会增加项目体积）， git 信息数据存放在 `window.__git_info__` 上，包含 `branch`、`commit`、`remote` 等信息
4. 增加可选参数 `incrementCoverageDir`，表示生成增量代码覆盖率时，增量增量代码的生效路径，比如 `src`，表示只有 `src` 下的文件变化才会被计算增量覆盖率，如果不设置，则表示所有文件都会被计算增量覆盖率
5. 增加可选参数 `coverageVariable`，表示覆盖率数据在全局对象下面的变量名，默认是 `__coverage__`
6. 增加可选参数 `reportOriginalCoverageFlag`，表示是否上报覆盖率源数据，默认是 `false`
7. 增加可选参数 `reportURL`，表示覆盖率源数据上报的 url，如果 `reportOriginalCoverageFlag` 是 `true`，则此字段必填
8. 增加可选参数 `maxWaitingTimes`，表示覆盖率源数据上报超时次数，默认是 `6`，如果超过这个阈值，则上报逻辑结束
