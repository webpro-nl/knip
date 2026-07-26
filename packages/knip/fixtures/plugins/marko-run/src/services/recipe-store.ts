const recipes = [{ title: 'Sourdough', slug: 'sourdough' }];

export const listRecipes = (query: string) => recipes.filter(recipe => recipe.title.includes(query));

export const findRecipe = (slug: string) => recipes.find(recipe => recipe.slug === slug);
