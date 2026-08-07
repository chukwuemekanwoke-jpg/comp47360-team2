import { ImageSourcePropType } from "react-native";

// Generic per-cuisine banner photos (Unsplash-licensed, bundled with the
// app). Keyed by lowercase cuisine name as returned by the backend — the
// fallback covers any cuisine we don't have a photo for. Coverage is driven
// by the most common cuisines in the seeded Manhattan data (Midtown query,
// July 2026): american 131, italian 19, coffee 18, pizza 10, asian 10,
// irish 8, mexican 7, bakery_products 7, steakhouse 7, chinese 6,
// japanese 6, frozen_desserts 5, donuts 5, seafood 4, french 4, indian 4,
// sandwiches 4, juice 4, thai 3.
const CUISINE_IMAGES: Record<string, ImageSourcePropType> = {
  american: require("../../assets/cuisines/american.jpg"),
  asian: require("../../assets/cuisines/asian.jpg"),
  bakery_products: require("../../assets/cuisines/bakery_products.jpg"),
  chinese: require("../../assets/cuisines/chinese.jpg"),
  coffee: require("../../assets/cuisines/coffee.jpg"),
  donuts: require("../../assets/cuisines/donuts.jpg"),
  french: require("../../assets/cuisines/french.jpg"),
  frozen_desserts: require("../../assets/cuisines/frozen_desserts.jpg"),
  indian: require("../../assets/cuisines/indian.jpg"),
  irish: require("../../assets/cuisines/irish.jpg"),
  italian: require("../../assets/cuisines/italian.jpg"),
  japanese: require("../../assets/cuisines/japanese.jpg"),
  juice: require("../../assets/cuisines/juice.jpg"),
  mexican: require("../../assets/cuisines/mexican.jpg"),
  pizza: require("../../assets/cuisines/pizza.jpg"),
  sandwiches: require("../../assets/cuisines/sandwiches.jpg"),
  seafood: require("../../assets/cuisines/seafood.jpg"),
  steakhouse: require("../../assets/cuisines/steakhouse.jpg"),
  thai: require("../../assets/cuisines/thai.jpg"),
  vietnamese: require("../../assets/cuisines/vietnamese.jpg"),
};

const GENERIC_IMAGE: ImageSourcePropType = require("../../assets/cuisines/generic.jpg");

export function cuisineImage(cuisine: string): ImageSourcePropType {
  return CUISINE_IMAGES[cuisine.trim().toLowerCase()] ?? GENERIC_IMAGE;
}

// Pass to every <ImageBackground> holding one of these photos, as `imageStyle`.
//
// ImageBackground sizes its inner <Image> from `StyleSheet.flatten(style)`, and
// on web NativeWind hands the size down as a class name rather than as style
// values — so the flatten yields no width/height and react-native-web falls
// back to the asset's intrinsic size (640x320 for these photos). The image then
// renders at 640x320 inside an 80px-tall band: a hugely magnified corner crop
// that also bleeds down over the card text below it, which in light mode leaves
// dark text sitting unreadably on a photo. Pinning the image to 100% of its
// container overrides that fallback. No-op on native, where the image is
// already laid out by absoluteFill.
export const CUISINE_IMAGE_FILL = { width: "100%", height: "100%" } as const;

// Backend cuisine keys like "bakery_products" aren't fit for display — swap
// underscores for spaces and title-case each word ("Bakery Products"). Callers
// that style the text uppercase (photo bands, chips) are unaffected, since the
// CSS transform wins over the casing applied here.
export function formatCuisine(cuisine: string): string {
  return cuisine
    .replace(/_/g, " ")
    .replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}
