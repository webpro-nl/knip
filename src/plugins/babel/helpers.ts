export const resolvePluginName = (pluginName: string) => {
  if (!/babel/.test(pluginName)) return `babel-plugin-${pluginName}`;
  if (pluginName.startsWith('@babel/')) {
    if (pluginName.startsWith('@babel/plugin')) return pluginName;
    const [, name] = pluginName.split('/');
    return `@babel/plugin-${name}`;
  }
  return pluginName;
};

export const resolvePresetName = (pluginName: string) => {
  if (!/babel/.test(pluginName)) return `babel-preset-${pluginName}`;
  if (pluginName.startsWith('@babel/')) {
    if (pluginName.startsWith('@babel/preset')) return pluginName;
    const [, name] = pluginName.split('/');
    return `@babel/preset-${name}`;
  }
  return pluginName;
};
