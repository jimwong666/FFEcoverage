# FFEcoverage

前端代码覆盖率解决方案

# Getting Started

本项目使用多包管理，技术栈是 lerna，参考[lerna 文档](https://lerna.js.org/docs/introduction)；依赖包管理使用 [pnpm](https://pnpm.io/zh/motivation)，所以依赖安装与更新不要使用 lerna，也不要使用 npm 和 yarn；
lerna 和 pnpm 的结合使用可以参考介绍文章 [lerna + pnpm](https://lerna.js.org/docs/recipes/using-pnpm-with-lerna)

## 使用指引

-   pnpm install：安装所有包的依赖
-   pnpm install <R 依赖包名> --filter "<A 包名称>"：安装 R 依赖到 A 包
-   npm run commit：代码提交
-   lerna publish：发布包，按照指引选择
-   npm run release：外层整体生成 release

# 待办

-   1、~~无法进行静态数据生成，数据必须要等到运行时才能生成（这块可以打包流程时在 babel 对代码进行插桩时持久化到本地，然后发送到上报服务，这里需要考虑怎么持久化和打包完成后怎么发送方式）~~
-   2、打包时的实时上报也要同步到 grunt-istanbul 和 gulp-istanbul
-   3、此项目默认分支是从 master 上切，所以增量覆盖率只对比了 master，无法自定义增量对比（这里可以新增一个变量用于存储用户选择的分支名称，最后对比时用这个变量就好）
-   4、高并发时解决方案
-   5、外层的开发辅助工具开发 eslint、Stylelint、Prettier，等
-   6、~~将交叉依赖的包全部迁移至内部依赖~~
-   7、目前项目最终用户使用产物 babel-plugin-istanbul，基于 bable 6 的开发，babel 7 经测试也能用，但是某些插件并没有基于最新版本来二次开发，所以后面再 babel 7 上使用有问题的话就需要升级一些插件
