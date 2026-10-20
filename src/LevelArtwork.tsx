/** Approved 3D artwork shared by chapter levels, badges and class gardens. */
export function LevelArtwork({ stage }: { stage: number }) {
  return (
    <image
      href={`/assets/student-levels-3d-v1/level-${stage}.webp`}
      x="0"
      y="0"
      width="80"
      height="80"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    />
  );
}
