/**
 * CSS Module class-name utility factory.
 *
 * Each dashboard imports its own CSS module and calls createCx(styles)
 * to get a bound cx function. The cx function resolves class names
 * against the module, falling back to the raw string for global classes.
 *
 * @example
 *   import styles from "./my-component.module.css";
 *   import { createCx } from "@/lib/utils/cx";
 *   const cx = createCx(styles);
 *   cx("card", isActive && "cardActive", "globalClass");
 */

/** A CSS modules record — keys are local names, values are scoped class strings */
export type CssModuleStyles = Record<string, string>;

/** Create a cx function bound to a specific CSS module styles object */
export function createCx(styles: CssModuleStyles) {
  return (...names: Array<string | false | null | undefined>): string =>
    names
      .filter(Boolean)
      .map((name) => styles[name as string] ?? name)
      .join(" ");
}
