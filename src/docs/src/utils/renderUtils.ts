export type Margin = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export function getMargin(
  margin?: Margin,
  defaultMargin: Partial<Margin> = { top: 20, bottom: 20, left: 20, right: 20 },
) {
  return Object.assign(
    { top: 0, bottom: 0, left: 0, right: 0 },
    defaultMargin,
    margin ?? {},
  );
}
