import { Service } from 'typedi';
import { Resolver, Query, Arg, Ctx, Mutation } from 'type-graphql';

import { Logger } from 'src/logger';
import Context from 'src/typegraphql-setup/context';
import { Recipe } from './recipe.type';
import { RecipeService } from './recipe.service';
import { RecipeInput } from './recipe.input';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => Recipe)
export class RecipeResolver {
  constructor(private readonly recipeService: RecipeService, private readonly logger: Logger) {
    console.log('RecipeResolver created!');
  }

  @Query((returns) => Recipe, { nullable: true })
  async recipe(@Arg('recipeId') recipeId: string, @Ctx() { requestId }: Context) {
    const recipe = await this.recipeService.getOne(recipeId);
    if (!recipe) {
      console.log('request ID:', requestId); // the same requestId that logger has
      this.logger.log(`Recipe ${recipeId} not found!`);
    }
    return recipe;
    //
  }

  @Query((returns) => [Recipe])
  async recipes(): Promise<Recipe[]> {
    // await delay(5000); // simulate delay to allow for manual concurrent requests
    this.logger.log(`Test`);
    return this.recipeService.getAll();
  }

  //
  @Mutation((returns) => Recipe)
  async addRecipe(@Arg('recipe') recipe: RecipeInput): Promise<Recipe> {
    return this.recipeService.add(recipe);
  }
}
