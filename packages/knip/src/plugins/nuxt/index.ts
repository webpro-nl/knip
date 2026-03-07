import type { NuxtOptions } from "nuxt/schema";
import type {
	IsPluginEnabled,
	Plugin,
	RegisterCompilers,
	ResolveConfig,
} from "../../types/config.ts";
import { isDirectory } from "../../util/fs.ts";
import { _syncGlob } from "../../util/glob.ts";
import type { Input } from "../../util/input.ts";
import {
	toAlias,
	toConfig,
	toDeferResolveProductionEntry,
	toDependency,
	toEntry,
	toIgnore,
	toProductionEntry,
} from "../../util/input.ts";
import { loadTSConfig } from "../../util/load-tsconfig.ts";
import { isAbsolute, join, resolve } from "../../util/path.ts";
import { hasDependency } from "../../util/plugin.ts";
import {
	buildAutoImportMap,
	collectIdentifiers,
	collectLocalImportPaths,
	collectTemplateInfo,
	createSourceFile,
	getVueSfc,
	toKebabCase,
} from "./helpers.ts";
import type { NuxtConfig } from "./types.ts";

const title = "Nuxt";

const enablers = ["nuxt", "nuxt-nightly"];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
	hasDependency(dependencies, enablers);

const config = ["nuxt.config.{js,mjs,ts}"];

const entry = ["app.config.ts", "**/*.d.vue.ts"];

const app = ["app.{vue,jsx,tsx}", "error.{vue,jsx,tsx}", "router.options.ts"];
const layout = (dir = "layouts") => join(dir, "**/*.{vue,jsx,tsx}");
const middleware = (dir = "middleware") => join(dir, "**/*.ts");
const pages = (dir = "pages") => join(dir, "**/*.{vue,jsx,tsx}");
const plugins = (dir = "plugins") => join(dir, "**/*.ts");
const modules = "modules/**/*.{ts,vue}";
const server = [
	"api/**/*.ts",
	"middleware/**/*.ts",
	"plugins/**/*.ts",
	"routes/**/*.ts",
	"tasks/**/*.ts",
];

const production: string[] = [
	...app,
	layout(),
	middleware(),
	pages(),
	plugins(),
	modules,
	...server.map((id) => join("server", id)),
];

const setup = async () => {};

const registerCompilers: RegisterCompilers = async ({
	cwd,
	hasDependency,
	registerCompiler,
}) => {
	if (hasDependency("nuxt") || hasDependency("nuxt-nightly")) {
		const vueSfc = getVueSfc(cwd);

		const importMap = new Map<string, string>();
		const componentMap = new Map<string, string[]>();

		const definitionFiles = [
			".nuxt/imports.d.ts",
			".nuxt/components.d.ts",
			".nuxt/types/nitro-routes.d.ts",
			".nuxt/types/nitro-imports.d.ts",
		];

		for (const file of definitionFiles) {
			const sourceFile = createSourceFile(join(cwd, file));
			const maps = buildAutoImportMap(sourceFile);
			for (const [id, specifier] of maps.importMap)
				importMap.set(id, specifier);
			for (const [id, components] of maps.componentMap) {
				const store = componentMap.get(id);
				if (store) store.push(...components);
				else componentMap.set(id, [...components]);
			}
		}

		const getSyntheticImports = (
			identifiers: Set<string>,
			templateTags?: Set<string>,
		) => {
			const syntheticImports: string[] = [];

			for (const [name, specifier] of importMap) {
				if (identifiers.has(name))
					syntheticImports.push(`import { ${name} } from '${specifier}';`);
			}

			if (templateTags) {
				for (const [name, specifiers] of componentMap) {
					const kebab = toKebabCase(name);
					if (
						templateTags.has(name) ||
						templateTags.has(kebab) ||
						templateTags.has(`Lazy${name}`) ||
						templateTags.has(`lazy-${kebab}`)
					) {
						syntheticImports.push(
							`import { default as ${name} } from '${specifiers[0]}';`,
						);
						for (let i = 1; i < specifiers.length; i++)
							syntheticImports.push(`import '${specifiers[i]}';`);
					}
				}
			}

			return syntheticImports;
		};

		const compiler = (source: string, path: string) => {
			const { descriptor } = vueSfc.parse(source, path);
			const scripts: string[] = [];

			if (descriptor.script?.content) scripts.push(descriptor.script.content);
			if (descriptor.scriptSetup?.content)
				scripts.push(descriptor.scriptSetup.content);

			const identifiers = collectIdentifiers(scripts.join("\n"), path);
			let templateTags: Set<string> | undefined;
			if (descriptor.template?.ast) {
				const info = collectTemplateInfo(descriptor.template.ast);
				templateTags = info.tags;
				for (const id of info.identifiers) identifiers.add(id);
			}
			const synthetic = getSyntheticImports(identifiers, templateTags);
			scripts.push(...synthetic);

			return scripts.join(";\n");
		};

		const tsCompiler = (source: string, path: string) => {
			// TODO Can we filter out more files that are outside the realm of auto-imports?
			if (path.endsWith(".d.ts") || path.endsWith(".config.ts")) return source;
			const identifiers = collectIdentifiers(source, path);
			const syntheticImports = getSyntheticImports(identifiers);
			if (syntheticImports.length === 0) return source;
			return `${source}\n${syntheticImports.join("\n")}`;
		};

		registerCompiler({ extension: ".vue", compiler });
		registerCompiler({ extension: ".ts", compiler: tsCompiler });
	}
};

