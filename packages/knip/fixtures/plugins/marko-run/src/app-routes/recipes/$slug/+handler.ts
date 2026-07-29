import { findRecipe } from '../../../services/recipe-store.ts';

export const GET = (context: { params: { slug: string } }) => Response.json(findRecipe(context.params.slug));
