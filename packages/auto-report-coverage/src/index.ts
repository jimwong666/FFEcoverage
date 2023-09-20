export interface ARCprops {
	coverageVariable?: string;
	interval?: number;
	reportURL?: string;
	params?: Record<string, unknown>;
}

type Global = {
	__git_info__: {
		branch: string;
		commit_hash: string;
		last_commit_datetime: string;
		project_name: string;
		remote: string;
		version: string;
	};
	__coverage__: Record<string, unknown>;
} & Record<string, unknown>;

const ARC = (props: ARCprops): void => {
	const global: Global = new Function("return this")();

	const {
		interval = 5 * 60 * 1000,
		reportURL = "http://localhost:8050/remote",
		coverageVariable = "__coverage__",
		params = {},
	} = props || {};

	setInterval(() => {
		fetch(reportURL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json;charset=utf-8",
			},
			body: JSON.stringify({
				data: global[coverageVariable],
				remote: global.__git_info__.remote,
				branch: global.__git_info__.branch,
				project_name: global.__git_info__.project_name,
				...params,
			}),
		})
			.then((res) => res.json())
			.then((json) => {
				const { success, message } = json;
				if (success) {
					console.log(message);

					// 重置 coverage 统计数据
					const cocerageData = global[coverageVariable] as any;
					for (const i in cocerageData) {
						for (const r in cocerageData[i].b) {
							cocerageData[i].b[r].fill(0);
						}
						for (const m in cocerageData[i].f) {
							cocerageData[i].f[m] = 0;
						}
						for (const n in cocerageData[i].s) {
							cocerageData[i].s[n] = 0;
						}
					}
				} else {
					console.error(message);
				}
			})
			.catch((err) => console.log("Request Failed", err));
	}, interval);
};

export default ARC;