const resolveConfig: ResolveConfig<NuxtConfig> = async (
	_localConfig,
	options,
) => {
	const inputs: Input[] = [];

	const { loadNuxt, resolveAlias } = await import("nuxt/kit");
	const nuxt = await loadNuxt({
		cwd: options.cwd,
		// we want to register hooks before proceeding with nuxt lifecycle
		ready: false,
		overrides: {
			// used to skip expensive build-time startup cost
			_prepare: true,
		},
	});

	const extensionGlob = nuxt.options.extensions.join(",");

	const availableSources = new Set<string>();
	const dependencies = new Set<string>();

	nuxt.hook("imports:extend", (imports) => {
		for (const i of imports) {
			if (isAbsolute(i.from)) {
				availableSources.add(i.from);
			} else {
				dependencies.add(i.from);
			}
		}
	});

	nuxt.hook("components:extend", (components) => {
		for (const c of components) {
			if (isAbsolute(c.filePath)) {
				availableSources.add(c.filePath);
			}
		}
	});

	await nuxt.ready();

	// 1. dependencies (modules)
	for (const m of nuxt.options._installedModules) {
		if (m.entryPath) {
			inputs.push(toProductionEntry(m.entryPath));
		} else if (m.meta.name && !m.meta.name.startsWith("nuxt:")) {
			dependencies.add(m.meta.name);
		}
	}

	// 2. dependencies (layers)
	for (const l of nuxt.options.extends || []) {
		const layerName = Array.isArray(l) ? l[0] : l;
		if (typeof layerName === "string") {
			dependencies.add(layerName);
		}
	}

	// 3. user code
	const isPagesEnabled = nuxt.options.pages !== false;
	const pagesPatterns =
		typeof nuxt.options.pages === "boolean" || !nuxt.options.pages.pattern
			? [`**/*{${extensionGlob}}`]
			: toArray(nuxt.options.pages.pattern);

	const isNitroImportsEnabled =
		nuxt.options.nitro.imports !== false && nuxt.options.imports.scan !== false;

	for (const layer of nuxt.options._layers) {
		const config =
			layer.cwd === nuxt.options.rootDir
				? nuxt.options
				: (layer.config as NuxtOptions);
		const srcDir = layer.config.srcDir || layer.cwd;
		const rootDir = layer.cwd;

		const middlewareDir = resolve(
			srcDir,
			resolveAlias(config.dir?.middleware || "middleware", nuxt.options.alias),
		);
		const pluginsDir = resolve(
			srcDir,
			resolveAlias(config.dir?.plugins || "plugins", nuxt.options.alias),
		);
		const serverDir = resolve(
			srcDir,
			resolveAlias(config.serverDir || "server", nuxt.options.alias),
		);

		const entryPatterns: string[] = [
			// nitro routes
			resolve(
				serverDir,
				config.nitro.apiDir || "api",
				`**/*{${extensionGlob}}`,
			),
			resolve(
				serverDir,
				config.nitro.routesDir || "routes",
				`**/*{${extensionGlob}}`,
			),
			resolve(serverDir, `middleware/**/*{${extensionGlob}}`),
			resolve(serverDir, `plugins/**/*{${extensionGlob}}`),
			resolve(serverDir, `tasks/**/*{${extensionGlob}}`),
			// nuxt app
			resolve(
				srcDir,
				resolveAlias(config.dir?.layouts || "layouts", nuxt.options.alias),
				`**/*{${extensionGlob}}`,
			),
			join(middlewareDir, `*{${extensionGlob}}`),
			join(middlewareDir, `*/index{${extensionGlob}}`),
			join(pluginsDir, `*{${extensionGlob}}`),
			join(pluginsDir, `*/index{${extensionGlob}}`),
			join(srcDir, `app{${extensionGlob}}`),
			join(srcDir, `App{${extensionGlob}}`),
		];

		// file-system routing integration with vue-router
		if (isPagesEnabled) {
			for (const pattern of pagesPatterns) {
				entryPatterns.push(
					resolve(
						srcDir,
						resolveAlias(config.dir?.pages || "pages", nuxt.options.alias),
						pattern,
					),
				);
			}
		}

		// add nitro auto-imported paths to cover edge case where they are
		// enabled for nitro but not for nuxt
		if (isNitroImportsEnabled) {
			availableSources.add(
				resolve(
					rootDir,
					config.dir.shared ?? "shared",
					`utils/*{${extensionGlob}}`,
				),
			);
			availableSources.add(
				resolve(
					rootDir,
					config.dir.shared ?? "shared",
					`types/*{${extensionGlob}}`,
				),
			);
		}

		inputs.push(...entryPatterns.map((s) => toProductionEntry(s)));
	}

	// TODO: we need to register these as source files which may not be all used
	for (const path of availableSources) {
		inputs.push(toProductionEntry(path, { allowIncludeExports: true }));
	}

	for (const dep of dependencies) {
		inputs.push(toDependency(dep));
	}

	for (const alias in nuxt.options.alias) {
		inputs.push(toAlias(alias, nuxt.options.alias[alias]));
	}

	await nuxt.close();

	return inputs;
};

function toArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : value ? [value] : [];
}

/** @public */
export const docs = {};

const plugin: Plugin = {
	title,
	enablers,
	isEnabled,
	config,
	entry,
	production,
	setup,
	resolveConfig,
	registerCompilers,
};

export default plugin;
