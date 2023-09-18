# babel-plugin-istanbul

用法与 babel-plugin-istanbu 基本相同，但有 2 点不同：

1. 增加可配置参数 `sourceFilePath`，如果改为 `relative` 则表示覆盖率数据的键名为相对路径，默认是绝对路径（不设置参数）
2. 增加 `prefix` 前缀参数，在路径的前面加上特定的前缀，比如 `code\\`，其中可以选填某些已配置好的 git 相关的参数，比如 `store\\${project_name}\\${branch}\\code`，参数如下：
    1. `${commit_hash}`，会替换成 commit 的 hash 值
    2. `${version}`，会替换成 git 仓库的 version
    3. `${branch}`，会替换成当前分支名
    4. `${last_commit_datetime}`，会替换成上次提交的时间
    5. `${remote}`，会替换成远程仓库的地址
    6. `${project_name}`，会替换成项目名
