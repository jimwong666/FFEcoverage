# auto-report-coverage

覆盖率报告自动上报工具

1. 定时上报，针对单页面应用
2. 离开页面是上报，虽然会有不稳定的现象，但二者搭配会相对稳定些

```
注意点： 上报结束后，都会清空本地的覆盖率缓存
```

## 参数 ARCprops

1. 可选参数 `ARCprops.reportURL`，覆盖率上报地址
2. 可选参数 `ARCprops.autoReportInterval`，覆盖率自动上报的时间间隔（ms）
3. 可选参数 `ARCprops.coverageVariable`，覆盖率 window 对象下全局变量名
4. 可选参数 `ARCprops.successCallback`，上报成功回调函数
5. 可选参数 `ARCprops.failedCallback`，上报失败回调函数
6. 可选参数 `ARCprops.params`，上报请求的 params 参数
