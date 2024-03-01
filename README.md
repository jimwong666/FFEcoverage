# FFEcoverage

## 依赖安装

-   1、安装依赖 pnpm install
-   2、针对特定包安装依赖 pnpm add lodash --filter "./packages/\a-package"，针对所有包 pnpm add lodash --filter "./packages/\*"，针对外层根目录 pnpm add lodash（这里使用了 pnpm 的 workspace，就不能使用 lerna 的装包操作了）

## 项目待办

-   1、外层的开发辅助工具开发
    -   强制提交规范 commitizen（命令行提示工具，参考），commitlint（校验填写的 commit message 是否符合设定的规范），Husky（git hook 工具，用于在提交过程中的某个特定时刻触发 commitlint）/yorkie？，lint-staged（在提交前校验代码是否符合规范）
    -   eslint，Stylelint，Prettier
    -   参考 cz-lerna-changelog 工具，changelog 工具，lerna 项目相对于正常项目有少许区别
-   2、
