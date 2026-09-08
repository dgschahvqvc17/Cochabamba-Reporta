/**
 * Declaraciones globales para recursos estáticos (imágenes).
 *
 * Permite usar require()/import de imágenes con TypeScript.
 *
 * @format
 */

declare function require(moduleId: string): any;

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.jpeg' {
  const value: number;
  export default value;
}

declare module '*.jfif' {
  const value: number;
  export default value;
}