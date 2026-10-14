/** Garden artwork, shared by all five level badges and the blooming-tree stat. */
export function LevelArtwork({ stage }: { stage: number }) {
  return (
    <>
      <ellipse cx="40" cy="69" rx="25" ry="5" fill="#416b3b" opacity=".14" />
      <path d="M17 67q5-5 10-2h27q7-3 11 2" fill="#b6cb85" />
      {stage === 1 && (
        <>
          <path
            d="M40 63c-16 0-18-14-7-28 2-3 5-6 7-10 3 6 17 15 16 26-1 8-8 12-16 12Z"
            fill="#d8ab6b"
            stroke="#795331"
            strokeWidth="2.8"
          />
          <path
            d="M40 57q-7-9 0-24"
            fill="none"
            stroke="#fff0cb"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M42 26q-1-14 14-16-1 13-14 16Z"
            fill="#94b66d"
            stroke="#386a46"
            strokeWidth="2.8"
          />
        </>
      )}
      {stage === 2 && (
        <>
          <path
            d="M40 66V36"
            stroke="#52763e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 48C25 48 18 39 18 27c15-1 24 8 22 21Z"
            fill="#97c36d"
            stroke="#386a46"
            strokeWidth="2.8"
          />
          <path
            d="M40 37c-1-15 10-23 23-22 0 14-10 24-23 22Z"
            fill="#5b9959"
            stroke="#386a46"
            strokeWidth="2.8"
          />
          <path
            d="m26 34 14 14m0-11 14-14"
            stroke="#d6e9ab"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {stage >= 3 && (
        <>
          <path
            d="M36 67 38 38h5l3 29Z"
            fill="#b88b58"
            stroke="#795331"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="m40 51-12-12m13 7 12-13"
            stroke="#795331"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 45C8 42 10 28 20 26c-1-13 13-18 22-10 8-9 22-4 22 9 12 4 12 18 1 22-5 9-19 10-25 2-6 8-17 5-20-4Z"
            fill={stage === 3 ? "#9ac475" : stage === 5 ? "#4f9c61" : "#70ab64"}
            stroke="#386a46"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M23 28q1-7 10-7m11 1q6-5 12 2"
            fill="none"
            stroke="#d6e9ab"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M22 42q6 7 16 3m9 0q10 6 16-2"
            fill="none"
            stroke="#477e48"
            strokeWidth="2"
            opacity=".65"
          />
        </>
      )}
      {stage === 4 &&
        [
          [25, 34],
          [48, 27],
          [57, 43],
        ].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path
              d="M0-5c4-7 10-3 8 2 8 2 5 9-1 8-1 8-9 7-10 0-8 0-9-7-2-9-2-7 4-9 5-1Z"
              fill="#f4c8b0"
              stroke="#9c573a"
              strokeWidth="1.6"
            />
            <circle r="2.5" fill="#ffe5a3" stroke="#9c573a" strokeWidth="1" />
          </g>
        ))}
      {stage === 5 &&
        [
          [21, 32],
          [40, 25],
          [58, 34],
          [30, 46],
          [49, 47],
        ].map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <path
              d="M0-5v-4m0 2q2-5 7-3"
              fill="none"
              stroke="#386a46"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle r="6" fill="#efb653" stroke="#986428" strokeWidth="1.8" />
            <path
              d="M-2-3q-2 1-2 3"
              fill="none"
              stroke="#ffedb7"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        ))}
    </>
  );
}
