# babel-plugin-istanbul

用法与 babel-plugin-istanbu 基本相同，但有 2 点不同：

1. 增加可选参数 `filePathLocationType`，如果改为 `relative` 则表示覆盖率数据的 `键名` 为相对路径(相对于 cwd 的路径，一般是根目录)，使用 `prefix` 参数还可以在相对路径前增加自定义路径；不设置参数是绝对路径(打包机器上文件的绝对路径)
2. 增加可选参数 `relativePathPrefix` ，用于在相对路径的前面加上特定的前缀，比如 `code/`，其中可以选填某些已配置好的 git 相关的参数，比如 `store/${project_name}/${branch}/code`，参数如下：
    1. `${commit_hash}`，会替换成 commit 的 hash 值
    2. `${version}`，会替换成 git 仓库的 version
    3. `${branch}`，会替换成当前分支名
    4. `${last_commit_datetime}`，会替换成上次提交的时间
    5. `${remote}`，会替换成远程仓库的地址
    6. `${project_name}`，会替换成项目名
3. 增加可选路径数组参数 `needInjectGitInfoJsPathArr`，表示对此数组中路径的 js 文件进行注入 git 信息，默认值是 `['']`（表示所有文件都会注入，不建议这样，会增加项目体积）， git 信息数据存放在 `window.__git_info__` 上，包含 `branch`、`commit`、`remote` 等信息
4. 增加可选参数 `incrementCoverageDir`，表示生成增量代码覆盖率时，增量增量代码的生效路径，比如 `src`，表示只有 `src` 下的文件变化才会被计算增量覆盖率，如果不设置，则表示所有文件都会被计算增量覆盖率
5. 增加可选参数 `relativePathPrefix`，默认值`''`，表示再相对路径的模式下，生成的代码覆盖率文件中，文件覆盖率对象的`key`的前缀（即相对路径的前缀，以满足自定义路径的需求），比如 `src`，表示生成的代码覆盖率文件中，文件路径的前缀是 `src/xx/xx`
