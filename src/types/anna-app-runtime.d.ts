declare module '@anna-ai/app-runtime' {
  export class AnnaAppRuntime {
    static connect(options?: Record<string, any>): Promise<any>;
  }
  export default AnnaAppRuntime;
}
