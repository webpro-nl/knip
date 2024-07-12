import type { PluginOptions } from "#p/types/plugins.ts";
import { isInternal, toAbsolute } from "#p/util/path.ts";
import { load, resolveEntry } from "#p/util/plugin.ts";
import { dirname } from "path";
import type { CypressConfig } from "./types.js";

export const resolveDependencies = async (config: CypressConfig, options: PluginOptions) => {
    const {reporter} = config;
    const { configFileDir } = options;

    const resolve = (specifier: string) => resolveEntry(options, specifier);

    // Initialize the array of reporters with the initial reporter if present.
    const reporters = reporter ? [reporter] : [];
    // https://github.com/YOU54F/cypress-plugins/tree/master/cypress-multi-reporters#configuring-reporters
    if(reporter === 'cypress-multi-reporters' && config.reporterOptions?.configFile){
        // Try to resolve the config file if present and attach the reporters listed in it.
        const {configFile} = config.reporterOptions;
        const configFilePath = toAbsolute(configFile, configFileDir);
        if(isInternal(configFilePath)){
            const reporterConfig = await load(configFilePath);
            if(typeof reporterConfig === 'object' && reporterConfig.reporterEnabled){
                const {reporterEnabled: reporterConcatenatedNames} = reporterConfig;
                const reporterNames = reporterConcatenatedNames.split(', ');
                for(const reporterName of reporterNames){
                    reporters.push(resolve(reporterName));
                }
            }
        }
    }
    return [
        ...reporters
    ]
}
