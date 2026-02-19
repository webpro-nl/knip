const components = require.context('./components', true, /\.js$/);
components;

const routes = require.context('.', false, /\.\/routes\.ts$/);
routes;
