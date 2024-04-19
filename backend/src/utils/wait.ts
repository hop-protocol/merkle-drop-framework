export const wait = async (t: number) => {
  return await new Promise(resolve => setTimeout(() => resolve(null), t))
}
