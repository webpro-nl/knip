const compiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;

export default {
  compilers: {
    vue: text => {
      const scripts = [];
      let match: any[];
      // biome-ignore lint/suspicious/noAssignInExpressions:  fixture festa
      while ((match = compiler.exec(text))) scripts.push(match[1]);
      return scripts.join(';');
    },
  },
};
