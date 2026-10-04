import { v } from "convex/values";

export const animationValidator = v.union(
  v.literal("fade"),
  v.literal("zoom"),
  v.literal("slide"),
  v.literal("pop"),
  v.literal("type"),
);

export const slideFields = {
  key: v.string(),
  text: v.string(),
  duration: v.number(),
  bg: v.string(),
  imageId: v.union(v.id("_storage"), v.null()),
  animation: animationValidator,
  textPos: v.union(v.literal("top"), v.literal("center"), v.literal("bottom")),
  textColor: v.union(v.literal("white"), v.literal("black"), v.literal("yellow")),
  textStyle: v.union(v.literal("shadow"), v.literal("box")),
  fontSize: v.number(),
};

export const slideValidator = v.object(slideFields);
