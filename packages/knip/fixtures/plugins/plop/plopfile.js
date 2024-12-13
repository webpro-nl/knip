const page = {
  description: 'Create a documentation page',

  prompts: [
    {
      type: 'input',
      name: 'name',
      message: 'What is the page name',
    },
  ],

  actions(prompts) {
    return [
      {
        type: 'add',
        path: `./doc/{{ dashCase name }}.md`,
        templateFile: 'template.hbs',
      },
    ];
  },
};

function plopConfig(plop) {
  plop.setGenerator('Page', page);
}

export default plopConfig;
