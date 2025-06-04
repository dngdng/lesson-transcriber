// Shared video sorting utility
export const sortVideos = (videos) => {
  return [...videos]
    .sort((a, b) => {
      // Files with "_" prefix go to top
      const aHasUnderscore = a.name.startsWith('_');
      const bHasUnderscore = b.name.startsWith('_');
      if (aHasUnderscore && !bHasUnderscore) return -1;
      if (!aHasUnderscore && bHasUnderscore) return 1;
      return 0;
    })
    .reverse();
};