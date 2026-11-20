// Справочник продуктов. КБЖУ на 100 г — приблизительные средние значения
// (в готовом виде для круп, мяса, рыбы и бобовых). Не заменяет консультацию специалиста.
export type FoodSeed = {
  slug: string;
  name: string;
  nameEn: string;
  category: "grains" | "protein" | "dairy" | "vegetables" | "fruits" | "fats" | "legumes";
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  servingG: number;
};

const f = (
  slug: string,
  name: string,
  nameEn: string,
  category: FoodSeed["category"],
  kcal: number,
  protein: number,
  fat: number,
  carbs: number,
  servingG: number,
): FoodSeed => ({ slug, name, nameEn, category, kcal, protein, fat, carbs, servingG });

export const FOODS: FoodSeed[] = [
  // Крупы и хлеб
  f("oatmeal", "Овсяные хлопья (сухие)", "Rolled oats (dry)", "grains", 370, 13, 7, 62, 50),
  f("buckwheat", "Гречка варёная", "Buckwheat, cooked", "grains", 110, 4, 1, 21, 180),
  f("rice", "Рис варёный", "Rice, cooked", "grains", 130, 2.7, 0.3, 28, 180),
  f("pasta", "Макароны варёные", "Pasta, cooked", "grains", 158, 5.8, 0.9, 31, 180),
  f("whole-grain-bread", "Хлеб цельнозерновой", "Whole-grain bread", "grains", 250, 9, 3.5, 43, 40),
  f("potato", "Картофель варёный", "Potato, boiled", "grains", 82, 2, 0.1, 17, 200),
  f("sweet-potato", "Батат запечённый", "Sweet potato, baked", "grains", 90, 2, 0.1, 21, 200),
  // Белок
  f(
    "chicken-breast",
    "Куриная грудка (готовая)",
    "Chicken breast, cooked",
    "protein",
    165,
    31,
    3.6,
    0,
    150,
  ),
  f("turkey", "Филе индейки (готовое)", "Turkey fillet, cooked", "protein", 135, 29, 1.5, 0, 150),
  f("beef", "Говядина постная (готовая)", "Lean beef, cooked", "protein", 200, 27, 10, 0, 150),
  f("salmon", "Лосось (готовый)", "Salmon, cooked", "protein", 208, 20, 13, 0, 150),
  f("cod", "Треска (готовая)", "Cod, cooked", "protein", 82, 18, 0.7, 0, 180),
  f(
    "tuna-canned",
    "Тунец консервированный в соку",
    "Canned tuna in water",
    "protein",
    116,
    26,
    1,
    0,
    100,
  ),
  f("egg", "Яйцо куриное", "Chicken egg", "protein", 143, 12.6, 9.5, 0.7, 55),
  f("tofu", "Тофу", "Tofu", "protein", 76, 8, 4.8, 1.9, 120),
  f(
    "whey-protein",
    "Протеин сывороточный (порошок)",
    "Whey protein (powder)",
    "protein",
    400,
    80,
    6,
    8,
    30,
  ),
  // Молочные
  f("cottage-cheese", "Творог 5%", "Cottage cheese 5%", "dairy", 121, 17, 5, 1.8, 150),
  f(
    "greek-yogurt",
    "Греческий йогурт натуральный",
    "Plain Greek yogurt",
    "dairy",
    59,
    10,
    0.4,
    3.6,
    150,
  ),
  f("milk", "Молоко 2.5%", "Milk 2.5%", "dairy", 52, 3, 2.5, 4.8, 250),
  f("kefir", "Кефир 1%", "Kefir 1%", "dairy", 40, 3, 1, 4, 250),
  f("hard-cheese", "Сыр твёрдый", "Hard cheese", "dairy", 350, 25, 27, 0, 30),
  // Овощи
  f("cucumber", "Огурец", "Cucumber", "vegetables", 15, 0.8, 0.1, 3, 120),
  f("tomato", "Помидор", "Tomato", "vegetables", 18, 0.9, 0.2, 3.9, 120),
  f("broccoli", "Брокколи варёная", "Broccoli, cooked", "vegetables", 34, 2.8, 0.4, 7, 150),
  f("spinach", "Шпинат", "Spinach", "vegetables", 23, 2.9, 0.4, 3.6, 80),
  f("carrot", "Морковь", "Carrot", "vegetables", 41, 0.9, 0.2, 10, 80),
  f("bell-pepper", "Перец болгарский", "Bell pepper", "vegetables", 31, 1, 0.3, 6, 120),
  f("cabbage", "Капуста белокочанная", "Cabbage", "vegetables", 25, 1.3, 0.1, 6, 120),
  f("zucchini", "Кабачок", "Zucchini", "vegetables", 17, 1.2, 0.3, 3.1, 150),
  // Фрукты и ягоды
  f("banana", "Банан", "Banana", "fruits", 89, 1.1, 0.3, 23, 120),
  f("apple", "Яблоко", "Apple", "fruits", 52, 0.3, 0.2, 14, 180),
  f("orange", "Апельсин", "Orange", "fruits", 47, 0.9, 0.1, 12, 150),
  f("blueberries", "Черника", "Blueberries", "fruits", 57, 0.7, 0.3, 14, 100),
  f("avocado", "Авокадо", "Avocado", "fruits", 160, 2, 15, 9, 100),
  // Жиры, орехи, сладкое
  f("almonds", "Миндаль", "Almonds", "fats", 579, 21, 50, 22, 30),
  f("walnuts", "Грецкие орехи", "Walnuts", "fats", 654, 15, 65, 14, 30),
  f("peanut-butter", "Арахисовая паста", "Peanut butter", "fats", 588, 25, 50, 20, 30),
  f("olive-oil", "Оливковое масло", "Olive oil", "fats", 884, 0, 100, 0, 10),
  f("honey", "Мёд", "Honey", "fats", 304, 0.3, 0, 82, 20),
  // Бобовые
  f("lentils", "Чечевица варёная", "Lentils, cooked", "legumes", 116, 9, 0.4, 20, 180),
  f("chickpeas", "Нут варёный", "Chickpeas, cooked", "legumes", 164, 8.9, 2.6, 27, 150),
  f("beans", "Фасоль варёная", "Beans, cooked", "legumes", 127, 8.7, 0.5, 22, 150),
];
