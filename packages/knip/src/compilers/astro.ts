import type { Node } from "@astrojs/compiler/types";
import type { HasDependency } from "./types.js";
import { is } from "@astrojs/compiler/utils";
import { parse } from "@astrojs/compiler";

const condition = (hasDependency: HasDependency) => hasDependency("astro");

const compiler = async (text: string) => {
  const detected: string[] = [];

  const traverse = (parent: Node) => {
    if (is.frontmatter(parent)) {
      detected.push(parent.value);
    }

    if (is.tag(parent) && parent.name === "script") {
      const scriptText = parent?.children
        .filter((child) => child.type === "text")
        .map((child) => child.value);
      detected.push(...scriptText);
    } else if ("children" in parent) {
      return parent.children.forEach((child) => traverse(child));
    }
  };

  const parseResult = await parse(text, {
    position: false, // defaults to `true`
  });

  traverse(parseResult.ast);

  const compiled = [...detected].join("\n");

  return compiled;
};

export default { condition, compiler };
