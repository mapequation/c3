export function ColorBar({ colors }: { colors: string[] }) {
  return (
    <div className="colorbar" role="img" aria-label={`Bar of ${colors.length} colors in order`}>
      {colors.map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </div>
  );
}
