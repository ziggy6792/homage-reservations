import { Service, Inject } from 'typedi';

import RoundRepository from 'src/repositories/round.respository';
import { Recipe } from './recipe.type';
import { RecipeInput } from './recipe.input';

// this service will be global - shared by every request
@Service({ global: true })
export class RecipeService {
  private autoIncrementValue: number;

  constructor(@Inject('SAMPLE_RECIPES') private readonly items: Recipe[], private readonly repository: RoundRepository) {
    this.autoIncrementValue = items.length;
  }

  async getAll() {
    console.log('roundRepository exists', !!this.repository);
    return this.items;
  }

  async getOne(id: string) {
    return this.items.find((it) => it.id === id);
  }

  async add(data: RecipeInput) {
    const recipe = this.createRecipe(data);
    this.items.push(recipe);
    return recipe;
  }

  private createRecipe(recipeData: Partial<Recipe>): Recipe {
    const recipe = Object.assign(new Recipe(), {
      ...recipeData,
      id: this.getId(),
    });
    return recipe;
  }

  private getId(): string {
    return (++this.autoIncrementValue).toString();
  }
}
