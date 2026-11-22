export type Recipe = {
  id: string;
  name: string;
  blurb: string;
  time: string;
  makes: string;
  ingredients: string[];
  steps: string[];
};

export const recipes: Recipe[] = [
  {
    id: 'sugar',
    name: 'Classic sugar cookies',
    blurb: 'The roll-and-cut ones that hold a tree shape.',
    time: '40 min plus chilling',
    makes: 'about 3 dozen',
    ingredients: [
      '1 cup butter, softened',
      '1 cup sugar',
      '1 egg',
      '2 teaspoons vanilla',
      '3 cups flour',
      '1/2 teaspoon salt',
    ],
    steps: [
      'Beat butter and sugar until fluffy. Mix in the egg and vanilla.',
      'Add flour and salt. Divide the dough, wrap it, and chill at least an hour.',
      'Roll to about 1/4 inch and cut shapes. Bake at 350°F for 8 to 10 minutes, until the edges just turn golden.',
      'Cool, then ice. A spoon of milk in a cup of powdered sugar plus a drop of vanilla is enough icing to start.',
    ],
  },
  {
    id: 'gingerbread',
    name: 'Gingerbread people',
    blurb: 'Dark, spicy, and sturdy enough for icing buttons.',
    time: '45 min plus chilling',
    makes: 'about 2 dozen',
    ingredients: [
      '3 cups flour',
      '1 teaspoon baking soda',
      '2 teaspoons ginger',
      '1 teaspoon cinnamon',
      '1/2 teaspoon cloves',
      '1/2 teaspoon salt',
      '3/4 cup butter',
      '3/4 cup brown sugar',
      '1/2 cup molasses',
      '1 egg',
    ],
    steps: [
      'Whisk the dry ingredients.',
      'Beat butter and brown sugar, then molasses and the egg. Stir in the flour mixture.',
      'Chill the dough for an hour. Roll, cut, and bake at 350°F for about 10 minutes.',
      'Cool completely before icing, or the buttons slide off.',
    ],
  },
  {
    id: 'snickerdoodle',
    name: 'Snickerdoodles',
    blurb: 'Soft cinnamon sugar cookies. Hard to keep in the tin.',
    time: '30 min',
    makes: 'about 3 dozen',
    ingredients: [
      '1 cup butter, softened',
      '1 1/2 cups sugar',
      '2 eggs',
      '2 3/4 cups flour',
      '2 teaspoons cream of tartar',
      '1 teaspoon baking soda',
      '1/2 teaspoon salt',
      '3 tablespoons sugar and 1 tablespoon cinnamon, for rolling',
    ],
    steps: [
      'Beat butter, sugar, and eggs.',
      'Stir in flour, cream of tartar, baking soda, and salt.',
      'Roll tablespoon scoops in the cinnamon sugar.',
      'Bake at 375°F for 8 to 10 minutes. They should look slightly underdone in the middle.',
    ],
  },
  {
    id: 'shortbread',
    name: 'Butter shortbread',
    blurb: 'Three ingredients and a pan. Slice after it cools a little.',
    time: '40 min',
    makes: 'one 8-inch pan',
    ingredients: ['1 cup butter, softened', '1/2 cup sugar', '2 cups flour', 'a pinch of salt'],
    steps: [
      'Beat butter and sugar. Mix in flour and salt until a soft dough forms.',
      'Press into an 8-inch square pan. Prick with a fork and score the squares you want later.',
      'Bake at 325°F for about 30 minutes, until pale gold.',
      'Cool 10 minutes, then cut along the scores.',
    ],
  },
  {
    id: 'crinkle',
    name: 'Chocolate crinkles',
    blurb: 'Fudgy centers, powdered-sugar cracks.',
    time: '30 min plus chilling',
    makes: 'about 3 dozen',
    ingredients: [
      '1 cup cocoa',
      '1 1/2 cups sugar',
      '1/2 cup oil',
      '4 eggs',
      '2 teaspoons vanilla',
      '2 cups flour',
      '2 teaspoons baking powder',
      '1/2 teaspoon salt',
      'powdered sugar, for rolling',
    ],
    steps: [
      'Stir cocoa, sugar, and oil. Beat in eggs and vanilla.',
      'Add flour, baking powder, and salt. Chill at least 2 hours.',
      'Roll balls in powdered sugar until they look snowy.',
      'Bake at 350°F for about 10 minutes.',
    ],
  },
  {
    id: 'blossoms',
    name: 'Peanut butter blossoms',
    blurb: 'A chocolate kiss pressed into a warm cookie.',
    time: '30 min',
    makes: 'about 3 dozen',
    ingredients: [
      '1/2 cup butter',
      '1/2 cup peanut butter',
      '1/2 cup sugar',
      '1/2 cup brown sugar',
      '1 egg',
      '1 teaspoon vanilla',
      '1 3/4 cups flour',
      '1 teaspoon baking soda',
      '1/4 teaspoon salt',
      'sugar for rolling, and chocolate kisses',
    ],
    steps: [
      'Beat butter, peanut butter, and both sugars. Add the egg and vanilla.',
      'Stir in flour, baking soda, and salt.',
      'Roll balls in sugar. Bake at 375°F for 8 minutes.',
      'Press a kiss into each cookie as soon as they come out. Cool so the chocolate sets.',
    ],
  },
  {
    id: 'bark',
    name: 'Peppermint bark',
    blurb: 'The tin that disappears at the office party.',
    time: '20 min plus chilling',
    makes: 'about a pound',
    ingredients: [
      '8 ounces dark chocolate',
      '8 ounces white chocolate',
      '6 candy canes, crushed',
      'a pinch of salt',
    ],
    steps: [
      'Melt the dark chocolate. Spread it on parchment about 1/4 inch thick. Chill until firm.',
      'Melt the white chocolate and spread it over the dark layer.',
      'Scatter candy canes and salt. Chill again, then break into pieces.',
    ],
  },
  {
    id: 'spritz',
    name: 'Spritz cookies',
    blurb: 'Buttery presses. A star disk does most of the decorating.',
    time: '30 min',
    makes: 'about 4 dozen',
    ingredients: [
      '1 cup butter, softened',
      '3/4 cup sugar',
      '1 egg',
      '1 teaspoon vanilla or almond extract',
      '2 1/4 cups flour',
      '1/2 teaspoon salt',
    ],
    steps: [
      'Beat butter and sugar. Add the egg and extract.',
      'Mix in flour and salt. The dough should be soft but hold a shape.',
      'Press onto an ungreased sheet. Bake at 375°F for 7 to 9 minutes.',
      'Add sprinkles before baking if you want them to stick.',
    ],
  },
];

export function recipeById(id: string): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id);
}
