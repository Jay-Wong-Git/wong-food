import slugify from "slugify";
import xss from "xss";
import { supabase, supabaseUrl } from "./supabase";

const sql = require("better-sqlite3");

const db = sql("meals.db");

export async function getMeals() {
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  return db.prepare("SELECT * FROM meals").all();
}

export function getMeal(slug) {
  return db.prepare("SELECT * FROM meals WHERE slug = ?").get(slug);
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split(".").pop();
  const filename = `${meal.slug}-${Date.now()}.${extension}`;
  // const stream = fs.createWriteStream(`public/images/${filename}`);
  // const bufferedImage = await meal.image.arrayBuffer();
  // stream.write(Buffer.from(bufferedImage), (error) => {
  //   if (error) {
  //     throw new Error("Saving image failed.");
  //   }
  // });

  await supabase.storage.from("meal-images").upload(filename, meal.image);

  // meal.image = `/images/${filename}`;
  meal.image = `${supabaseUrl}/storage/v1/object/public/meal-images/${filename}`;
  db.prepare(
    `
      INSERT INTO meals 
        (title, summary, instructions, creator, creator_email, image, slug)
      VALUES (
        @title,
        @summary,
        @instructions,
        @creator,
        @creator_email,
        @image,
        @slug
      )
   `
  ).run(meal);
}
