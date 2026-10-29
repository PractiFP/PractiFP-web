import React from 'react';

export default function Tags({ techs, mine = [] }) {
  const minLower = mine.map((t) => t.toLowerCase());
  return (
    <div className="tags">
      {techs.map((t) => (
        <span key={t} className={`tag${minLower.includes(t.toLowerCase()) ? ' has' : ''}`}>{t}</span>
      ))}
    </div>
  );
}
